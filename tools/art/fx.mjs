// 이펙트 그림을 만든다. 두 가지가 있다.
//
//  1) 조각: 베기 궤적·섬광·고리·번개 같은 그림 한 장짜리. 게임이 크기·회전·투명도·색을 코드로 움직여 쓴다.
//     여러 조각을 한 장에 격자로 그려 받아(Codex) 잘라 쓴다. 검은 배경에 흰 빛으로 그려 받고, 밝기를 불투명도로 바꾼다.
//  2) 플립북: 영상(Seedance)에서 뽑은 여러 장짜리. 궁극기처럼 눈에 띄어야 하는 이펙트에만 쓴다 (편당 요금 발생).
//
//   npm run art -- fx                    빠진 것만: 조각 이미지 생성 → 자르기 → 묶기 (요금 없음)
//   npm run art -- fx gen fx_slash       이미지 생성만 (시트 이름을 안 주면 빠진 것 전부). --force 로 다시 만든다
//   npm run art -- fx cut                시트를 조각으로 자른다. 확인용 그림: art/fx/preview.png
//   npm run art -- fx pack               게임이 읽는 public/fx/ 를 만든다
//   npm run art -- fx flip               플립북의 계획과 예상 비용을 보여 준다 (--yes 를 붙여야 영상을 만든다)
//   npm run art -- fx flip strike --yes  플립북 하나만 (영상 → 프레임). 끝나면 fx pack 을 다시 실행한다
//
// 무엇을 그릴지는 data/art/fx_sheets.csv (시트), data/art/fx.csv (조각), data/art/fx_flips.csv (플립북)에 적는다.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';
import { csvRecords } from '../../src/core/csv.ts';
import { alphaBox, borderKey, chromaKey, coreOf, cutGrid, fadeEdges, lumKey, packShelves, padBox, removeSpecks, shrinkAlpha } from './lib/pixels.ts';
import { ArtError, KEYS, ROOT, ensureDir, fail, loadImage, num, readJson, toSharp, writeJson } from './lib/common.mjs';
import { codexImage } from './image.mjs';

const SRC = join(ROOT, 'art', 'fx');
const ITEMS = join(SRC, 'items');
const FLIPS = join(SRC, 'flip');
const OUT = join(ROOT, 'public', 'fx');

const table = (name) => {
  const file = join(ROOT, 'data', 'art', name);
  return existsSync(file) ? csvRecords(readFileSync(file, 'utf8')).rows.map((r) => ({ ...r.cells, line: r.line })) : [];
};

function load() {
  const sheets = table('fx_sheets.csv').map((r) => {
    const where = `data/art/fx_sheets.csv ${r.line}번째 줄`;
    if (!['lum', 'color', 'key'].includes(r.kind)) fail(`${where}: kind 는 lum(검은 배경의 흰 빛) / color(검은 배경의 색 있는 빛) / key(단색 배경의 물체) 중 하나여야 합니다`);
    if (r.kind === 'key' && !KEYS[r.key]) fail(`${where}: key 는 ${Object.keys(KEYS).join(' / ')} 중 하나여야 합니다`);
    return { ...r, rows: Number(r.rows) || 1, cols: Number(r.cols) || 1 };
  });
  const sheetOf = (name, where) => sheets.find((s) => s.sheet === name) ?? fail(`${where}: 시트 "${name}" 가 fx_sheets.csv 에 없습니다`);
  const cellOf = (r, sheet, where) => {
    const cell = Number(r.cell);
    if (!(cell >= 1 && cell <= sheet.rows * sheet.cols)) fail(`${where}: cell 은 1~${sheet.rows * sheet.cols} 이어야 합니다`);
    return cell;
  };
  const items = table('fx.csv').map((r) => {
    const where = `data/art/fx.csv ${r.line}번째 줄`;
    const sheet = sheetOf(r.sheet, where);
    const size = Number(r.size);
    if (!(size > 0)) fail(`${where}: size 는 0보다 큰 숫자여야 합니다 (게임에서 긴 변의 길이, px)`);
    const rot = Number(r.rot) || 0;
    if (rot % 90 !== 0) fail(`${where}: rot 은 0 / 90 / 180 / 270 중 하나여야 합니다`);
    return { ...r, kind: sheet.kind, cell: cellOf(r, sheet, where), size, rot, core: r.core === '1' && sheet.kind === 'lum' };
  });
  const flips = table('fx_flips.csv').map((r) => {
    const where = `data/art/fx_flips.csv ${r.line}번째 줄`;
    const sheet = sheetOf(r.sheet, where);
    if (sheet.kind !== 'color') fail(`${where}: 플립북의 첫 그림은 color 시트에서 가져와야 합니다`);
    const seconds = Number(r.seconds) || 4;
    return { ...r, cell: cellOf(r, sheet, where), size: Number(r.size) || 160, frames: Number(r.frames) || num('fx.flipFrames'), seconds, play: Number(r.play) || 0.6 };
  });
  const ids = new Set();
  for (const it of [...items, ...flips]) {
    if (ids.has(it.id)) fail(`이펙트 이름 "${it.id}" 가 겹칩니다 (fx.csv, fx_flips.csv)`);
    ids.add(it.id);
  }
  return { sheets, items, flips };
}

