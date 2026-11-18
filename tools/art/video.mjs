// 2단계: Seedance(BytePlus ModelArk)로 동작 영상을 만든다.
// 기본 이미지를 첫 프레임으로 주고, 반복·복귀 동작은 끝 프레임도 같은 이미지로 지정해 처음과 끝이 이어지게 한다.
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';
import sharp from 'sharp';
import { ArtError, KEYS, clipFor, ensureDir, envKey, fail, num, paths, readJson, setting, sleep, subject, writeJson } from './lib/common.mjs';

const API = 'https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks';

/** 해상도별 1:1 영상의 한 변 크기 (비용 추정용) */
const SIDE = { '480p': 640, '720p': 960, '1080p': 1440 };

/** 영상 한 편의 예상 비용(달러). 토큰 = 길이 x 가로 x 세로 x fps / 1024 */
export function estimateCost(seconds) {
  const side = SIDE[setting('video.resolution')] ?? 960;
  const tokens = (seconds * side * side * num('video.fps')) / 1024;
  return (tokens / 1e6) * num('video.price');
}

export function videoPrompt(sub, clip) {
  const key = KEYS[sub.key];
  const motion = clip.motion.replaceAll('{weapon}', sub.weapon || 'weapon');
  const ending = clip.loop
    ? 'The motion loops seamlessly: the video ends in exactly the same pose as the first frame.'
    : clip.last === 'same'
      ? 'The character starts from the idle pose of the first frame and is back in that same idle pose at the end of the video.'
      : 'The character starts from the idle pose of the first frame.';
  // 이펙트는 게임이 따로 그리지만, 공격 동작은 무기를 따라가는 흰 검기(trail)나 총구 섬광(flash)만 허용해 움직임이 살아 보이게 한다.
  // (색이 있는 불꽃·먼지는 배경색 제거에서 지저분하게 남는다)
  const fx =
    clip.fx === 'trail'
      ? 'The only visual effect allowed is a clean pure white crescent slash trail that follows the weapon during the swing. No sparks, no dust, no particles, no glow, no colored effects.'
      : clip.fx === 'flash'
        ? 'The only visual effect allowed is one small, short, bright muzzle flash right at the tip of the gun barrel at the moment of each shot. Absolutely no smoke, no dust clouds, no sparks, no shell casings, no particles, no glow.'
        : 'No visual effects at all: no dust, no particles, no glow, no light effects, no motion trails.';
  return `${motion}
${ending}
Game sprite animation. The character stays in the same spot in the center of the frame at the same size, and keeps exactly the same design, proportions and flat cel-shaded art style as the first frame. Fixed locked-off camera: no zoom, no pan, no rotation. The whole character and weapon stay fully inside the frame at all times.
The background stays one perfectly flat solid ${key.text} color for the whole video: no ground, no shadow, no text.
${fx}`;
}

