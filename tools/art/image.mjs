// 1단계: Codex 이미지 생성 도구로 SD 캐릭터의 "기본 이미지"(방향별 대기 자세, 단색 배경)를 만든다.
// 이 이미지가 모든 동작 영상의 첫 프레임이 되므로, 크기·위치·그림체의 기준이 된다.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import sharp from 'sharp';
import { alphaBox, bodyMetrics, borderKey, chromaKey, removeSpecks, shrinkAlpha } from './lib/pixels.ts';
import { ArtError, KEYS, REF_DIR, ROOT, ensureDir, fail, loadImage, num, paths, setting, subject, toSharp, writeJson } from './lib/common.mjs';

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

/**
 * @param refs 함께 넘기는 참고 이미지의 역할 목록 (첨부 순서대로): 'design' 원화, 'style' 그림체 기준, 'angle' 같은 캐릭터의 다른 방향
 */
export function imagePrompt(sub, dir, refs = []) {
  const key = KEYS[sub.key];
  const nth = (role) => ['first', 'second', 'third'][refs.indexOf(role)];
  if (sub.kind === 'pet' && refs.includes('design')) return petPrompt(sub, dir, refs, key, nth);
  if (sub.kind === 'monster') return monsterPrompt(sub, dir, refs, key, nth);
  const who =
    sub.kind !== 'char'
      ? `A game sprite of this creature for a 2D top-down action RPG: ${sub.design}.`
      : refs.includes('design')
        ? `A chibi / super-deformed game sprite of the girl in the ${nth('design')} attached image (her original character design), about 2.5 heads tall (big head, small body), for a 2D top-down action RPG.\nKeep her design: ${sub.design}.\nShe wields a ${sub.weapon}.`
        : `A chibi / super-deformed game sprite of an original anime girl character, about 2.5 heads tall (big head, small body), for a 2D top-down action RPG.\nHer design: ${sub.design}.\nShe wields a ${sub.weapon}.`;
  const notes = [];
  if (refs.includes('style')) notes.push(`The ${nth('style')} attached image is an approved sprite of a DIFFERENT character from the same game. Use it only as the style reference: match its art style, head-to-body proportions, line weight, shading, camera angle, facing direction and the size of the character in the frame exactly. Do not copy that character's hair, face, outfit or weapon.`);
  if (refs.includes('angle')) notes.push(`The ${nth('angle')} attached image is the approved sprite of this same character from another angle: match its proportions, colors, line style and size exactly.`);
  return `Use your built-in image generation tool to create ONE image${refs.length ? ', using the attached image(s) as reference' : ''}. Then copy the generated PNG file into the current working directory as base_${dir}.png. Do not draw the image with code, do not write any other files, and do not modify anything else. When done, reply with only the absolute path of the generated source file.

IMAGE TO GENERATE
${who}
${notes.length ? notes.join('\n') + '\n' : ''}Pose: relaxed standing idle pose, full body including feet, weapon lowered. View: ${VIEW[dir]}, seen from a slightly elevated camera.
Style: clean anime cel shading, crisp dark outlines, flat colors, no painterly texture.
Composition: square 1:1 image. The character is centered and small: the height is about 45% of the image height, with wide empty margins on every side (the margins are needed later for weapon swings).
Background: one perfectly flat solid ${key.text} color filling the entire image. No ground, no cast shadow, no gradient, no text, no border, no other objects. Do not use the background color anywhere on the character.`;
}

/**
 * 펫의 지시문. 이 게임의 펫은 모두 같은 "베이스 바디"에 스킬에 맞는 의상과 소품을 입혀 만든다.
 * 베이스 바디(원화)와, 그렇게 만들어 확정된 펫 한 마리(그림체 기준)를 함께 보여 주고 같은 방식으로 그리게 한다.
 */