function sheetPrompt(sheet, items) {
  const save = `Use your built-in image generation tool to create ONE image. Then copy the generated PNG file into the current working directory as ${sheet.sheet}.png. Do not draw the image with code, do not write any other files, and do not modify anything else. When done, reply with only the absolute path of the generated source file.`;
  const list = items
    .slice()
    .sort((a, b) => a.cell - b.cell)
    .map((it) => `${it.cell}) ${it.desc}`)
    .join('\n');
  const grid = `arranged in a ${sheet.rows} x ${sheet.cols} grid (${sheet.rows} rows, ${sheet.cols} columns), exactly one per cell. Each one is centered in its cell and fills about 60% of the cell, with wide empty space around it, and never touches another one or the image edge.`;
  if (sheet.kind === 'key') {
    const key = KEYS[sheet.key];
    return `${save}

IMAGE TO GENERATE
A game asset sheet for a 2D top-down anime action RPG. The sheet shows ${items.length} separate small objects ${grid}
The objects, in reading order (left to right, top to bottom):
${list}
Style: clean anime cel shading with crisp dark outlines and flat colors, matching a chibi anime action game. Do not use ${sheet.key === 'magenta' ? 'magenta or pink' : 'green'} anywhere on the objects.
Background: one perfectly flat solid ${key.text} color filling the entire image. No ground, no cast shadows, no gradient, no text, no labels, no numbers, no grid lines, no borders.`;
  }
  const palette =
    sheet.kind === 'lum'
      ? 'Strictly monochrome: pure white and shades of gray only. Absolutely no color anywhere.'
      : 'Each effect uses its own vivid glowing colors as described, always with a bright white-hot core.';
  return `${save}

IMAGE TO GENERATE
A VFX sprite sheet for a 2D anime action game. The sheet shows ${items.length} separate visual-effect elements ${grid}
The elements, in reading order (left to right, top to bottom):
${list}
Style: stylized hand-drawn 2D anime game VFX, like the slash, impact and magic effects of a stylish anime action RPG. Bold clean graphic shapes with sharp tapered ends, a solid bright white core and only a thin soft glow around it. Flat and graphic, not photorealistic, no lens flare, no bokeh, no 3D rendering.
${palette}
Background: perfectly pure solid black (#000000) everywhere, including between the elements. No ground, no smoke filling the background, no gradient, no text, no labels, no numbers, no grid lines, no borders, no frames.`;
}

// ---- 1. 이미지 생성 ---------------------------------------------------------

