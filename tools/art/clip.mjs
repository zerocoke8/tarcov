// 3단계: 동작 영상에서 프레임을 뽑아 스프라이트 프레임으로 만든다.
// 배경색 제거 → 쓸 구간 찾기(반복 주기 / 움직이는 구간) → 프레임 고르기 → 기본 이미지의 발 위치·키에 맞춰 정렬·축소.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';
import { alphaBox, bodyMetrics, borderKey, chromaKey, findAction, findCycle, peakMotion, pickByMotion, pickFrames, removeSpecks, shrinkAlpha, thumb, thumbDist } from './lib/pixels.ts';
import { ArtError, KEYS, clipFor, ensureDir, fail, loadImage, needTool, num, paths, readJson, subject, toSharp, writeJson } from './lib/common.mjs';
import { measureBase } from './image.mjs';

const FFMPEG_HINT = 'ffmpeg 를 설치하고 PATH에 넣어 주세요 (Windows: winget install Gyan.FFmpeg)';

/** 영상을 RGBA 프레임들로 푼다 */
function decode(file) {
  needTool('ffprobe', FFMPEG_HINT);
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'json', file], { encoding: 'utf8' });
  if (probe.status !== 0) fail(`영상을 읽지 못했습니다: ${file}\n${probe.stderr}`);
  const st = JSON.parse(probe.stdout).streams[0];
  const [a, b] = st.r_frame_rate.split('/').map(Number);
  const fps = b ? a / b : a;
  const size = st.width * st.height * 4;
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: size * 1200 });
  if (r.status !== 0) fail(`영상 프레임을 풀지 못했습니다: ${file}\n${r.stderr}`);
  const count = Math.floor(r.stdout.length / size);
  const frames = [];
  for (let i = 0; i < count; i++) frames.push({ w: st.width, h: st.height, data: new Uint8Array(r.stdout.buffer, r.stdout.byteOffset + i * size, size) });
  return { frames, fps, w: st.width, h: st.height };
}

const hueOf = ([r, g, b]) => Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b);

/** 프레임 폴더를 비우고 새로 만든다 */
function resetDir(out) {
  if (existsSync(out)) for (const f of readdirSync(out)) rmSync(join(out, f));
  return ensureDir(out);
}

/**
 * 배경을 뺀 그림 한 장을 여백 없이 잘라, 게임 크기로 줄여 저장한다.
 * 발 위치(기본 이미지에서 잰 값)를 프레임 기준점으로 기록한다. 그림이 비었으면 null.
 */
async function writeFrame(img, base, sub, out, file) {
  removeSpecks(img, num('key.speck'));
  const box = alphaBox(img);
  if (!box) return null;
  const scale = (sub.height * num('sheet.texScale')) / (base.height * img.h);
  const w = Math.max(1, Math.round(box.w * scale));
  const h = Math.max(1, Math.round(box.h * scale));
  await toSharp(img).extract({ left: box.x, top: box.y, width: box.w, height: box.h }).resize(w, h, { kernel: 'lanczos3', fit: 'fill' }).png().toFile(join(out, file));
  const clipped = box.x <= 1 || box.y <= 1 || box.x + box.w >= img.w - 1 || box.y + box.h >= img.h - 1;
  return { file, w, h, ax: +(((base.footX * img.w - box.x) * w) / box.w).toFixed(1), ay: +(((base.footY * img.h - box.y) * h) / box.h).toFixed(1), clipped };
}

/**
 * 영상 없이 기본 이미지 한 장으로 "정지 대기 동작"을 만든다.
 * 영상을 만들기 전에도 캐릭터를 게임에 넣어 그림체와 크기를 확인할 수 있다 (요금이 들지 않는다).
 */