function petPrompt(sub, dir, refs, key, nth) {
  const style = refs.includes('style');
  const st = style ? nth('style') : '';
  return `Use your built-in image generation tool to create ONE image, using the attached images as reference. Then copy the generated PNG file into the current working directory as base_${dir}.png. Do not draw the image with code, do not write any other files, and do not modify anything else. When done, reply with only the absolute path of the generated source file.

IMAGE TO GENERATE
A character design for a small floating pet creature in a 2D game.
The ${nth('design')} attached image is the BASE BODY that every pet of this game is built from: a small round ghost-like creature with a plain round body, stubby flipper-like arms, two tiny foot marks, a simple face (two small oval eyes and a tiny mouth) and a wispy ghost tail.
${style ? `The ${st} attached image is an APPROVED pet of the same game, drawn by the game's artist: that same base body dressed up as a plague doctor. The new pet must look like it was drawn by the same artist on the same day, as part of the same set.` : ''}
The new pet: ${sub.design}.
${style ? `THE MOST IMPORTANT REQUIREMENT: reproduce the drawing and coloring technique of the ${st} image exactly.
- Coloring: flat, simple, hand-painted. Each part is filled with ONE flat color, with at most one slightly darker flat tone or a very soft gradient for shadow. Almost no rendering. No realistic materials: no metallic shine, no glossy highlights, no rim light, no bloom or glow halos, no painted textures, no scratches, no small surface details such as rivets, stitches, patches, buckles or cracks.
- Lines: THIN black brush outlines, as thin and delicate as in the ${st} image, slightly uneven and sketchy. Never thick, never heavy cartoon outlines. Some edges of cloth are left as rough ragged brush strokes.
- Level of finish: the same as the ${st} image: simple shapes, but neatly drawn, with two or three small charming ornaments (like that pet's hat band, small gold bow, monocle and pendant). One large piece of headgear, and at most two props.
- Proportions and sense of size: the same as the ${st} image. The creature is ONE small plain round ball (not a big head on top of a body): the face sits on the upper front of that ball, directly under the headgear, exactly where the mask sits in the ${st} image. The ball is small, only about one third of the total height of the figure. The headgear is tall and big compared to the ball. The props are thin, light and simple, held out to the side or hanging below on something thin, so the whole figure has a light, spread-out silhouette instead of one chunky mass.
- Like that pet, it floats in the air, and a few rough brush-stroke wisps of its ghost tail show under its body.
Do not copy that pet's costume or props: no top hat, no bird mask, no cane, no lantern, no feather.` : ''}
View: ${VIEW[dir]}, floating, seen from a slightly elevated camera.
Composition: square 1:1 image. The whole figure including its props is centered and SMALL in the frame: its total height is less than half of the image height, and at least a quarter of the image is left empty on every side.
Background: one perfectly flat solid ${key.text} color filling the entire image. No ground, no cast shadow, no gradient, no text, no border, no other objects. Do not use the background color anywhere on the creature.`;
}

/**
 * 몬스터의 지시문. 확정된 캐릭터 스프라이트 한 장을 그림체 기준으로 함께 보여 주고,
 * 같은 게임의 같은 화가가 그린 것처럼 (선, 채색, 시점, 화면 안에서의 크기) 그리게 한다.
 * 화면 안에서의 크기는 캐릭터와 몬스터의 키(subjects.csv 의 height) 비율로 정한다.
 */
function monsterPrompt(sub, dir, refs, key, nth) {
  const style = refs.includes('style');
  const st = style ? nth('style') : '';
  const base = style ? subject(setting('image.styleRef')).height : 80;
  // 캐릭터는 그림 높이의 45%쯤으로 그려져 있다. 큰 몬스터도 여백이 남게 62%를 넘기지 않는다
  const pct = Math.round(Math.max(26, Math.min(62, (45 * sub.height) / base)));
  return `Use your built-in image generation tool to create ONE image${style ? ', using the attached image as reference' : ''}. Then copy the generated PNG file into the current working directory as base_${dir}.png. Do not draw the image with code, do not write any other files, and do not modify anything else. When done, reply with only the absolute path of the generated source file.

IMAGE TO GENERATE
A game sprite of an enemy monster for a 2D top-down action RPG with cute chibi anime characters.
The monster: ${sub.design}.
${style ? `The ${st} attached image is an approved PLAYER CHARACTER sprite from the same game. The monster must look like it was drawn by the same artist for the same game. Match that sprite exactly in: art style, clean anime cel shading with two or three flat tones per surface, crisp thin dark outlines of the same weight, the same amount of detail, the same slightly elevated camera angle and the same facing direction. Like that character, the monster is super-deformed: a big head or big upper body, short limbs, and a simple silhouette that reads clearly even when the sprite is small. It is cute-creepy and stylized, never realistic, never gory. Do not draw the girl from that image: draw only the monster.` : ''}
Pose: its natural idle pose, full body visible, nothing cut off. View: ${VIEW[dir].replace(/\bher\b/g, 'its')}, seen from a slightly elevated camera.
Style: clean anime cel shading, crisp dark outlines, flat colors, no painterly texture, no photo-realism. Glowing parts are drawn as flat bright colors with only a small soft glow.
Composition: square 1:1 image. The monster is centered: its total height is about ${pct}% of the image height, with wide empty margins on every side (the margins are needed later for its attack animations).
Background: one perfectly flat solid ${key.text} color filling the entire image. No ground, no cast shadow, no gradient, no text, no letters, no border, no other objects. Do not use the background color anywhere on the monster.`;
}

const codexHome = () => process.env.CODEX_HOME || join(homedir(), '.codex');

const listGenerated = () => {
  const dir = join(codexHome(), 'generated_images');
  return existsSync(dir) ? new Set(readdirSync(dir)) : new Set();
};

/**
 * Codex의 이미지 생성 도구로 그림 한 장을 만들어 target 에 저장한다.
 * prompt 는 "만든 PNG를 현재 폴더에 <target 파일 이름>으로 복사하라"는 지시를 포함해야 한다.
 * images 는 함께 보여 줄 참고 이미지 경로들.
 */
export function codexImage(prompt, images, target) {
  const cwd = ensureDir(dirname(target));
  const args = ['exec', '-s', 'workspace-write'];
  if (setting('image.model')) args.push('-m', setting('image.model'));
  for (const img of images) args.push('-i', `"${relative(cwd, img)}"`);
  args.push('-');
  const before = listGenerated();
  const started = Date.now();
  // codex는 Windows에서 .cmd 래퍼라 셸을 거쳐 실행한다. 지시문은 표준 입력으로 넘긴다
  const r = spawnSync(`codex ${args.join(' ')}`, { cwd, input: prompt, encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
  if (r.error) fail(`codex 를 실행할 수 없습니다 (${r.error.message}). Codex CLI 설치와 로그인(codex login)을 확인하세요`);
  if (!existsSync(target) || statSync(target).mtimeMs < started) {
    // Codex가 복사를 빠뜨렸으면 생성 폴더에서 직접 가져온다
    const fresh = [...listGenerated()].filter((d) => !before.has(d)).flatMap((d) => {
      const dirPath = join(codexHome(), 'generated_images', d);
      return readdirSync(dirPath).filter((n) => n.endsWith('.png')).map((n) => join(dirPath, n));
    });
    fresh.sort((x, y) => statSync(y).mtimeMs - statSync(x).mtimeMs);
    if (!fresh.length) {
      const tail = (r.stdout + r.stderr).trim().split('\n').slice(-12).join('\n');
      fail(`Codex가 이미지를 만들지 않았습니다 (종료 코드 ${r.status}). 마지막 출력:\n${tail}`);
    }
    copyFileSync(fresh[0], target);
  }
}

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

/**
 * 펫의 기본 이미지에서 배경을 걷어 내고 여백 없이 자른 그림(cutout.png)을 만든다.
 * 편성 화면과 펫 버튼에 쓰는 그림이다 (data/art/ui_sheets.csv 에서 kind=file 로 가리킨다).
 */
async function writeCutout(sub, dir) {
  const p = paths(sub.id);
  const img = await loadImage(p.base(dir));
  chromaKey(img, borderKey(img), { lo: num('key.lo'), hi: num('key.hi'), hue: num('key.hue') });
  shrinkAlpha(img, num('key.shrink'));
  removeSpecks(img, 60);
  const box = alphaBox(img);
  if (!box) return;
  const pad = 6;
  const left = Math.max(0, box.x - pad);
  const top = Math.max(0, box.y - pad);
  await toSharp(img)
    .extract({ left, top, width: Math.min(img.w - left, box.w + pad * 2), height: Math.min(img.h - top, box.h + pad * 2) })
    .png()
    .toFile(join(p.work, 'cutout.png'));
}

/**
 * 생성된 펫 그림을 정해진 크기로 다시 놓는다: 배경을 걷어 내고, 전체 높이가 그림 높이의 절반이 되게 줄여 가운데에 둔다.
 * 생성 도구는 "작게 그려 달라"는 지시를 잘 지키지 않아, 펫끼리 화면에서 차지하는 크기가 달라지는 것을 여기서 맞춘다.
 */
async function fitPet(sub, dir) {
  const file = paths(sub.id).base(dir);
  const img = await loadImage(file);
  const key = borderKey(img);
  chromaKey(img, key, { lo: num('key.lo'), hi: num('key.hi'), hue: num('key.hue') });
  removeSpecks(img, 60);
  const box = alphaBox(img);
  if (!box) return;
  const k = Math.min((img.h * 0.5) / box.h, (img.w * 0.62) / box.w);
  const w = Math.max(1, Math.round(box.w * k));
  const h = Math.max(1, Math.round(box.h * k));
  const fig = await toSharp(img).extract({ left: box.x, top: box.y, width: box.w, height: box.h }).resize(w, h, { kernel: 'lanczos3', fit: 'fill' }).png().toBuffer();
  const bg = KEYS[sub.key].rgb;
  const out = await sharp({ create: { width: img.w, height: img.h, channels: 3, background: { r: bg[0], g: bg[1], b: bg[2] } } })
    .composite([{ input: fig, left: Math.round((img.w - w) / 2), top: Math.round((img.h - h) / 2) }])
    .png()
    .toBuffer();
  await sharp(out).toFile(file);
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
  const refs = [];
  if (sub.ref) {
    const ref = join(REF_DIR, sub.ref);
    if (!existsSync(ref)) fail(`원화가 없습니다: ${relative(process.cwd(), ref)}`);
    images.push(ref);
    refs.push('design');
  }
  // 그림체 기준: 이미 확정된 다른 캐릭터의 기본 이미지를 함께 보여 줘 캐릭터끼리 그림체·등신·크기를 맞춘다
  // 그림체 기준: 펫은 펫끼리, 캐릭터와 몬스터는 캐릭터의 것을 쓴다
  const styleId = sub.kind === 'pet' ? setting('image.petStyleRef') : setting('image.styleRef');
  if (styleId && styleId !== id && (sub.kind === 'char' || sub.kind === 'pet' || sub.kind === 'monster')) {
    let style = paths(styleId).base(dir);
    const original = sub.kind === 'pet' && subject(styleId).ref ? join(REF_DIR, subject(styleId).ref) : null;
    if (original && existsSync(original)) {
      // 원화는 배경이 투명할 수 있으므로 흰 바탕에 올려, 선과 채색이 그대로 보이게 한다
      style = join(ensureDir(join(ROOT, 'tools', '.out')), `_style_${styleId}.png`);
      await sharp(original).flatten({ background: '#ffffff' }).png().toFile(style);
    }
    if (existsSync(style)) {
      images.push(style);
      refs.push('style');
    }
  }
  // 첫 방향이 이미 있으면 그것을 함께 보여 줘 방향끼리 그림체와 크기를 맞춘다
  const front = sub.dirs.map((d) => p.base(d)).find((f) => f !== target && existsSync(f));
  if (front) {
    images.push(front);
    refs.push('angle');
  }

  console.log(`Codex로 이미지 생성 중: ${id} ${dir} (1~3분)`);
  codexImage(imagePrompt(sub, dir, refs), images, target);
  if (sub.kind === 'pet') await fitPet(sub, dir);
  const info = await measureBase(sub, dir);
  if (sub.kind === 'pet') await writeCutout(sub, dir);
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
