// 맵 그림(바닥·지붕·벽 질감, 엄폐 오브젝트, 상호작용 오브젝트, 벽·바닥 장식)을 만든다.
//
//   npm run art -- scenery                 빠진 것만: 이미지 생성 → 자르기 → 묶기
//   npm run art -- scenery gen props1      이미지 생성만 (Codex. 시트 이름을 안 주면 빠진 것 전부). --force 로 다시 만든다
//   npm run art -- scenery cut             시트를 물체별로 자르고 크기를 맞춘다
//   npm run art -- scenery pack            게임이 읽는 public/scenery/ 를 만든다
//
// 무엇을 그릴지는 data/art/scenery_sheets.csv (시트)와 data/art/scenery.csv (시트 안의 물체)에 적는다.
// 여러 물체를 한 장에 격자로 그려 받아 잘라 쓰므로, 물체 수만큼 이미지를 생성하지 않아도 된다.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';
import { csvRecords } from '../../src/core/csv.ts';
import { alphaBox, borderKey, chromaKey, cutGrid, grade, makeSeamless, meanColor, packShelves, removeSpecks, shrinkAlpha } from './lib/pixels.ts';
import { ArtError, KEYS, ROOT, ensureDir, fail, loadImage, num, setting, toSharp, writeJson } from './lib/common.mjs';
import { codexImage } from './image.mjs';

const SRC = join(ROOT, 'art', 'scenery');
const ITEMS = join(SRC, 'items');
const OUT = join(ROOT, 'public', 'scenery');
const TILE = 64;
/** 벽 앞면의 높이 (월드 px). src/render/mapView.ts 의 WALL_H 와 같아야 한다 */
const WALL_H = 44;

const table = (name) => csvRecords(readFileSync(join(ROOT, 'data', 'art', name), 'utf8')).rows.map((r) => ({ ...r.cells, line: r.line }));

function load() {
  const sheets = table('scenery_sheets.csv').map((r) => {
    const where = `data/art/scenery_sheets.csv ${r.line}번째 줄`;
    if (r.kind !== 'texture' && r.kind !== 'grid') fail(`${where}: kind 는 texture 또는 grid 여야 합니다`);
    if (r.kind === 'grid' && !KEYS[r.key]) fail(`${where}: key 는 ${Object.keys(KEYS).join(' / ')} 중 하나여야 합니다`);
    return { ...r, rows: Number(r.rows) || 1, cols: Number(r.cols) || 1 };
  });
  const items = table('scenery.csv').map((r) => {
    const where = `data/art/scenery.csv ${r.line}번째 줄`;
    const sheet = sheets.find((s) => s.sheet === r.sheet) ?? fail(`${where}: 시트 "${r.sheet}" 가 scenery_sheets.csv 에 없습니다`);
    const cell = Number(r.cell);
    if (!(cell >= 1 && cell <= sheet.rows * sheet.cols)) fail(`${where}: cell 은 1~${sheet.rows * sheet.cols} 이어야 합니다`);
    const size = Number(r.size);
    if (!(size > 0)) fail(`${where}: size 는 0보다 큰 숫자여야 합니다 (게임에서의 너비, px)`);
    return { ...r, cell, size, tw: Number(r.tw) || 0, th: Number(r.th) || 0 };
  });
  return { sheets, items };
}

const VIEW = {
  object: 'Every object is drawn from the same three-quarter top-down camera, like map objects in a classic 2D action RPG: we look down at it from the front at about 45 degrees, so its front face is fully visible and its top face is visible above it. Each object stands upright.',
  front: 'Every object is drawn as a flat front view, seen straight-on, as if mounted on a wall facing the viewer. No perspective.',
  top: 'Every object is drawn as a flat view from directly above, as if lying on the ground. No perspective.',
};

