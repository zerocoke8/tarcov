// 마름모(아이소메트릭) 맵에만 쓰는 그림을 만든다: 높은 벽의 앞면 질감과, 벽 위에 서는 높은 구조물(나무·건물·탑).
// 바닥·길·엄폐 오브젝트·상호작용 오브젝트는 기존 맵 그림(scenery)을 그대로 쓰므로 여기서 만들지 않는다.
//
//   npm run art -- iso                    빠진 것만: 이미지 생성 → 자르기 → 묶기 (모든 세트)
//   npm run art -- iso gen --set oz_field 이미지 생성만 (Codex). --force 로 다시 만든다
//   npm run art -- iso cut                시트를 물체별로 자르고 크기를 맞춘다 (art/iso/<세트>/preview.png 로 확인)
//   npm run art -- iso pack               게임이 읽는 public/iso/<세트>/ 를 만든다
//
// 세트 이름은 맵 그림 세트(data/art/scenery_sets.csv)와 같다. 그림체 지시문과 색 보정을 그 세트의 것으로 쓴다.
// 무엇을 그릴지는 data/art/iso_sheets.csv (시트)와 data/art/iso.csv (시트 안의 구조물)에 적는다.
//
// 벽 앞면: art/iso/<세트>/face.png 가 있으면 그것을, 없으면 기존 벽 질감 원본(art/scenery/<세트>/wall.png)을
// 정사각형 그대로 쓴다 (기존 맵은 그 가운데 띠만 잘라 썼다). 가로로만 이어 붙는다.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';
import { csvRecords } from '../../src/core/csv.ts';
import { borderKey, chromaKey, cutGrid, grade, makeSeamless, meanColor, packShelves, removeSpecks, shrinkAlpha } from './lib/pixels.ts';
import { ArtError, KEYS, ROOT, ensureDir, fail, loadImage, num, toSharp, writeJson } from './lib/common.mjs';
import { codexImage } from './image.mjs';

const ART = join(ROOT, 'art', 'iso');
const SCENERY = join(ROOT, 'art', 'scenery');
const PUB = join(ROOT, 'public', 'iso');
/** 벽 앞면 질감 한 장이 덮는 크기 (월드 px). 가로는 FACE_TILES 칸마다 되풀이된다 */
const TILE = 64;
const FACE_TILES = 2;
const FACE_H = 128;

const table = (name) => csvRecords(readFileSync(join(ROOT, 'data', 'art', name), 'utf8')).rows.map((r) => ({ ...r.cells, line: r.line }));

function load(setName) {
  const style = table('scenery_sets.csv').find((r) => r.set === setName) ?? fail(`data/art/scenery_sets.csv 에 세트 "${setName}" 가 없습니다`);
  const sheets = table('iso_sheets.csv')
    .filter((r) => r.set === setName)
    .map((r) => {
      if (!KEYS[r.key]) fail(`data/art/iso_sheets.csv ${r.line}번째 줄: key 는 ${Object.keys(KEYS).join(' / ')} 중 하나여야 합니다`);
      return { ...r, rows: Number(r.rows) || 1, cols: Number(r.cols) || 1 };
    });
  const items = table('iso.csv')
    .filter((r) => r.set === setName)
    .map((r) => {
      const where = `data/art/iso.csv ${r.line}번째 줄`;
      const sheet = sheets.find((s) => s.sheet === r.sheet) ?? fail(`${where}: 시트 "${r.sheet}" 가 iso_sheets.csv 의 ${setName} 세트에 없습니다`);
      const cell = Number(r.cell);
      if (!(cell >= 1 && cell <= sheet.rows * sheet.cols)) fail(`${where}: cell 은 1~${sheet.rows * sheet.cols} 이어야 합니다`);
      const size = Number(r.size);
      if (!(size > 0)) fail(`${where}: size 는 0보다 큰 숫자여야 합니다 (게임에서의 너비, px)`);
      const rate = Number(r.rate);
      if (!(rate >= 0)) fail(`${where}: rate 는 0 이상의 숫자여야 합니다 (높은 벽 한 칸마다 설 확률, %)`);
      return { ...r, cell, size, rate, tw: Number(r.tw) || 1, th: Number(r.th) || 1 };
    });
  return { style: { ...style, grade: Number(style.grade) || 0, gradeSat: Number(style.gradeSat) || 1 }, sheets, items };
}

const setNames = () => [...new Set(table('iso_sheets.csv').map((r) => r.set))];

