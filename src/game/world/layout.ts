// 고정 맵 파일(data/maps/*.txt)을 읽어 지형 정보로 바꾼다.

/** 한 칸의 크기(px) */
export const TILE = 64;

export interface Pt {
  x: number;
  y: number;
}

export interface MapLayout {
  name: string;
  /** 가로·세로 칸 수 */
  w: number;
  h: number;
  /** 칸별 지형: 0 바닥, 1 벽·건물, 2 고정 장애물 */
  base: Uint8Array;
  /** 1 = 무작위 오브젝트를 놓으면 안 되는 칸 (통로, 표식과 그 주변) */
  keep: Uint8Array;
  start: Pt;
  exit: Pt | null;
  /** 출구 수호 무리 또는 보스의 위치 */
  gate: Pt | null;
  packSlots: Pt[];
  lootSlots: Pt[];
  npcSlots: Pt[];
  waveSlots: Pt[];
}

const MARKERS = 'SEGMLNW';

export function parseLayout(name: string, text: string): MapLayout {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.length > 0 && !l.startsWith(';'));
  if (!lines.length) throw new Error(`맵 ${name}: 내용이 비어 있습니다`);
  const w = lines[0].length;
  const h = lines.length;
  const base = new Uint8Array(w * h);
  const keep = new Uint8Array(w * h);
  let start: Pt | null = null;
  let exit: Pt | null = null;
  let gate: Pt | null = null;
  const packSlots: Pt[] = [];
  const lootSlots: Pt[] = [];
  const npcSlots: Pt[] = [];
  const waveSlots: Pt[] = [];

  const reserve = (x: number, y: number): void => {
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const nx = x + i;
        const ny = y + j;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h) keep[ny * w + nx] = 1;
      }
    }
  };

  for (let y = 0; y < h; y++) {
    const line = lines[y];
    if (line.length !== w) {
      throw new Error(`맵 ${name}: ${y + 1}번째 줄의 길이(${line.length})가 첫 줄(${w})과 다릅니다`);
    }
    for (let x = 0; x < w; x++) {
      const c = line[x];
      const i = y * w + x;
      if (c === '#') base[i] = 1;
      else if (c === 'X') base[i] = 2;
      else if (c === '.') base[i] = 0;
      else if (c === '_') keep[i] = 1;
      else if (MARKERS.includes(c)) {
        reserve(x, y);
        const p = { x, y };
        if (c === 'S') start = p;
        else if (c === 'E') exit = p;
        else if (c === 'G') gate = p;
        else if (c === 'M') packSlots.push(p);
        else if (c === 'L') lootSlots.push(p);
        else if (c === 'N') npcSlots.push(p);
        else if (c === 'W') waveSlots.push(p);
      } else {
        throw new Error(`맵 ${name}: (${x + 1}, ${y + 1})에 알 수 없는 문자 "${c}"가 있습니다`);
      }
    }
  }
  if (!start) throw new Error(`맵 ${name}: 시작 지점(S)이 없습니다`);
  return { name, w, h, base, keep, start, exit, gate, packSlots, lootSlots, npcSlots, waveSlots };
}

/** 칸 좌표 → 칸 중심의 월드 좌표 */
export const tileCenter = (t: Pt): Pt => ({ x: (t.x + 0.5) * TILE, y: (t.y + 0.5) * TILE });
