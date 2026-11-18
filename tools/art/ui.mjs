// 화면(UI)에 쓰는 그림을 만든다: 캐릭터 초상화, 펫, 버튼·장비 아이콘, 로비 배경.
//
//   npm run art -- ui                 빠진 것만: 이미지 생성 → 자르기 → src/assets/ 에 저장, 초상화도 함께
//   npm run art -- ui gen icons       이미지 생성만 (Codex). --force 로 다시 만든다
//   npm run art -- ui cut             시트를 잘라 src/assets/ui/ 에 저장
//   npm run art -- ui portraits       캐릭터 기본 이미지에서 얼굴을 잘라 src/assets/portraits/ 에 저장 (생성 없음)
//
// 무엇을 그릴지는 data/art/ui_sheets.csv (시트)와 data/art/ui.csv (시트 안의 그림, 크기)에 적는다.
// src/assets/ 의 그림은 빌드할 때 게임에 함께 묶이고, 없는 그림은 예전의 도형 아이콘으로 나온다.
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';
import { csvRecords } from '../../src/core/csv.ts';
import { alphaBox, bodyMetrics, borderKey, chromaKey, cutGrid, removeSpecks, shrinkAlpha } from './lib/pixels.ts';
import { ArtError, KEYS, ROOT, ensureDir, fail, loadImage, num, paths, tables, toSharp } from './lib/common.mjs';
import { codexImage } from './image.mjs';

const SRC = join(ROOT, 'art', 'ui');
const OUT_UI = join(ROOT, 'src', 'assets', 'ui');
const OUT_PORTRAITS = join(ROOT, 'src', 'assets', 'portraits');

const table = (name) => csvRecords(readFileSync(join(ROOT, 'data', 'art', name), 'utf8')).rows.map((r) => ({ ...r.cells, line: r.line }));

function load() {
  const sheets = table('ui_sheets.csv').map((r) => {
    const where = `data/art/ui_sheets.csv ${r.line}번째 줄`;
    if (r.kind !== 'image' && r.kind !== 'grid' && r.kind !== 'file') fail(`${where}: kind 는 image / grid / file 중 하나여야 합니다`);
    if (r.kind === 'grid' && !KEYS[r.key]) fail(`${where}: key 는 ${Object.keys(KEYS).join(' / ')} 중 하나여야 합니다`);
    return { ...r, rows: Number(r.rows) || 1, cols: Number(r.cols) || 1 };
  });
  const items = table('ui.csv').map((r) => {
    const where = `data/art/ui.csv ${r.line}번째 줄`;
    if (!sheets.some((s) => s.sheet === r.sheet)) fail(`${where}: 시트 "${r.sheet}" 가 ui_sheets.csv 에 없습니다`);
    const size = Number(r.size);
    if (!(size > 0)) fail(`${where}: size 는 0보다 큰 숫자여야 합니다 (그림의 너비, px)`);
    return { ...r, cell: Number(r.cell) || 1, size };
  });
  return { sheets, items };
}

const STYLE = {
  mascot:
    'Each one is a cute chibi mascot creature for a chibi anime action game: full body, facing the viewer in a front three-quarter view, standing on the ground. Clean anime cel shading with crisp dark outlines and flat colors.',
  icon: 'Each one is a bold, simple game UI icon: a single clear symbol drawn as a solid white shape with a thin warm gold outline and a little soft gray shading, readable at small size. No frame, no circle, no badge behind the symbol.',
};

function sheetPrompt(sheet, items) {
  const save = `Use your built-in image generation tool to create ONE image. Then copy the generated PNG file into the current working directory as ${sheet.sheet}.png. Do not draw the image with code, do not write any other files, and do not modify anything else. When done, reply with only the absolute path of the generated source file.`;
  if (sheet.kind === 'image') return `${save}\n\nIMAGE TO GENERATE\n${sheet.prompt}\nStyle: polished anime background illustration with clean cel-shaded colors, matching a chibi anime action game.`;
  const key = KEYS[sheet.key];
  const list = items
    .slice()
    .sort((a, b) => a.cell - b.cell)
    .map((it) => `${it.cell}) ${it.desc}`)
    .join('\n');
  return `${save}

IMAGE TO GENERATE
A game asset sheet showing ${items.length} separate pictures arranged in a ${sheet.rows} x ${sheet.cols} grid (${sheet.rows} rows, ${sheet.cols} columns), exactly one per cell. Each one is centered in its cell with wide empty space around it, and never touches another one or the image edge.
In reading order (left to right, top to bottom):
${list}
${STYLE[sheet.style] ?? STYLE.icon}
Do not use ${sheet.key === 'magenta' ? 'magenta or pink' : 'green'} anywhere on them.
Background: one perfectly flat solid ${key.text} color filling the entire image. No ground, no cast shadows on the background, no gradient, no text, no labels, no numbers, no grid lines, no borders.`;
}

async function gen(names, opts) {
  const { sheets, items } = load();
  for (const n of names) if (!sheets.some((s) => s.sheet === n)) fail(`시트 "${n}" 가 없습니다. 있는 것: ${sheets.map((s) => s.sheet).join(', ')}`);
  const todo = sheets.filter((s) => s.kind !== 'file').filter((s) => !names.length || names.includes(s.sheet)).filter((s) => opts.force || !existsSync(join(SRC, `${s.sheet}.png`)));
  if (!todo.length) return console.log('만들 시트가 없습니다 (이미 있음. 다시 만들려면 --force)');
  ensureDir(SRC);
  for (const s of todo) {
    console.log(`Codex로 이미지 생성 중: ${s.sheet} (1~3분)`);
    codexImage(sheetPrompt(s, items.filter((it) => it.sheet === s.sheet)), [], join(SRC, `${s.sheet}.png`));
    console.log(`저장: ${relative(process.cwd(), join(SRC, `${s.sheet}.png`))}`);
  }
}

