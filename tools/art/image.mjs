// 1단계: Codex 이미지 생성 도구로 SD 캐릭터의 "기본 이미지"(방향별 대기 자세, 단색 배경)를 만든다.
// 이 이미지가 모든 동작 영상의 첫 프레임이 되므로, 크기·위치·그림체의 기준이 된다.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative } from 'node:path';
import { alphaBox, bodyMetrics, borderKey, chromaKey } from './lib/pixels.ts';
import { ArtError, KEYS, REF_DIR, ensureDir, fail, loadImage, paths, setting, subject, writeJson } from './lib/common.mjs';

const VIEW = {
  S: 'front view: facing straight toward the viewer (toward the bottom of the picture)',
  SE: 'front three-quarter view: body and face turned toward the lower-right of the picture',
  SW: 'front three-quarter view: body and face turned toward the lower-left of the picture',
  E: 'side view: facing the right edge of the picture',
  W: 'side view: facing the left edge of the picture',
  NE: 'back three-quarter view: seen from behind, body turned toward the upper-right of the picture, so we mostly see her back and the back of her head',
  NW: 'back three-quarter view: seen from behind, body turned toward the upper-left of the picture, so we mostly see her back and the back of her head',
  N: 'back view: facing straight away from the viewer (toward the top of the picture)',
};

export function imagePrompt(sub, dir, hasFront) {
  const key = KEYS[sub.key];
  const who =
    sub.kind === 'char'
      ? `A chibi / super-deformed game sprite of the girl in the first attached reference image, about 2.5 heads tall (big head, small body), for a 2D top-down action RPG.\nKeep her design: ${sub.design}.\nShe wields a ${sub.weapon}.`
      : `A game sprite of this creature for a 2D top-down action RPG: ${sub.design}.`;
  return `Use your built-in image generation tool to create ONE image${sub.ref || hasFront ? ', using the attached image(s) as the design reference' : ''}. Then copy the generated PNG file into the current working directory as base_${dir}.png. Do not draw the image with code, do not write any other files, and do not modify anything else. When done, reply with only the absolute path of the generated source file.

IMAGE TO GENERATE
${who}
${hasFront ? 'The last attached image is the approved sprite of this same character from another angle: match its proportions, colors, line style and size exactly.\n' : ''}Pose: relaxed standing idle pose, full body including feet, weapon lowered. View: ${VIEW[dir]}, seen from a slightly elevated camera.
Style: clean anime cel shading, crisp dark outlines, flat colors, no painterly texture.
Composition: square 1:1 image. The character is centered and small: the height is about 45% of the image height, with wide empty margins on every side (the margins are needed later for weapon swings).
Background: one perfectly flat solid ${key.text} color filling the entire image. No ground, no cast shadow, no gradient, no text, no border, no other objects. Do not use the background color anywhere on the character.`;
}

const codexHome = () => process.env.CODEX_HOME || join(homedir(), '.codex');

const listGenerated = () => {
  const dir = join(codexHome(), 'generated_images');
  return existsSync(dir) ? new Set(readdirSync(dir)) : new Set();
};

/** 기본 이미지에서 발 위치와 키를 잰다. 모든 동작의 프레임이 이 기준으로 정렬된다 */
export async function measureBase(sub, dir) {
  const p = paths(sub.id);
  const img = await loadImage(p.base(dir));
  const key = borderKey(img);
  chromaKey(img, key);
  const box = alphaBox(img);
  if (!box) fail(`${relative(process.cwd(), p.base(dir))}: 배경을 뺐더니 아무것도 남지 않았습니다. 배경색과 캐릭터 색이 겹치는지 확인하세요`);
  const m = sub.anchor
    ? { footX: sub.anchor[0] * img.w, footY: sub.anchor[1] * img.h, height: sub.anchor[2] * img.h }
    : bodyMetrics(img, box);
  const info = {
    w: img.w,
    h: img.h,
    key,
    /** 발 위치와 키 (이미지 크기에 대한 비율) */
    footX: m.footX / img.w,
    footY: m.footY / img.h,
    height: m.height / img.h,
    manual: !!sub.anchor,
  };
  writeJson(p.baseInfo(dir), info);
  return info;
}

export async function makeImage(id, dir, opts = {}) {
  const sub = subject(id);
  if (!sub.dirs.includes(dir)) fail(`${id} 의 방향은 ${sub.dirs.join(' ')} 입니다 (data/art/subjects.csv 의 dirs)`);
  const p = paths(id);
  const target = p.base(dir);
  if (existsSync(target) && !opts.force) {
    console.log(`이미 있음: ${relative(process.cwd(), target)} (다시 만들려면 --force)`);
    return measureBase(sub, dir);
  }
  ensureDir(p.work);

  const images = [];
  if (sub.ref) {
    const ref = join(REF_DIR, sub.ref);
    if (!existsSync(ref)) fail(`원화가 없습니다: ${relative(process.cwd(), ref)}`);
    images.push(ref);
  }
  // 첫 방향이 이미 있으면 그것을 함께 보여 줘 방향끼리 그림체와 크기를 맞춘다
  const front = sub.dirs.map((d) => p.base(d)).find((f) => f !== target && existsSync(f));
  if (front) images.push(front);

  const prompt = imagePrompt(sub, dir, !!front);
  const args = ['exec', '-s', 'workspace-write'];
  if (setting('image.model')) args.push('-m', setting('image.model'));
  for (const f of images) args.push('-i', `"${relative(p.work, f)}"`);
  args.push('-');

  console.log(`Codex로 이미지 생성 중: ${id} ${dir} (1~3분)`);
  const before = listGenerated();
  const started = Date.now();
  // codex는 Windows에서 .cmd 래퍼라 셸을 거쳐 실행한다. 지시문은 표준 입력으로 넘긴다
  const r = spawnSync(`codex ${args.join(' ')}`, { cwd: p.work, input: prompt, encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
  if (r.error) fail(`codex 를 실행할 수 없습니다 (${r.error.message}). Codex CLI 설치와 로그인(codex login)을 확인하세요`);

  if (!existsSync(target) || statSync(target).mtimeMs < started) {
    // Codex가 복사를 빠뜨렸으면 생성 폴더에서 직접 가져온다
    const fresh = [...listGenerated()].filter((d) => !before.has(d)).flatMap((d) => {
      const dirPath = join(codexHome(), 'generated_images', d);
      return readdirSync(dirPath).filter((f) => f.endsWith('.png')).map((f) => join(dirPath, f));
    });
    fresh.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
    if (!fresh.length) {
      const tail = (r.stdout + r.stderr).trim().split('\n').slice(-12).join('\n');
      fail(`Codex가 이미지를 만들지 않았습니다 (종료 코드 ${r.status}). 마지막 출력:\n${tail}`);
    }
    copyFileSync(fresh[0], target);
  }
  const info = await measureBase(sub, dir);
  console.log(`저장: ${relative(process.cwd(), target)} (${info.w}x${info.h}, 키 ${(info.height * 100).toFixed(0)}%)`);
  if (info.height > 0.62) console.log('  주의: 캐릭터가 화면에 크게 잡혔습니다. 공격 동작에서 무기가 화면 밖으로 나갈 수 있으니 다시 만드는 것을 권합니다 (--force)');
  return info;
}

export async function run(args, opts) {
  const [id, dir] = args;
  if (!id) throw new ArtError('사용법: npm run art -- image <id> [방향] [--force]');
  const sub = subject(id);
  for (const d of dir ? [dir] : sub.dirs) await makeImage(id, d, opts);
}