export async function makeStill(id, dir) {
  const sub = subject(id);
  const p = paths(id);
  if (!existsSync(p.base(dir))) fail(`기본 이미지가 없습니다. 먼저 실행: npm run art -- image ${id} ${dir}`);
  const base = readJson(p.baseInfo(dir)) ?? (await measureBase(sub, dir));
  const img = await loadImage(p.base(dir));
  chromaKey(img, borderKey(img), { lo: num('key.lo'), hi: num('key.hi'), hue: num('key.hue') });
  shrinkAlpha(img, num('key.shrink'));
  const out = resetDir(p.clipDir('Idle', dir));
  const frame = await writeFrame(img, base, sub, out, '00.png');
  if (!frame) fail(`[${id} Idle ${dir}] 기본 이미지에서 배경을 뺐더니 아무것도 남지 않았습니다`);
  const { clipped: _c, ...entry } = frame;
  writeJson(join(out, 'clip.json'), { id, anim: 'Idle', dir, loop: true, fps: 1, frames: [entry], source: { how: '기본 이미지(정지)' } });
  await preview(out, [entry], { fps: 1 });
  console.log(`[${id} Idle ${dir}] 기본 이미지로 정지 대기 동작 1장 → ${relative(process.cwd(), out)}`);
}

export async function makeClip(id, anim, dir, opts = {}) {
  const sub = subject(id);
  const clip = clipFor(sub, anim);
  const p = paths(id);
  const video = p.video(anim, dir);
  const tag = `${id} ${anim} ${dir}`;
  if (clip.alias) fail(`[${tag}] 이 동작은 ${clip.alias} 의 프레임을 그대로 쓰므로 따로 만들지 않습니다 (data/art/clips.csv 의 range)`);
  if (!existsSync(video)) fail(`영상이 없습니다. 먼저 실행: npm run art -- video ${id} ${anim} ${dir}`);
  if (!existsSync(p.base(dir))) fail(`기본 이미지가 없습니다. 먼저 실행: npm run art -- image ${id} ${dir}`);
  let base = readJson(p.baseInfo(dir)) ?? (await measureBase(sub, dir));
  // 영상을 만들 때 기본 이미지를 줄여 넣었으면(여백 확보) 발 위치와 키도 같은 비율로 옮긴다
  const inset = readJson(p.videoInfo(anim, dir))?.inset ?? 1;
  if (inset !== 1) base = { ...base, footX: 0.5 + (base.footX - 0.5) * inset, footY: 0.5 + (base.footY - 0.5) * inset, height: base.height * inset };

  const { frames, fps, w: W, h: H } = decode(video);
  if (frames.length < 4) fail(`[${tag}] 영상 프레임이 ${frames.length}장뿐입니다`);

  // 배경 제거. 영상은 프레임마다 배경색이 조금씩 흔들리므로 프레임마다 배경색을 다시 잰다
  const keyOpts = { lo: num('key.lo'), hi: num('key.hi'), hue: num('key.hue') };
  const want = hueOf(KEYS[sub.key].rgb);
  let drift = 0;
  const thumbs = frames.map((f) => {
    const key = borderKey(f);
    let d = Math.abs(hueOf(key) - want);
    if (d > Math.PI) d = Math.PI * 2 - d;
    drift = Math.max(drift, d);
    chromaKey(f, key, keyOpts);
    shrinkAlpha(f, num('key.shrink'));
    return thumb(f);
  });
  if (drift > 0.5) console.log(`[${tag}] 주의: 영상 배경이 지정한 ${sub.key} 색에서 벗어났습니다. 미리 보기에서 배경이 깨끗이 빠졌는지 확인하세요`);

  // 영상의 첫 프레임이 기본 이미지와 같은 자리·크기인지 확인한다 (어긋나면 동작끼리 캐릭터가 튄다)
  const firstBox = alphaBox(frames[0]);
  if (firstBox && !base.manual) {
    const m = bodyMetrics(frames[0], firstBox);
    const off = Math.max(Math.abs(m.footX / W - base.footX), Math.abs(m.footY / H - base.footY), Math.abs(m.height / H - base.height));
    if (off > 0.03) console.log(`[${tag}] 주의: 영상 첫 프레임이 기본 이미지와 ${(off * 100).toFixed(1)}% 어긋납니다 (카메라가 움직였거나 캐릭터 크기가 바뀜). 다시 생성하는 것을 권합니다`);
  }

  // 쓸 구간
  const n = frames.length;
  const sec = (v) => Math.max(0, Math.min(n - 1, Math.round(Number(v) * fps)));
  let range;
  let how;
  const manual = opts.from !== undefined || opts.to !== undefined ? `${opts.from ?? 0}-${opts.to ?? n / fps}` : /^\d/.test(clip.range) ? clip.range : null;
  if (manual) {
    const [a, b] = manual.split('-');
    range = { start: sec(a), end: sec(b) };
    how = '직접 지정';
  } else if (clip.range === 'cycle') {
    range = findCycle(thumbs, Math.round(num('clip.cycleMin') * fps), Math.round(num('clip.cycleMax') * fps));
    how = '반복 주기 자동';
  } else if (clip.range === 'action') {
    range = findAction(thumbs, num('clip.actionPad'), num('clip.actionThreshold'));
    how = '움직이는 구간 자동';
  } else {
    range = { start: 0, end: n - 1 };
    how = '영상 전체';
  }
  if (range.end <= range.start) fail(`[${tag}] 구간이 비었습니다 (${range.start}~${range.end} 프레임). --from / --to 로 직접 지정해 보세요`);
  const count = opts.frames ? Number(opts.frames) : clip.frames;
  // 반복 동작은 시간 간격으로 고르게, 단발 동작은 움직임이 많은 곳에서 촘촘하게 고른다
  const picked = clip.loop ? pickFrames(range, count, true) : pickByMotion(thumbs, range, count, num('clip.motionMix'));
  // 단발 동작은 프레임마다 원래 영상에서의 시점(0~1)을 남겨, 게임에서 원래의 빠르기 변화대로 재생한다
  const timeOf = (i) => +((i - range.start) / (range.end - range.start)).toFixed(3);
  const impact = clip.impact === 'auto' ? +peakMotion(thumbs, range).toFixed(3) : clip.impact;

  // 달리기처럼 발이 땅에 닿아야 하는 동작은, 영상에서 캐릭터가 통째로 떠올랐더라도 가장 낮게 디딘 발을 발밑 기준선에 맞춘다
  let ground = base;
  if (clip.ground === 'snap') {
    let low = 0;
    for (const i of picked) {
      removeSpecks(frames[i], num('key.speck'));
      const box = alphaBox(frames[i]);
      if (box) low = Math.max(low, bodyMetrics(frames[i], box).footY);
    }
    if (low > 0) {
      ground = { ...base, footY: low / H };
      const shift = ((base.footY - ground.footY) / base.height) * 100;
      if (Math.abs(shift) > 1) console.log(`[${tag}] 발 높이 보정: 영상에서 키의 ${Math.abs(shift).toFixed(0)}%만큼 ${shift > 0 ? '떠' : '가라앉아'} 있어 기준선에 맞췄습니다`);
    }
  }

  // 프레임 저장
  const out = resetDir(p.clipDir(anim, dir));
  const list = [];
  let clipped = 0;
  for (const [k, i] of picked.entries()) {
    const frame = await writeFrame(frames[i], ground, sub, out, `${String(k).padStart(2, '0')}.png`);
    if (!frame) {
      console.log(`[${tag}] 주의: ${i}번 프레임에 캐릭터가 없어 건너뜁니다`);
      continue;
    }
    if (frame.clipped) clipped++;
    if (!clip.loop) frame.t = timeOf(i);
    list.push(frame);
  }
  if (!list.length) fail(`[${tag}] 쓸 수 있는 프레임이 없습니다`);
  if (clipped) console.log(`[${tag}] 주의: 프레임 ${clipped}장에서 그림이 영상 가장자리에 닿았습니다 (무기 끝이 잘렸을 수 있음). preview.png 를 확인하세요`);

  const seam = clip.loop ? thumbDist(thumbs[range.start], thumbs[range.end]) : 0;
  writeJson(join(out, 'clip.json'), {
    id,
    anim,
    dir,
    loop: clip.loop,
    fps: clip.fps,
    impact: impact || undefined,
    frames: list.map(({ file, w, h, ax, ay, t }) => ({ file, w, h, ax, ay, t })),
    source: { fps, total: n, range: [range.start, range.end], picked, how },
  });
  await preview(out, list, clip);

  const t = (i) => (i / fps).toFixed(2);
  console.log(`[${tag}] 프레임 ${list.length}장 (${how}: ${t(range.start)}~${t(range.end)}초 / 전체 ${t(n)}초${impact ? `, 타격 지점 ${impact}` : ''}) → ${relative(process.cwd(), out)}`);
  if (clip.loop && seam > 0.02) console.log(`[${tag}] 주의: 반복 이음새가 매끄럽지 않을 수 있습니다 (차이 ${seam.toFixed(3)}). preview.gif 를 확인하세요`);
}