async function cut() {
  const { sheets, items } = load();
  ensureDir(OUT_UI);
  for (const s of sheets) {
    // kind=file: 생성하지 않고 prompt 칸에 적은 그림 파일(배경이 투명한 PNG)을 그대로 쓴다
    const src = s.kind === 'file' ? join(ROOT, s.prompt) : join(SRC, `${s.sheet}.png`);
    const mine = items.filter((it) => it.sheet === s.sheet);
    if (s.kind === 'file' && existsSync(src)) {
      for (const it of mine) {
        await sharp(src).resize(it.size, it.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' }).webp({ quality: 92, alphaQuality: 100, effort: 5 }).toFile(join(OUT_UI, `${it.id}.webp`));
      }
      console.log(`[${s.sheet}] 준 그림을 그대로 씀: ${mine.map((it) => it.id).join(', ')}`);
      continue;
    }
    if (!existsSync(src)) {
      console.log(`[${s.sheet}] 이미지가 없어 건너뜁니다 (npm run art -- ui gen ${s.sheet})`);
      continue;
    }
    if (s.kind === 'image') {
      for (const it of mine) await sharp(src).resize({ width: it.size }).webp({ quality: 82, effort: 5 }).toFile(join(OUT_UI, `${it.id}.webp`));
      console.log(`[${s.sheet}] 그림 ${mine.length}장`);
      continue;
    }
    const img = await loadImage(src);
    chromaKey(img, borderKey(img), { lo: num('key.lo'), hi: num('key.hi'), hue: num('key.hue') });
    shrinkAlpha(img, num('key.shrink'));
    removeSpecks(img, 60);
    const boxes = cutGrid(img, s.rows, s.cols, 200);
    for (const it of mine) {
      const box = boxes[it.cell - 1];
      if (!box) {
        console.log(`[${s.sheet}] 주의: ${it.cell}번 칸이 비어 있어 ${it.id} 를 만들지 못했습니다`);
        continue;
      }
      // 정사각형 칸 가운데에 맞춰 넣는다 (아이콘·초상화 칸에 그대로 쓸 수 있게)
      const side = Math.max(box.w, box.h);
      const crop = await toSharp(img).extract({ left: box.x, top: box.y, width: box.w, height: box.h }).png().toBuffer();
      await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: crop, left: Math.round((side - box.w) / 2), top: Math.round((side - box.h) / 2) }])
        .png()
        .toBuffer()
        .then((buf) => sharp(buf).resize(it.size, it.size, { kernel: 'lanczos3' }).webp({ quality: 92, alphaQuality: 100, effort: 5 }).toFile(join(OUT_UI, `${it.id}.webp`)));
    }
    console.log(`[${s.sheet}] 그림 ${mine.length}개를 잘랐습니다`);
  }
  console.log(`→ ${relative(process.cwd(), OUT_UI)}`);
}

/** 캐릭터의 SD 기본 이미지에서 얼굴 부분을 잘라 초상화로 쓴다 (새로 생성하지 않는다) */
async function portraits() {
  ensureDir(OUT_PORTRAITS);
  const made = [];
  for (const sub of tables().subjects.filter((s) => s.kind === 'char')) {
    const base = paths(sub.id).base(sub.dirs[0]);
    if (!existsSync(base)) continue;
    const img = await loadImage(base);
    chromaKey(img, borderKey(img), { lo: num('key.lo'), hi: num('key.hi'), hue: num('key.hue') });
    shrinkAlpha(img, num('key.shrink'));
    const box = alphaBox(img);
    if (!box) continue;
    const m = bodyMetrics(img, box);
    // 머리: 몸 높이의 위쪽 절반쯤. 머리 중심은 그 구간에서 불투명한 부분의 가로 중심으로 잡는다
    const side = Math.round(m.height * num('portrait.size'));
    const headBottom = box.y + Math.round(m.height * 0.5);
    let sum = 0;
    let n = 0;
    for (let y = box.y; y < headBottom; y += 2) {
      for (let x = box.x; x < box.x + box.w; x += 2) {
        const a = img.data[(y * img.w + x) * 4 + 3];
        if (a > 40) {
          sum += x;
          n++;
        }
      }
    }
    const cx = n ? sum / n : m.footX;
    const left = Math.max(0, Math.min(img.w - side, Math.round(cx - side / 2)));
    const top = Math.max(0, Math.min(img.h - side, Math.round(box.y - side * num('portrait.top'))));
    await toSharp(img).extract({ left, top, width: side, height: side }).resize(160, 160, { kernel: 'lanczos3' }).webp({ quality: 92, alphaQuality: 100, effort: 5 }).toFile(join(OUT_PORTRAITS, `${sub.id}.webp`));
    made.push(sub.id);
  }
  console.log(`초상화 ${made.length}명: ${made.join(', ')} → ${relative(process.cwd(), OUT_PORTRAITS)}`);
}

export async function run(args, opts) {
  const [step, ...names] = args;
  if (step === 'gen') return gen(names, opts);
  if (step === 'cut') return cut();
  if (step === 'portraits') return portraits();
  if (step) throw new ArtError('사용법: npm run art -- ui [gen [시트…] | cut | portraits] [--force]');
  await gen([], opts);
  await cut();
  await portraits();
}

