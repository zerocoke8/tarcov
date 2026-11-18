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
  const motion = clip.motion.replaceAll('{weapon}', sub.weapon || 'its body');
  const ending = clip.loop
    ? 'The motion loops seamlessly: the video ends in exactly the same pose as the first frame.'
    : clip.last === 'same'
      ? 'The character starts from the idle pose of the first frame and is back in that same idle pose at the end of the video.'
      : 'The character starts from the idle pose of the first frame.';
  return `${motion}
${ending}
Game sprite animation. The character stays in the same spot in the center of the frame at the same size, and keeps exactly the same design, proportions and flat cel-shaded art style as the first frame. Fixed locked-off camera: no zoom, no pan, no rotation.
The background stays one perfectly flat solid ${key.text} color for the whole video: no ground, no shadow, no dust, no particles, no glow, no light effects, no motion trails, no text.`;
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
  if (existsSync(target) && !opts.force) {
    console.log(`이미 있음: ${relative(process.cwd(), target)} (다시 만들려면 --force)`);
    return;
  }
  if (!existsSync(p.base(dir))) fail(`기본 이미지가 없습니다. 먼저 실행: npm run art -- image ${id} ${dir}`);
  ensureDir(dirname(target));

  // 진행 중이던 작업이 있으면 새로 만들지 않고 이어서 기다린다 (중간에 끊겨도 요금을 두 번 내지 않게)
  let info = readJson(p.videoInfo(anim, dir));
  if (!info || info.status === 'succeeded' || info.status === 'failed' || opts.force) {
    const size = num('video.inputSize');
    const png = await sharp(p.base(dir)).resize(size, size, { fit: 'contain', background: { r: KEYS[sub.key].rgb[0], g: KEYS[sub.key].rgb[1], b: KEYS[sub.key].rgb[2] } }).removeAlpha().png().toBuffer();
    const image = { type: 'image_url', image_url: { url: `data:image/png;base64,${png.toString('base64')}` } };
    const prompt = videoPrompt(sub, clip);
    const content = [{ type: 'text', text: prompt }, { ...image, role: 'first_frame' }];
    if (clip.last === 'same') content.push({ ...image, role: 'last_frame' });
    const body = {
      model: opts.model ?? setting('video.model'),
      content,
      resolution: setting('video.resolution'),
      // 첫 프레임을 주는 작업은 비율을 지정할 수 없고, 첫 프레임 이미지의 비율(1:1)을 따른다
      ratio: 'adaptive',
      duration: clip.seconds,
      generate_audio: false,
      watermark: false,
    };
    const created = await api('', { method: 'POST', body: JSON.stringify(body) });
    info = { task: created.id, status: 'queued', model: body.model, resolution: body.resolution, seconds: clip.seconds, prompt, createdAt: new Date().toISOString() };
    writeJson(p.videoInfo(anim, dir), info);
    console.log(`[${tag}] 작업 생성: ${info.task} (예상 $${estimateCost(clip.seconds).toFixed(2)})`);
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
      writeJson(p.videoInfo(anim, dir), info);
      console.log(`[${tag}] 저장: ${relative(process.cwd(), target)} (${tokens.toLocaleString()} 토큰, 약 $${info.cost.toFixed(2)})`);
      return;
    }
    if (t.status === 'failed' || t.status === 'cancelled' || t.status === 'expired') {
      Object.assign(info, { status: 'failed', error: t.error ?? t.status });
      writeJson(p.videoInfo(anim, dir), info);
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