function sheetPrompt(sheet, items) {
  const save = `Use your built-in image generation tool to create ONE image. Then copy the generated PNG file into the current working directory as ${sheet.sheet}.png. Do not draw the image with code, do not write any other files, and do not modify anything else. When done, reply with only the absolute path of the generated source file.`;
  const theme = setting('scenery.theme');
  if (sheet.kind === 'texture') {
    return `${save}

IMAGE TO GENERATE
${sheet.prompt}
Setting: ${theme}.
Style: hand-painted anime game background texture with clean flat cel-shaded colors, not photorealistic, matching a chibi anime action game.
The texture fills the entire square image edge to edge with the same density of detail everywhere: no vignette, no border, no frame, no text, no focal point.`;
  }
  const key = KEYS[sheet.key];
  const list = items
    .slice()
    .sort((a, b) => a.cell - b.cell)
    .map((it) => `${it.cell}) ${it.desc}`)
    .join('\n');
  return `${save}

IMAGE TO GENERATE
A game asset sheet for a 2D top-down action RPG. Setting: ${theme}.
The sheet shows ${items.length} separate objects arranged in a ${sheet.rows} x ${sheet.cols} grid (${sheet.rows} rows, ${sheet.cols} columns), exactly one object per cell. Each object is centered in its cell with wide empty space around it, and never touches another object or the image edge.
The objects, in reading order (left to right, top to bottom):
${list}
View: ${VIEW[sheet.view] ?? VIEW.object}
Style: ${setting('scenery.objectStyle')}${items.some((it) => it.use.startsWith('thing:')) ? ` ${setting('scenery.thingStyle')}` : ''} Do not use ${sheet.key === 'magenta' ? 'magenta, pink or purple' : 'green'} for the outlines or large areas of the objects.
Background: one perfectly flat solid ${key.text} color filling the entire image. No ground, no cast shadows on the background, no gradient, no text, no labels, no numbers, no grid lines, no borders.`;
}

// ---- 1. 이미지 생성 ---------------------------------------------------------

async function gen(names, opts) {
  const { sheets, items } = load();
  const todo = sheets.filter((s) => (names.length ? names.includes(s.sheet) : true)).filter((s) => opts.force || !existsSync(join(SRC, `${s.sheet}.png`)));
  for (const n of names) if (!sheets.some((s) => s.sheet === n)) fail(`시트 "${n}" 가 없습니다. 있는 것: ${sheets.map((s) => s.sheet).join(', ')}`);
  if (!todo.length) {
    console.log('만들 시트가 없습니다 (이미 있음. 다시 만들려면 --force)');
    return;
  }
  ensureDir(SRC);
  for (const s of todo) {
    console.log(`Codex로 이미지 생성 중: ${s.sheet} (1~3분)`);
    // 오브젝트 시트는 바닥 질감을 함께 보여 줘서 그림체와 색을 거기에 맞추게 한다
    const ref = join(SRC, `${setting('scenery.styleRef')}.png`);
    const refs = s.kind === 'grid' && existsSync(ref) ? [ref] : [];
    codexImage(sheetPrompt(s, items.filter((it) => it.sheet === s.sheet)), refs, join(SRC, `${s.sheet}.png`));
    console.log(`저장: ${relative(process.cwd(), join(SRC, `${s.sheet}.png`))}`);
  }
}

// ---- 2. 자르기 --------------------------------------------------------------