function sheetPrompt(style, sheet, items) {
  const key = KEYS[sheet.key];
  const list = items
    .slice()
    .sort((a, b) => a.cell - b.cell)
    .map((it) => `${it.cell}) ${it.desc}`)
    .join('\n');
  return `Use your built-in image generation tool to create ONE image. Then copy the generated PNG file into the current working directory as ${sheet.sheet}.png. Do not draw the image with code, do not write any other files, and do not modify anything else. When done, reply with only the absolute path of the generated source file.

IMAGE TO GENERATE
A game asset sheet for a 2D isometric action RPG. Setting: ${style.theme}.
The sheet shows ${items.length} separate objects arranged in a ${sheet.rows} x ${sheet.cols} grid (${sheet.rows} rows, ${sheet.cols} columns), exactly one object per cell. Each object is centered in its cell with wide empty space around it, and never touches another object or the image edge.
The objects, in reading order (left to right, top to bottom):
${list}
View: Every object is drawn in the same isometric game view (2:1 dimetric projection, as in classic isometric games): the camera looks down at the object from above at about 30 degrees and is turned 45 degrees to the side, so we see the top of the object and two of its sides (its left-front side and its right-front side). Never a flat front view. All vertical edges are perfectly vertical. Each object stands upright on the ground, complete from its base to its top. Light comes from the upper left, so the right-front sides are a little darker than the left-front sides.
Sizes: tall things (trees, towers, buildings) fill most of the height of their cell; small things are drawn smaller.
Style: ${style.objectStyle} Do not use ${sheet.key === 'magenta' ? 'magenta, pink or purple' : 'green'} for the outlines or large areas of the objects.
Background: one perfectly flat solid ${key.text} color filling the entire image. No ground, no cast shadows on the background, no gradient, no text, no labels, no numbers, no grid lines, no borders.`;
}

// ---- 1. 이미지 생성 ---------------------------------------------------------

function gen(setName, names, opts) {
  const { style, sheets, items } = load(setName);
  const dir = join(ART, setName);
  const todo = sheets.filter((s) => (names.length ? names.includes(s.sheet) : true)).filter((s) => opts.force || !existsSync(join(dir, `${s.sheet}.png`)));
  if (!todo.length) {
    console.log(`[${setName}] 만들 시트가 없습니다 (이미 있음. 다시 만들려면 --force)`);
    return;
  }
  ensureDir(dir);
  for (const s of todo) {
    console.log(`Codex로 이미지 생성 중: iso/${setName}/${s.sheet} (1~3분)`);
    // 바닥 질감을 함께 보여 줘서 그림체와 색을 거기에 맞추게 한다
    const ref = join(SCENERY, `${style.styleRef}.png`);
    codexImage(sheetPrompt(style, s, items.filter((it) => it.sheet === s.sheet)), existsSync(ref) ? [ref] : [], join(dir, `${s.sheet}.png`));
    console.log(`저장: ${relative(process.cwd(), join(dir, `${s.sheet}.png`))}`);
  }
}

// ---- 2. 자르기 --------------------------------------------------------------

async function cut(setName) {
  const { style, sheets, items } = load(setName);
  const dir = join(ART, setName);
  const out = join(dir, 'items');
  const scale = num('sheet.texScale');
  if (existsSync(out)) for (const f of readdirSync(out)) rmSync(join(out, f));
  ensureDir(out);

  // 벽 앞면: 정사각형 질감을 가로로만 이어 붙게 만든다
  const faceSrc = [join(dir, 'face.png'), join(SCENERY, setName, 'wall.png')].find((f) => existsSync(f));
  if (faceSrc) {
    const seamless = makeSeamless(await loadImage(faceSrc), 0.2, 'x');
    await toSharp(seamless)
      .resize(FACE_TILES * TILE * scale, FACE_H * scale, { fit: 'fill' })
      .removeAlpha()
      .png()
      .toFile(join(out, 'face.png'));
    console.log(`[${setName}] 벽 앞면 ← ${relative(process.cwd(), faceSrc)}`);
  } else console.log(`[${setName}] 벽 앞면 질감이 없습니다 (art/scenery/${setName}/wall.png)`);

  const groundSrc = join(SCENERY, `${style.styleRef}.png`);
  const groundTint = style.grade > 0 && existsSync(groundSrc) ? meanColor(await loadImage(groundSrc)) : null;
  for (const s of sheets) {
    const src = join(dir, `${s.sheet}.png`);
    const mine = items.filter((it) => it.sheet === s.sheet);
    if (!existsSync(src)) {
      console.log(`[${setName}/${s.sheet}] 이미지가 없어 건너뜁니다 (npm run art -- iso gen --set ${setName})`);
      continue;
    }
    const img = await loadImage(src);
    chromaKey(img, borderKey(img), { lo: num('key.lo'), hi: num('key.hi'), hue: num('key.hue') });
    shrinkAlpha(img, num('key.shrink'));
    removeSpecks(img, 60);
    if (groundTint) grade(img, groundTint, style.grade, style.gradeSat);
    const boxes = cutGrid(img, s.rows, s.cols, 200);
    const found = boxes.filter(Boolean).length;
    if (found !== s.rows * s.cols) console.log(`[${setName}/${s.sheet}] 주의: ${s.rows * s.cols}칸 중 ${found}칸에서만 물체를 찾았습니다. 시트 이미지를 확인하세요`);
    for (const it of mine) {
      const box = boxes[it.cell - 1];
      if (!box) {
        console.log(`[${setName}/${s.sheet}] 주의: ${it.cell}번 칸이 비어 있어 ${it.id} 를 만들지 못했습니다`);
        continue;
      }
      const w = Math.round(it.size * scale);
      const h = Math.max(1, Math.round((box.h * w) / box.w));
      await toSharp(img).extract({ left: box.x, top: box.y, width: box.w, height: box.h }).resize(w, h, { kernel: 'lanczos3', fit: 'fill' }).png().toFile(join(out, `${it.id}.png`));
    }
    console.log(`[${setName}/${s.sheet}] 구조물 ${mine.length}개를 잘랐습니다`);
  }
  await contact(setName, items);
}