async function gen(names, opts) {
  const { sheets, items, flips } = load();
  for (const n of names) if (!sheets.some((s) => s.sheet === n)) fail(`시트 "${n}" 가 없습니다. 있는 것: ${sheets.map((s) => s.sheet).join(', ')}`);
  const used = (s) => [...items, ...flips].filter((it) => it.sheet === s.sheet);
  const todo = sheets
    .filter((s) => (names.length ? names.includes(s.sheet) : used(s).length > 0))
    .filter((s) => opts.force || !existsSync(join(SRC, `${s.sheet}.png`)));
  if (!todo.length) {
    console.log('만들 시트가 없습니다 (이미 있음. 다시 만들려면 --force)');
    return;
  }
  ensureDir(SRC);
  for (const s of todo) {
    console.log(`Codex로 이미지 생성 중: ${s.sheet} (1~3분)`);
    codexImage(sheetPrompt(s, used(s)), [], join(SRC, `${s.sheet}.png`));
    console.log(`저장: ${relative(process.cwd(), join(SRC, `${s.sheet}.png`))}`);
  }
}

// ---- 2. 자르기 --------------------------------------------------------------

/** 시트를 읽어 배경을 투명하게 만들고, 칸마다 그림의 상자를 찾는다 */
async function openSheet(s) {
  const img = await loadImage(join(SRC, `${s.sheet}.png`));
  if (s.kind === 'key') {
    chromaKey(img, borderKey(img), { lo: num('key.lo'), hi: num('key.hi'), hue: num('key.hue') });
    shrinkAlpha(img, num('key.shrink'));
    removeSpecks(img, 60);
    return { img, boxes: cutGrid(img, s.rows, s.cols, 200) };
  }
  lumKey(img, { lo: num('fx.lo'), hi: num('fx.hi'), gamma: num('fx.gamma'), keepColor: s.kind === 'color' });
  // 옅은 번짐끼리 이웃 칸과 이어지지 않도록, 덩어리는 어느 정도 밝은 부분만으로 찾고 상자를 넉넉히 넓힌다
  const pad = Math.round(img.w * 0.02);
  const boxes = cutGrid(img, s.rows, s.cols, 80, 70).map((b) => (b ? padBox(b, pad, img.w, img.h) : null));
  return { img, boxes };
}