async function api(path, init) {
  const res = await fetch(API + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${envKey('ARK_API_KEY')}` },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 300) };
  }
  if (!res.ok) {
    const e = body.error ?? body;
    fail(`영상 생성 API 오류 (${res.status}): ${e.code ?? ''} ${e.message ?? JSON.stringify(e).slice(0, 300)}`);
  }
  return body;
}

export async function makeVideo(id, anim, dir, opts = {}) {
  const sub = subject(id);
  const clip = clipFor(sub, anim);
  const p = paths(id);
  const target = p.video(anim, dir);
  const tag = `${id} ${anim} ${dir}`;
  if (clip.alias) fail(`[${tag}] 이 동작은 ${clip.alias} 의 프레임을 그대로 쓰므로 영상을 만들지 않습니다 (data/art/clips.csv 의 range)`);
  if (existsSync(target) && !opts.force) {
    console.log(`이미 있음: ${relative(process.cwd(), target)} (다시 만들려면 --force)`);
    return;
  }
  if (!existsSync(p.base(dir))) fail(`기본 이미지가 없습니다. 먼저 실행: npm run art -- image ${id} ${dir}`);

  await runTask({
    tag,
    infoPath: p.videoInfo(anim, dir),
    target,
    force: opts.force,
    seconds: clip.seconds,
    model: opts.model,
    build: async () => {
      // 단발 동작은 기본 이미지를 가운데에 줄여 넣고 둘레를 배경색으로 채워 보낸다.
      // 여백이 넉넉해야 휘두른 무기가 화면 밖으로 잘리지 않는다
      const size = num('video.inputSize');
      const inset = clip.loop ? 1 : num('video.inset');
      const inner = Math.round(size * inset);
      const bg = { r: KEYS[sub.key].rgb[0], g: KEYS[sub.key].rgb[1], b: KEYS[sub.key].rgb[2] };
      const small = await sharp(p.base(dir)).resize(inner, inner, { fit: 'contain', background: bg }).removeAlpha().png().toBuffer();
      const png = await sharp({ create: { width: size, height: size, channels: 3, background: bg } })
        .composite([{ input: small, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }])
        .png()
        .toBuffer();
      return { prompt: videoPrompt(sub, clip), first: png, last: clip.last === 'same' ? png : null, note: { inset } };
    },
  });
}

/**
 * 영상 생성 작업 하나를 만들고(또는 진행 중이던 작업을 이어받아) 끝날 때까지 기다린 뒤 파일로 저장한다.
 * build() 는 새 작업을 만들 때만 불리며 { prompt, first, last, note } 를 돌려준다 (first·last 는 PNG 버퍼, last 는 없어도 된다).
 * 진행 상황은 infoPath 에 적어 두므로, 중간에 끊겨도 같은 호출을 다시 하면 요금을 두 번 내지 않는다.
 */
export async function runTask({ tag, infoPath, target, force, seconds, model, build }) {
  ensureDir(dirname(target));
  let info = readJson(infoPath);
  if (!info || info.status === 'succeeded' || info.status === 'failed' || force) {
    const made = await build();
    const img = (png) => ({ type: 'image_url', image_url: { url: `data:image/png;base64,${png.toString('base64')}` } });
    const content = [{ type: 'text', text: made.prompt }, { ...img(made.first), role: 'first_frame' }];
    if (made.last) content.push({ ...img(made.last), role: 'last_frame' });
    const body = {
      model: model ?? setting('video.model'),
      content,
      resolution: setting('video.resolution'),
      // 첫 프레임을 주는 작업은 비율을 지정할 수 없고, 첫 프레임 이미지의 비율(1:1)을 따른다
      ratio: 'adaptive',
      duration: seconds,
      generate_audio: false,
      watermark: false,
    };
    const created = await api('', { method: 'POST', body: JSON.stringify(body) });
    info = { task: created.id, status: 'queued', model: body.model, resolution: body.resolution, seconds, ...made.note, prompt: made.prompt, createdAt: new Date().toISOString() };
    writeJson(infoPath, info);
    console.log(`[${tag}] 작업 생성: ${info.task} (예상 $${estimateCost(seconds).toFixed(2)})`);
  } else {
    console.log(`[${tag}] 진행 중이던 작업을 이어서 기다립니다: ${info.task}`);
  }

  const deadline = Date.now() + num('video.timeoutSeconds') * 1000;
  let last = '';
  for (;;) {
    const t = await api(`/${info.task}`, { method: 'GET' });
    if (t.status !== last) {
      last = t.status;
      console.log(`[${tag}] ${t.status}`);
    }
    if (t.status === 'succeeded') {
      const res = await fetch(t.content.video_url);
      if (!res.ok) fail(`[${tag}] 영상을 내려받지 못했습니다 (${res.status})`);
      writeFileSync(target, Buffer.from(await res.arrayBuffer()));
      const tokens = t.usage?.completion_tokens ?? 0;
      Object.assign(info, { status: 'succeeded', tokens, cost: +((tokens / 1e6) * num('video.price')).toFixed(4), seed: t.seed });
      writeJson(infoPath, info);
      console.log(`[${tag}] 저장: ${relative(process.cwd(), target)} (${tokens.toLocaleString()} 토큰, 약 $${info.cost.toFixed(2)})`);
      return;
    }
    if (t.status === 'failed' || t.status === 'cancelled' || t.status === 'expired') {
      Object.assign(info, { status: 'failed', error: t.error ?? t.status });
      writeJson(infoPath, info);
      fail(`[${tag}] 영상 생성 실패: ${t.error?.code ?? ''} ${t.error?.message ?? t.status}. 실패한 작업은 요금이 청구되지 않습니다`);
    }
    if (Date.now() > deadline) fail(`[${tag}] ${num('video.timeoutSeconds')}초 안에 끝나지 않았습니다. 같은 명령을 다시 실행하면 이 작업(${info.task})을 이어서 기다립니다`);
    await sleep(num('video.pollSeconds') * 1000);
  }
}

/** 여러 작업을 동시 실행 한도 안에서 돌린다. 하나가 실패해도 나머지는 계속한다 */
export async function makeVideos(jobs, opts) {
  const queue = [...jobs];
  const errors = [];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      try {
        await makeVideo(job.id, job.anim, job.dir, opts);
      } catch (err) {
        if (!(err instanceof ArtError)) throw err;
        errors.push(err.message);
        console.log(err.message);
        // 계정의 사용 한도에 걸리면 남은 작업도 전부 같은 이유로 실패하므로 여기서 멈춘다
        if (/SetLimitExceeded|AccountOverdue|InsufficientBalance/i.test(err.message)) {
          const left = queue.length;
          queue.length = 0;
          console.log(`
계정의 사용 한도에 도달해 영상 생성을 멈췄습니다 (남은 ${left}편은 시작하지 않음).
BytePlus ModelArk 콘솔의 Model Activation 페이지에서 해당 모델의 "Safe Experience Mode" 한도를 올리거나 끈 뒤 같은 명령을 다시 실행하세요. 이미 만든 영상은 건너뜁니다.`);
        }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(num('video.parallel'), jobs.length)) }, worker));
  return errors;
}

export async function run(args, opts) {
  const [id, anim, dir] = args;
  if (!id || !anim) throw new ArtError('사용법: npm run art -- video <id> <동작> [방향] [--force]');
  const sub = subject(id);
  clipFor(sub, anim);
  const errors = await makeVideos((dir ? [dir] : sub.dirs).map((d) => ({ id, anim, dir: d })), opts);
  if (errors.length) throw new ArtError(`${errors.length}건 실패`);
}