/** 확인용: 자른 구조물을 한 장에 늘어놓는다 (art/iso/<세트>/preview.png) */
async function contact(setName, items) {
  const dir = join(ART, setName);
  const cells = [];
  let x = 8;
  let y = 8;
  let rowH = 0;
  const W = 1900;
  for (const it of [{ id: 'face' }, ...items]) {
    const file = join(dir, 'items', `${it.id}.png`);
    if (!existsSync(file)) continue;
    const m = await sharp(file).metadata();
    if (x + m.width + 8 > W) {
      x = 8;
      y += rowH + 12;
      rowH = 0;
    }
    cells.push({ input: file, left: x, top: y });
    x += m.width + 12;
    rowH = Math.max(rowH, m.height);
  }
  if (!cells.length) return;
  const ground = join(SCENERY, setName, 'items', 'ground.png');
  const H = Math.max(y + rowH + 8, existsSync(ground) ? (await sharp(ground).metadata()).height : 0);
  const base = existsSync(ground)
    ? sharp({ create: { width: W, height: H, channels: 3, background: '#000' } }).composite([{ input: ground, tile: true, left: 0, top: 0 }, ...cells])
    : sharp({ create: { width: W, height: H, channels: 3, background: '#3a3f4b' } }).composite(cells);
  await base.png().toFile(join(dir, 'preview.png'));
}

// ---- 3. 묶기 ----------------------------------------------------------------

async function pack(setName) {
  const { items } = load(setName);
  const dir = join(ART, setName, 'items');
  const out = join(PUB, setName);
  const all = [{ id: 'face', face: true }, ...items].filter((it) => existsSync(join(dir, `${it.id}.png`)));
  if (existsSync(out)) rmSync(out, { recursive: true });
  if (!all.some((it) => it.face)) {
    console.log(`[${setName}] 벽 앞면 질감이 없어 묶지 않습니다. 마름모 맵은 기존 벽 질감으로 그려집니다`);
    return;
  }
  ensureDir(out);
  const quality = num('sheet.quality') || 90;
  const scale = num('sheet.texScale');
  const sizes = [];
  for (const it of all) {
    const m = await sharp(join(dir, `${it.id}.png`)).metadata();
    sizes.push({ w: m.width, h: m.height });
  }
  const { placed, pages } = packShelves(sizes, num('sheet.maxSize'), num('sheet.pad'));
  const names = pages.map((_, i) => `iso-${i}.webp`);
  const hash = createHash('sha1');
  let bytes = 0;
  for (const [i, pg] of pages.entries()) {
    const buf = await sharp({ create: { width: pg.w, height: pg.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite(all.map((it, k) => ({ it, k })).filter(({ k }) => placed[k].page === i).map(({ it, k }) => ({ input: join(dir, `${it.id}.png`), left: placed[k].x, top: placed[k].y })))
      .webp({ quality, alphaQuality: 100, effort: 5 })
      .toBuffer();
    await sharp(buf).toFile(join(out, names[i]));
    bytes += buf.length;
    hash.update(buf);
  }
  const frame = (k) => [placed[k].page, placed[k].x, placed[k].y, sizes[k].w, sizes[k].h];
  const data = { version: 1, v: '', scale: 1 / scale, pages: names, face: null, faceTiles: FACE_TILES, structs: [] };
  all.forEach((it, k) => {
    if (it.face) data.face = frame(k);
    else data.structs.push({ id: it.id, f: frame(k), tw: it.tw, th: it.th, rate: it.rate, ...(it.glow ? { glow: it.glow } : {}) });
  });
  hash.update(JSON.stringify(data));
  data.v = hash.digest('hex').slice(0, 10);
  writeJson(join(out, 'iso.json'), data);
  console.log(`[${setName}] 마름모 맵 그림: 벽 앞면 + 구조물 ${data.structs.length}개 → ${relative(process.cwd(), out)} (시트 ${pages.map((p) => `${p.w}x${p.h}`).join(', ')}, 파일 ${(bytes / 1024).toFixed(0)}KB)`);
}

export async function run(args, opts) {
  const [step, ...names] = args;
  if (step && !['gen', 'cut', 'pack'].includes(step)) throw new ArtError('사용법: npm run art -- iso [gen [시트…] | cut | pack] [--set 세트] [--force]');
  const sets = setNames();
  const only = typeof opts.set === 'string' ? opts.set.split(',') : null;
  if (only) for (const n of only) if (!sets.includes(n)) fail(`세트 "${n}" 가 없습니다. 있는 것: ${sets.join(', ')}`);
  for (const set of sets) {
    if (only && !only.includes(set)) continue;
    if (!step || step === 'gen') gen(set, names, opts);
    if (!step || step === 'cut') await cut(set);
    if (!step || step === 'pack') await pack(set);
  }
}