/**
 * 미리 보기에서 프레임마다 머무는 시간(ms).
 * 단발 동작은 게임과 같은 방식(프레임 시점의 중간에서 넘어감)으로, 원래 영상 길이의 절반 속도로 보여 준다.
 */
function frameDelays(list, clip) {
  if (clip.loop || list.some((f) => f.t === undefined)) return Math.round(1000 / clip.fps);
  const total = Math.max(600, (list.length / clip.fps) * 1000);
  return list.map((f, i) => {
    const from = i === 0 ? 0 : (list[i - 1].t + f.t) / 2;
    const to = i === list.length - 1 ? 1 : (f.t + list[i + 1].t) / 2;
    return Math.max(30, Math.round((to - from) * total));
  });
}

/** 확인용 그림: 프레임을 발 위치에 맞춰 나란히 놓은 preview.png 와 움직이는 preview.gif */
async function preview(dir, list, clip) {
  const pad = 6;
  const left = Math.ceil(Math.max(...list.map((f) => f.ax))) + pad;
  const right = Math.ceil(Math.max(...list.map((f) => f.w - f.ax))) + pad;
  const top = Math.ceil(Math.max(...list.map((f) => f.ay))) + pad;
  const bottom = Math.ceil(Math.max(...list.map((f) => f.h - f.ay))) + pad + 4;
  const cw = left + right;
  const ch = top + bottom;
  const bg = { r: 58, g: 63, b: 75, alpha: 1 };
  const place = (f, ox) => ({ input: join(dir, f.file), left: Math.round(ox + left - f.ax), top: Math.round(top - f.ay) });

  const line = Buffer.from(`<svg width="${cw * list.length}" height="${ch}"><rect x="0" y="${top}" width="${cw * list.length}" height="1" fill="#ffd84a" opacity="0.7"/></svg>`);
  await sharp({ create: { width: cw * list.length, height: ch, channels: 4, background: bg } })
    .composite([{ input: line, left: 0, top: 0 }, ...list.map((f, i) => place(f, i * cw))])
    .png()
    .toFile(join(dir, 'preview.png'));

  const cells = await Promise.all(
    list.map((f) =>
      sharp({ create: { width: cw, height: ch, channels: 4, background: bg } })
        .composite([place(f, 0)])
        .png()
        .toBuffer(),
    ),
  );
  // 한 장뿐이면 움직이는 그림은 만들지 않는다
  if (cells.length < 2) return;
  await sharp(cells, { join: { animated: true } })
    .gif({ delay: frameDelays(list, clip), loop: 0 })
    .toFile(join(dir, 'preview.gif'));
}

export async function run(args, opts) {
  const [id, anim, dir] = args;
  if (!id || !anim) throw new ArtError('사용법: npm run art -- clip <id> <동작> [방향] [--from 초] [--to 초] [--frames 장수]');
  const sub = subject(id);
  for (const d of dir ? [dir] : sub.dirs) await makeClip(id, anim, d, opts);
}

export async function runStill(args) {
  const [id, dir] = args;
  if (!id) throw new ArtError('사용법: npm run art -- still <id> [방향]');
  const sub = subject(id);
  for (const d of dir ? [dir] : sub.dirs) await makeStill(id, d);
}