/** 자른 조각을 표의 rot·flip 대로 돌리고 뒤집은 뒤, 긴 변이 size 가 되게 줄인다 */
async function writePiece(img, box, it, file, coreFile) {
  const long = Math.round(it.size * num('fx.texScale'));
  const shape = async (src) => {
    let s = toSharp(src).extract({ left: box.x, top: box.y, width: box.w, height: box.h });
    // sharp 는 한 번에 한 가지 변환만 순서를 보장하므로 단계마다 버퍼로 굳힌다
    let buf = await s.png().toBuffer();
    if (it.rot) buf = await sharp(buf).rotate(it.rot).png().toBuffer();
    if (it.flip === 'x') buf = await sharp(buf).flop().png().toBuffer();
    if (it.flip === 'y') buf = await sharp(buf).flip().png().toBuffer();
    const m = await sharp(buf).metadata();
    const k = long / Math.max(m.width, m.height);
    const out = await sharp(buf)
      .resize(Math.max(1, Math.round(m.width * k)), Math.max(1, Math.round(m.height * k)), { kernel: 'lanczos3', fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { w: out.info.width, h: out.info.height, data: new Uint8Array(out.data.buffer, out.data.byteOffset, out.data.length) };
  };
  const piece = await shape(img);
  if (it.kind !== 'key') fadeEdges(piece, Math.max(2, Math.round(Math.min(piece.w, piece.h) * 0.06)));
  await toSharp(piece).png().toFile(file);
  if (it.core) await toSharp(coreOf(piece, num('fx.coreLo'), num('fx.coreHi'))).png().toFile(coreFile);
  return piece;
}

async function cut() {
  const { sheets, items } = load();
  if (existsSync(ITEMS)) for (const f of readdirSync(ITEMS)) rmSync(join(ITEMS, f));
  ensureDir(ITEMS);
  let missing = 0;
  for (const s of sheets) {
    const mine = items.filter((it) => it.sheet === s.sheet);
    if (!mine.length) continue;
    if (!existsSync(join(SRC, `${s.sheet}.png`))) {
      console.log(`[${s.sheet}] 이미지가 없어 건너뜁니다 (npm run art -- fx gen ${s.sheet})`);
      missing += mine.length;
      continue;
    }
    const { img, boxes } = await openSheet(s);
    const found = boxes.filter(Boolean).length;
    if (found !== s.rows * s.cols) console.log(`[${s.sheet}] 주의: ${s.rows * s.cols}칸 중 ${found}칸에서만 그림을 찾았습니다. 시트 이미지를 확인하세요`);
    for (const it of mine) {
      const box = boxes[it.cell - 1];
      if (!box) {
        console.log(`[${s.sheet}] 주의: ${it.cell}번 칸이 비어 있어 ${it.id} 를 만들지 못했습니다`);
        missing++;
        continue;
      }
      await writePiece(img, box, it, join(ITEMS, `${it.id}.png`), join(ITEMS, `${it.id}.core.png`));
    }
    console.log(`[${s.sheet}] 조각 ${mine.length}개를 잘랐습니다`);
  }
  await contact(items);
  return missing;
}

/** 확인용: 자른 조각을 표 순서대로 어두운 바탕에 늘어놓는다 (art/fx/preview.png). 조각 아래에 흰 심지도 함께 보여 준다 */
async function contact(items) {
  const cells = [];
  let x = 10;
  let y = 10;
  let rowH = 0;
  const W = 1800;
  for (const it of items) {
    const file = join(ITEMS, `${it.id}.png`);
    if (!existsSync(file)) continue;
    const m = await sharp(file).metadata();
    if (x + m.width + 10 > W) {
      x = 10;
      y += rowH + 14;
      rowH = 0;
    }
    // 색을 입혀 쓰는 조각은 게임에서처럼 색을 입힌 모습으로 보여 준다
    const tinted = it.kind === 'lum' ? await sharp(file).tint({ r: 255, g: 150, b: 170 }).png().toBuffer() : file;
    cells.push({ input: tinted, left: x, top: y });
    if (it.core) cells.push({ input: join(ITEMS, `${it.id}.core.png`), left: x, top: y });
    x += m.width + 14;
    rowH = Math.max(rowH, m.height);
  }
  if (!cells.length) return;
  await sharp({ create: { width: W, height: y + rowH + 10, channels: 3, background: '#15131f' } }).composite(cells).png().toFile(join(SRC, 'preview.png'));
}

// ---- 3. 플립북 (영상) -------------------------------------------------------

const flipPaths = (id) => {
  const dir = join(FLIPS, id);
  return { dir, key: join(dir, 'key.png'), video: join(dir, 'video.mp4'), info: join(dir, 'video.json'), frames: join(dir, 'frames'), meta: join(dir, 'flip.json') };
};

/** 플립북의 첫 그림: color 시트의 한 칸을 정사각형 검은 바탕 가운데에 놓는다 */
async function flipKey(fl, sheets) {
  const s = sheets.find((x) => x.sheet === fl.sheet);
  const src = join(SRC, `${s.sheet}.png`);
  if (!existsSync(src)) fail(`[${fl.id}] 첫 그림이 들어 있는 시트가 없습니다. 먼저 실행: npm run art -- fx gen ${s.sheet}`);
  const raw = await loadImage(src);
  const keyed = { w: raw.w, h: raw.h, data: raw.data.slice() };
  lumKey(keyed, { lo: num('fx.lo'), hi: num('fx.hi'), keepColor: true });
  const pad = Math.round(raw.w * 0.03);
  const box = cutGrid(keyed, s.rows, s.cols, 80, 70)[fl.cell - 1];
  if (!box) fail(`[${fl.id}] ${s.sheet} 의 ${fl.cell}번 칸에서 그림을 찾지 못했습니다`);
  const b = padBox(box, pad, raw.w, raw.h);
  const size = num('video.inputSize');
  const inner = Math.round(size * 0.62);
  const cell = await sharp(src).extract({ left: b.x, top: b.y, width: b.w, height: b.h }).resize(inner, inner, { fit: 'contain', background: '#000' }).removeAlpha().png().toBuffer();
  const p = flipPaths(fl.id);
  ensureDir(p.dir);
  await sharp({ create: { width: size, height: size, channels: 3, background: '#000' } })
    .composite([{ input: cell, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }])
    .png()
    .toFile(p.key);
  return p.key;
}

const flipPrompt = (fl) => `${fl.motion}
2D anime game VFX animation on a perfectly pure black background. Hand-drawn cel-style effect animation with bold clean shapes and a white-hot core, keeping exactly the colors and the art style of the first frame.
The effect stays centered in the frame. Fixed locked-off camera: no zoom, no pan, no rotation. By the end of the video the effect has completely faded away and the whole frame is pure black.
The background stays pure black for the whole video: no ground, no scenery, no characters, no text, no smoke filling the frame.`;

/** 영상에서 플립북 프레임을 뽑는다: 빛이 남아 있는 구간을 고르게 나눠 뽑고, 밝기를 불투명도로 바꾼다 */
async function flipFrames(fl) {
  const { decode } = await import('./clip.mjs');
  const p = flipPaths(fl.id);
  const { frames, fps } = decode(p.video);
  // 프레임마다 빛의 양(평균 밝기)을 재서, 첫 프레임의 3% 아래로 떨어지면 끝난 것으로 본다
  const energy = frames.map((f) => {
    let sum = 0;
    for (let i = 0; i < f.data.length; i += 16) sum += Math.max(f.data[i], f.data[i + 1], f.data[i + 2]);
    return sum / (f.data.length / 16);
  });
  const peak = Math.max(...energy);
  let end = frames.length - 1;
  while (end > 4 && energy[end] < peak * 0.03) end--;
  // 표에 구간(초)을 적었으면 그것을 쓴다
  const from = fl.from ? Math.round(Number(fl.from) * fps) : 0;
  const to = fl.to ? Math.min(frames.length - 1, Math.round(Number(fl.to) * fps)) : end;
  const n = Math.min(fl.frames, to - from + 1);
  if (existsSync(p.frames)) for (const f of readdirSync(p.frames)) rmSync(join(p.frames, f));
  ensureDir(p.frames);
  // 플립북은 조각과 달리 정해진 크기(fx.flipSize)로 저장하고, 게임에서의 크기(size)는 따로 적어 둔다
  const px = num('fx.flipSize');
  // 그림이 실제로 차지하는 영역(모든 프레임의 합)만 잘라 쓴다
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  const picked = [];
  for (let k = 0; k < n; k++) {
    const src = frames[from + Math.round((k * (to - from)) / Math.max(1, n - 1))];
    const img = { w: src.w, h: src.h, data: src.data.slice() };
    lumKey(img, { lo: num('fx.lo'), hi: num('fx.hi'), gamma: num('fx.gamma'), keepColor: true });
    const box = alphaBox(img, 24);
    if (box) {
      x0 = Math.min(x0, box.x);
      y0 = Math.min(y0, box.y);
      x1 = Math.max(x1, box.x + box.w);
      y1 = Math.max(y1, box.y + box.h);
    }
    picked.push(img);
  }
  if (x1 < 0) fail(`[${fl.id}] 영상에서 빛을 찾지 못했습니다`);
  // 가운데를 유지한 정사각형으로 자른다 (이펙트의 중심이 프레임 중심과 같아야 게임에서 위치가 맞는다)
  const W = picked[0].w;
  const H = picked[0].h;
  const half = Math.min(W / 2, H / 2, Math.max(W / 2 - x0, x1 - W / 2, H / 2 - y0, y1 - H / 2) + 6);
  const crop = { left: Math.round(W / 2 - half), top: Math.round(H / 2 - half), width: Math.round(half * 2), height: Math.round(half * 2) };
  const strip = [];
  for (const [k, img] of picked.entries()) {
    const buf = await toSharp(img).extract(crop).resize(px, px, { kernel: 'lanczos3', fit: 'fill' }).ensureAlpha().raw().toBuffer();
    const fr = { w: px, h: px, data: new Uint8Array(buf.buffer, buf.byteOffset, buf.length) };
    fadeEdges(fr, Math.round(px * 0.05));
    await toSharp(fr).png().toFile(join(p.frames, `${String(k).padStart(2, '0')}.png`));
    strip.push({ input: join(p.frames, `${String(k).padStart(2, '0')}.png`), left: k * px, top: 0 });
  }
  await sharp({ create: { width: px * n, height: px, channels: 3, background: '#15131f' } }).composite(strip).png().toFile(join(p.dir, 'preview.png'));
  // 표의 size 는 잘라 낸 정사각형(이펙트가 차지하는 범위)이 게임에서 차지하는 크기다
  writeJson(p.meta, { frames: n, size: fl.size, play: fl.play, from: +(from / fps).toFixed(2), to: +(to / fps).toFixed(2), crop: +(half * 2 / W).toFixed(3) });
  console.log(`[${fl.id}] 프레임 ${n}장 (영상 ${(from / fps).toFixed(2)}~${(to / fps).toFixed(2)}초) → ${relative(process.cwd(), p.frames)}`);
}

async function flip(names, opts) {
  const { sheets, flips } = load();
  for (const n of names) if (!flips.some((f) => f.id === n)) fail(`플립북 "${n}" 이 없습니다. 있는 것: ${flips.map((f) => f.id).join(', ') || '없음'}`);
  const mine = flips.filter((f) => !names.length || names.includes(f.id));
  if (!mine.length) {
    console.log('data/art/fx_flips.csv 에 플립북이 없습니다');
    return;
  }
  const { estimateCost, runTask } = await import('./video.mjs');
  const todo = mine.filter((f) => opts.force || !existsSync(flipPaths(f.id).video));
  const cost = todo.reduce((s, f) => s + estimateCost(f.seconds), 0);
  console.log(`플립북 ${mine.length}개 중 영상을 만들 것: ${todo.length ? todo.map((f) => f.id).join(', ') : '없음 (이미 있음)'} — 예상 비용 약 $${cost.toFixed(2)}`);
  if (todo.length && !opts.yes) {
    console.log('실제로 만들려면 같은 명령 끝에 --yes 를 붙이세요.');
    return;
  }
  const errors = [];
  for (const fl of todo) {
    const p = flipPaths(fl.id);
    try {
      const key = await flipKey(fl, sheets);
      const size = num('video.inputSize');
      const black = await sharp({ create: { width: size, height: size, channels: 3, background: '#000' } }).png().toBuffer();
      await runTask({
        tag: `fx ${fl.id}`,
        infoPath: p.info,
        target: p.video,
        force: opts.force,
        seconds: fl.seconds,
        model: opts.model,
        build: async () => ({ prompt: flipPrompt(fl), first: readFileSync(key), last: black, note: {} }),
      });
    } catch (err) {
      if (!(err instanceof ArtError)) throw err;
      errors.push(err.message);
      console.log(err.message);
      if (/SetLimitExceeded|AccountOverdue|InsufficientBalance/i.test(err.message)) break;
    }
  }
  for (const fl of mine) if (existsSync(flipPaths(fl.id).video)) await flipFrames(fl);
  if (errors.length) throw new ArtError(`${errors.length}건은 만들지 못했습니다. 위의 메시지를 확인하세요`);
}

// ---- 4. 묶기 ----------------------------------------------------------------

async function pack() {
  const { items, flips } = load();
  const entries = [];
  for (const it of items) {
    const file = join(ITEMS, `${it.id}.png`);
    if (!existsSync(file)) continue;
    entries.push({ id: it.id, file, role: 'piece', it });
    if (it.core) entries.push({ id: it.id, file: join(ITEMS, `${it.id}.core.png`), role: 'core', it });
  }
  for (const fl of flips) {
    const p = flipPaths(fl.id);
    const meta = readJson(p.meta);
    if (!meta) continue;
    for (let k = 0; k < meta.frames; k++) entries.push({ id: fl.id, file: join(p.frames, `${String(k).padStart(2, '0')}.png`), role: 'flip', fl, meta });
  }
  if (existsSync(OUT)) rmSync(OUT, { recursive: true });
  if (!entries.length) {
    console.log('묶을 이펙트 그림이 없습니다. 게임은 도형 이펙트로 그려집니다');
    return;
  }
  ensureDir(OUT);
  const quality = num('sheet.quality') || 90;
  const scale = num('fx.texScale');
  const sizes = [];
  for (const e of entries) {
    const m = await sharp(e.file).metadata();
    sizes.push({ w: m.width, h: m.height });
  }
  const { placed, pages } = packShelves(sizes, num('sheet.maxSize'), num('sheet.pad'));
  const names = pages.map((_, i) => `fx-${i}.webp`);
  const hash = createHash('sha1');
  let bytes = 0;
  for (const [i, pg] of pages.entries()) {
    const buf = await sharp({ create: { width: pg.w, height: pg.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite(entries.map((e, k) => ({ e, k })).filter(({ k }) => placed[k].page === i).map(({ e, k }) => ({ input: e.file, left: placed[k].x, top: placed[k].y })))
      // 투명한 곳의 색도 그대로 둔다 (흰 빛의 가장자리가 어둡게 물들지 않게)
      .webp({ quality, alphaQuality: 100, effort: 5, exact: true })
      .toBuffer();
    await sharp(buf).toFile(join(OUT, names[i]));
    bytes += buf.length;
    hash.update(buf);
  }
  const frame = (k) => [placed[k].page, placed[k].x, placed[k].y, sizes[k].w, sizes[k].h];
  const data = { version: 1, v: '', scale: 1 / scale, pages: names, pieces: {}, flips: {} };
  entries.forEach((e, k) => {
    if (e.role === 'piece') data.pieces[e.id] = { f: frame(k), ...(e.it.kind === 'lum' ? {} : { color: 1 }), ...(e.it.kind === 'color' ? { glow: 1 } : {}) };
    else if (e.role === 'core') data.pieces[e.id].core = frame(k);
    else (data.flips[e.id] ??= { play: e.meta.play, size: e.meta.size, frames: [] }).frames.push(frame(k));
  });
  hash.update(JSON.stringify(data));
  data.v = hash.digest('hex').slice(0, 10);
  writeJson(join(OUT, 'fx.json'), data);
  console.log(`이펙트 조각 ${Object.keys(data.pieces).length}개, 플립북 ${Object.keys(data.flips).length}개 → ${relative(process.cwd(), OUT)} (시트 ${pages.map((p) => `${p.w}x${p.h}`).join(', ')}, 파일 ${(bytes / 1024).toFixed(0)}KB)`);
}

export async function run(args, opts) {
  const [step, ...names] = args;
  if (step === 'gen') return gen(names, opts);
  if (step === 'cut') return void (await cut());
  if (step === 'pack') return pack();
  if (step === 'flip') return flip(names, opts);
  if (step) throw new ArtError('사용법: npm run art -- fx [gen [시트…] | cut | pack | flip [이름…] [--yes]] [--force]');
  await gen([], opts);
  await cut();
  await pack();
}