async function cut() {
  const { sheets, items } = load();
  const scale = num('sheet.texScale');
  if (existsSync(ITEMS)) for (const f of readdirSync(ITEMS)) rmSync(join(ITEMS, f));
  ensureDir(ITEMS);
  let missing = 0;
  // 오브젝트의 색을 바닥의 색조 쪽으로 모아, 따로 그린 그림들이 한 장면처럼 보이게 한다 (0이면 하지 않는다)
  const groundSrc = join(SRC, `${setting('scenery.styleRef')}.png`);
  const gradeAmount = num('scenery.grade');
  const groundTint = gradeAmount > 0 && existsSync(groundSrc) ? meanColor(await loadImage(groundSrc)) : null;
  for (const s of sheets) {
    const src = join(SRC, `${s.sheet}.png`);
    const mine = items.filter((it) => it.sheet === s.sheet);
    if (!existsSync(src)) {
      console.log(`[${s.sheet}] 이미지가 없어 건너뜁니다 (npm run art -- scenery gen ${s.sheet})`);
      missing++;
      continue;
    }
    const img = await loadImage(src);
    if (s.kind === 'texture') {
      for (const it of mine) {
        const px = Math.round(it.size * scale);
        if (it.use === 'wall') {
          // 벽 앞면: 가로로 긴 띠만 쓴다. 이미지의 가운데에서 띠 비율만큼 잘라 가로로만 이어 붙인다
          const seamless = makeSeamless(img, 0.2, 'x');
          const bandH = Math.round((seamless.w * WALL_H) / it.size);
          const top = Math.round((seamless.h - bandH) / 2);
          await toSharp(seamless).extract({ left: 0, top, width: seamless.w, height: bandH }).resize(px, WALL_H * scale, { fit: 'fill' }).removeAlpha().png().toFile(join(ITEMS, `${it.id}.png`));
        } else {
          const seamless = makeSeamless(img, 0.2, 'xy');
          // 지붕은 바깥 어둠과 구분되도록 표에 적은 만큼 밝힌다
          const bright = it.use === 'roof' ? num('scenery.roofBrightness') : 1;
          await toSharp(seamless).resize(px, px, { fit: 'fill' }).removeAlpha().modulate({ brightness: bright }).png().toFile(join(ITEMS, `${it.id}.png`));
        }
        console.log(`[${s.sheet}] ${it.id}: 이어 붙는 질감 ${px}px`);
      }
      continue;
    }
    chromaKey(img, borderKey(img), { lo: num('key.lo'), hi: num('key.hi'), hue: num('key.hue') });
    shrinkAlpha(img, num('key.shrink'));
    removeSpecks(img, 60);
    if (groundTint) grade(img, groundTint, gradeAmount, num('scenery.gradeSat'));
    const boxes = cutGrid(img, s.rows, s.cols, 200);
    const found = boxes.filter(Boolean).length;
    if (found !== s.rows * s.cols) console.log(`[${s.sheet}] 주의: ${s.rows * s.cols}칸 중 ${found}칸에서만 물체를 찾았습니다. 시트 이미지를 확인하세요`);
    for (const it of mine) {
      const box = boxes[it.cell - 1];
      if (!box) {
        console.log(`[${s.sheet}] 주의: ${it.cell}번 칸이 비어 있어 ${it.id} 를 만들지 못했습니다`);
        missing++;
        continue;
      }
      const w = Math.round(it.size * scale);
      const h = Math.max(1, Math.round((box.h * w) / box.w));
      await toSharp(img).extract({ left: box.x, top: box.y, width: box.w, height: box.h }).resize(w, h, { kernel: 'lanczos3', fit: 'fill' }).png().toFile(join(ITEMS, `${it.id}.png`));
    }
    console.log(`[${s.sheet}] 물체 ${mine.length}개를 잘랐습니다`);
  }
  await contact(items);
  return missing;
}

