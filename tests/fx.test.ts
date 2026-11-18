// 이펙트 검사: 검은 배경 그림을 투명 조각으로 바꾸는 계산,
// 규칙 코드가 부르는 이펙트 이름이 모두 정의돼 있는지, 이펙트가 쓰는 그림이 모두 표와 게임 폴더에 있는지.
import { describe, expect, it } from 'vitest';
import { csvRecords } from '../src/core/csv';
import { FALLBACK_QUIET, RECIPES, mix } from '../src/render/fxRecipes';
import { coreOf, fadeEdges, lumKey, padBox, type Img } from '../tools/art/lib/pixels';

// 파일 내용을 글자로 읽는다 (Vite 의 ?raw)
const gameFiles = import.meta.glob<string>('/src/game/**/*.ts', { eager: true, query: '?raw', import: 'default' });
const renderFiles = import.meta.glob<string>('/src/render/**/*.ts', { eager: true, query: '?raw', import: 'default' });
const tables = import.meta.glob<string>('/data/art/fx*.csv', { eager: true, query: '?raw', import: 'default' });
interface FxFile {
  pages: string[];
  pieces: Record<string, unknown>;
  flips: Record<string, unknown>;
}
const fxFile = Object.values(import.meta.glob<FxFile>('/public/fx/fx.json', { eager: true, import: 'default' }))[0];
const pageFiles = Object.keys(import.meta.glob('/public/fx/*.webp'));

function image(w: number, h: number, px: (x: number, y: number) => [number, number, number]): Img {
  const img: Img = { w, h, data: new Uint8Array(w * h * 4) };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) img.data.set([...px(x, y), 255], (y * w + x) * 4);
  return img;
}

const all = (texts: string[], re: RegExp): string[] => [...new Set(texts.flatMap((t) => [...t.matchAll(re)].map((m) => m[1])))];

describe('검은 배경의 빛을 투명 조각으로', () => {
  it('밝기가 불투명도가 되고, 색을 입혀 쓸 조각은 흰색이 된다', () => {
    const img = image(4, 1, (x) => [[0, 0, 0], [10, 10, 10], [128, 128, 128], [255, 255, 255]][x] as [number, number, number]);
    lumKey(img, { lo: 0.07, hi: 0.92, gamma: 1 });
    const a = [3, 7, 11, 15].map((i) => img.data[i]);
    expect(a[0]).toBe(0);
    expect(a[1]).toBe(0); // 배경의 옅은 잡티는 지운다
    expect(a[2]).toBeGreaterThan(100);
    expect(a[2]).toBeLessThan(160);
    expect(a[3]).toBe(255);
    expect([...img.data.slice(8, 11)]).toEqual([255, 255, 255]);
  });

  it('색을 남기는 그림은 어두워진 만큼 색을 다시 밝힌다', () => {
    const img = image(1, 1, () => [100, 50, 0]);
    lumKey(img, { lo: 0, hi: 1, keepColor: true });
    // 더하기 합성에서 색 x 불투명도 = 원본 밝기
    expect([...img.data]).toEqual([255, 127, 0, 100]);
  });

  it('흰 심지는 가장 밝은 부분에만 생긴다', () => {
    const img = image(3, 1, (x) => [[80, 80, 80], [180, 180, 180], [255, 255, 255]][x] as [number, number, number]);
    lumKey(img, { lo: 0, hi: 1 });
    const core = coreOf(img, 0.6, 0.95);
    expect(core.data[3]).toBe(0);
    expect(core.data[7]).toBeGreaterThan(0);
    expect(core.data[7]).toBeLessThan(90);
    expect(core.data[11]).toBe(255);
  });

  it('잘라 낸 가장자리는 투명해져 네모난 자국이 남지 않는다', () => {
    const img = image(10, 10, () => [255, 255, 255]);
    fadeEdges(img, 3);
    const a = (x: number, y: number): number => img.data[(y * 10 + x) * 4 + 3];
    expect(a(0, 5)).toBe(0);
    expect(a(5, 0)).toBe(0);
    expect(a(1, 5)).toBe(85);
    expect(a(5, 5)).toBe(255);
  });

  it('상자를 넓혀도 그림 밖으로 나가지 않는다', () => {
    expect(padBox({ x: 5, y: 40, w: 20, h: 30 }, 10, 100, 75)).toEqual({ x: 0, y: 30, w: 35, h: 45 });
  });
});

describe('이름으로 부르는 이펙트', () => {
  const game = Object.values(gameFiles);
  const render = Object.values(renderFiles);

  it('규칙 코드가 부르는 이름은 모두 정의돼 있다', () => {
    const used = all(game, /\.fx\.play\(\s*'([^']+)'/g);
    expect(used.length).toBeGreaterThan(15);
    for (const name of used) expect(RECIPES[name], `이펙트 "${name}" 가 render/fxRecipes.ts 에 없습니다`).toBeTypeOf('function');
  });

  it('정의만 있고 아무도 부르지 않는 이름이 없다', () => {
    const used = new Set(all(game, /\.fx\.play\(\s*'([^']+)'/g));
    for (const name of Object.keys(RECIPES)) expect(used.has(name), `이펙트 "${name}" 를 부르는 곳이 없습니다`).toBe(true);
    for (const name of FALLBACK_QUIET) expect(RECIPES[name]).toBeTypeOf('function');
  });

  it('이펙트가 쓰는 조각·플립북은 모두 표에 있고, 게임 폴더에 조각이 들어 있다', () => {
    const table = (name: string): string[] => csvRecords(tables[`/data/art/${name}`]).rows.map((r) => r.cells.id);
    const pieces = new Set(table('fx.csv'));
    const flips = new Set(table('fx_flips.csv'));
    const usedPieces = all(render, /(?:\.piece|pieceSprites|fxArt\.piece)\(\s*'([^']+)'/g);
    const usedFlips = all(render, /\.flip\(\s*'([^']+)'/g);
    expect(usedPieces.length).toBeGreaterThan(20);
    for (const id of usedPieces) expect(pieces.has(id), `조각 "${id}" 가 data/art/fx.csv 에 없습니다`).toBe(true);
    for (const id of usedFlips) expect(flips.has(id), `플립북 "${id}" 가 data/art/fx_flips.csv 에 없습니다`).toBe(true);

    expect(fxFile, 'public/fx/fx.json 이 없습니다 (npm run art -- fx)').toBeTruthy();
    const json = fxFile;
    for (const page of json.pages) expect(pageFiles).toContain(`/public/fx/${page}`);
    for (const id of usedPieces) expect(json.pieces[id], `조각 "${id}" 의 그림이 public/fx 에 없습니다 (npm run art -- fx)`).toBeTruthy();
    // 플립북은 영상이 있어야 만들 수 있으므로 없어도 된다 (없으면 조각으로 대신 그린다). 있는 것은 표에 있어야 한다
    for (const id of Object.keys(json.flips)) expect(flips.has(id)).toBe(true);
  });

  it('색 섞기', () => {
    expect(mix(0x000000, 0xffffff, 0.5)).toBe(0x808080);
    expect(mix(0xff0000, 0x0000ff, 0)).toBe(0xff0000);
    expect(mix(0xff0000, 0x0000ff, 1)).toBe(0x0000ff);
  });
});