/** 확인용: 자른 물체들을 이름 순서대로 한 장에 늘어놓는다 (art/scenery/preview.png) */
async function contact(items) {
  const cells = [];
  let x = 8;
  let y = 8;
  let rowH = 0;
  const W = 1900;
  for (const it of items) {
    const file = join(ITEMS, `${it.id}.png`);
    if (!existsSync(file) || it.use === 'ground' || it.use === 'roof') continue;
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
  const ground = join(ITEMS, 'ground.png');
  // 바닥 질감 한 장보다 작은 그림에는 이어 깔 수 없으므로, 높이를 그만큼은 확보한다
  const H = Math.max(y + rowH + 8, existsSync(ground) ? (await sharp(ground).metadata()).height : 0);
  // 게임에서와 같은 배율(월드 1px = 시트 texScale px)로 바닥을 깔아, 오브젝트가 바닥과 어울리는지 본다
  const base = existsSync(ground)
    ? sharp({ create: { width: W, height: H, channels: 3, background: '#000' } }).composite([{ input: ground, tile: true, left: 0, top: 0 }, ...cells])
    : sharp({ create: { width: W, height: H, channels: 3, background: '#3a3f4b' } }).composite(cells);
  await base.png().toFile(join(SRC, 'preview.png'));
}

// ---- 3. 묶기 ----------------------------------------------------------------

async function pack() {
  const { items } = load();
  const have = items.filter((it) => existsSync(join(ITEMS, `${it.id}.png`)));
  if (existsSync(OUT)) rmSync(OUT, { recursive: true });
  if (!have.some((it) => it.use === 'ground') || !have.some((it) => it.use === 'roof') || !have.some((it) => it.use === 'wall')) {
    console.log('바닥·지붕·벽 질감이 모두 있어야 게임에 넣을 수 있습니다. 지금은 게임이 도형 맵으로 그려집니다');
    return;
  }
  ensureDir(OUT);
  const quality = num('sheet.quality') || 90;
  const scale = num('sheet.texScale');
  const hash = createHash('sha1');

  // 바닥은 화면 전체에 반복해 까는 질감이라 따로 둔다
  const ground = have.find((it) => it.use === 'ground');
  const groundBuf = await sharp(join(ITEMS, `${ground.id}.png`)).webp({ quality, effort: 5 }).toBuffer();
  await sharp(groundBuf).toFile(join(OUT, 'ground.webp'));
  hash.update(groundBuf);

  const packed = have.filter((it) => it.use !== 'ground');
  const sizes = [];
  for (const it of packed) {
    const m = await sharp(join(ITEMS, `${it.id}.png`)).metadata();
    sizes.push({ w: m.width, h: m.height });
  }
  const { placed, pages } = packShelves(sizes, num('sheet.maxSize'), num('sheet.pad'));
  const names = pages.map((_, i) => `scenery-${i}.webp`);
  let bytes = statSync(join(OUT, 'ground.webp')).size;
  for (const [i, pg] of pages.entries()) {
    const buf = await sharp({ create: { width: pg.w, height: pg.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite(packed.map((it, k) => ({ it, k })).filter(({ k }) => placed[k].page === i).map(({ it, k }) => ({ input: join(ITEMS, `${it.id}.png`), left: placed[k].x, top: placed[k].y })))
      .webp({ quality, alphaQuality: 100, effort: 5 })
      .toBuffer();
    await sharp(buf).toFile(join(OUT, names[i]));
    bytes += buf.length;
    hash.update(buf);
  }

  const frame = (k) => [placed[k].page, placed[k].x, placed[k].y, sizes[k].w, sizes[k].h];
  const data = { version: 1, v: '', scale: 1 / scale, ground: 'ground.webp', pages: names, roof: null, wall: null, props: {}, things: {}, wallDecals: [], floorDecals: [] };
  packed.forEach((it, k) => {
    const entry = { id: it.id, f: frame(k), ...(it.glow ? { glow: it.glow } : {}) };
    if (it.use === 'roof') data.roof = frame(k);
    else if (it.use === 'wall') data.wall = frame(k);
    else if (it.use === 'walldecal') data.wallDecals.push(entry);
    else if (it.use === 'floordecal') data.floorDecals.push(entry);
    else if (it.use.startsWith('thing:')) data.things[it.use.slice(6)] = entry;
    else if (it.use.startsWith('prop:')) (data.props[`${it.use.slice(5)}:${it.tw}x${it.th}`] ??= []).push(entry);
  });
  hash.update(JSON.stringify(data));
  data.v = hash.digest('hex').slice(0, 10);
  writeJson(join(OUT, 'scenery.json'), data);
  console.log(`맵 그림 ${packed.length + 1}개 → ${relative(process.cwd(), OUT)} (시트 ${pages.map((p) => `${p.w}x${p.h}`).join(', ')}, 파일 ${(bytes / 1024).toFixed(0)}KB)`);
  console.log(`  엄폐 오브젝트: ${Object.entries(data.props).map(([k, v]) => `${k}(${v.length})`).join(', ') || '없음'}`);
  console.log(`  상호작용 오브젝트: ${Object.keys(data.things).join(', ') || '없음'} / 벽 장식 ${data.wallDecals.length} / 바닥 장식 ${data.floorDecals.length}`);
}

export async function run(args, opts) {
  const [step, ...names] = args;
  if (step === 'gen') return gen(names, opts);
  if (step === 'cut') return void (await cut());
  if (step === 'pack') return pack();
  if (step) throw new ArtError('사용법: npm run art -- scenery [gen [시트…] | cut | pack] [--force]');
  await gen([], opts);
  await cut();
  await pack();
}
