// 고정 맵 초안 생성기.
//
// 섹터 맵의 "디자인(지형)"은 고정이다. 이 도구는 구역 단위 설계도(SPEC)를 칸 단위 맵 파일로 펼쳐
// data/maps/*.txt 를 만든다. 한 번 만든 뒤에는 txt 파일을 직접 고쳐도 된다.
// (이 도구를 다시 실행하면 txt를 덮어쓰므로, 손으로 고친 맵은 SPEC 목록에서 빼거나 --only 로 일부만 생성한다.)
//
//   node tools/make-maps.mjs            전체 생성
//   node tools/make-maps.mjs sector03   지정한 맵만 생성
//
// 구역 설계도 문법 (짝수 칸 = 구역, 홀수 칸 = 구역 사이 연결)
//   구역:  S 시작 / E 출구(수호 무리 포함) / e 출구(수호 무리 없음) / m 무리 후보 / t 무리 후보 + 수색 후보 2
//          l 수색 후보 2 / n NPC 후보 / o 빈 구역 / 공백 막힌 곳
//   연결:  - | 좁은 입구   = H 벽 없이 트인 연결   공백 연결 없음
//
// 맵 파일 문자
//   # 벽·건물   . 바닥(엄폐 오브젝트가 무작위로 놓일 수 있음)   _ 통로(항상 비워 둠)
//   S 시작   E 출구   G 출구 수호 무리(보스 맵에서는 보스 위치)   M 무리 후보   L 수색 오브젝트 후보   N NPC 후보
//   X 고정 장애물   W 웨이브 출현 지점
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'maps');
const CW = 10; // 구역 가로 칸 수
const CH = 8; // 구역 세로 칸 수

const LEGEND = [
  '; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)',
  '; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현',
];

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSector({ name, title, spec, seed }) {
  const rows = spec.length;
  const cols = spec[0].length;
  for (const line of spec) {
    if (line.length !== cols) throw new Error(`${name}: 설계도 줄 길이가 다릅니다 → "${line}"`);
  }
  const gw = (cols + 1) / 2;
  const gh = (rows + 1) / 2;
  const W = gw * CW;
  const H = gh * CH;
  const g = Array.from({ length: H }, () => Array(W).fill('#'));
  const rand = makeRng(seed);
  const cell = (cx, cy) => spec[cy * 2]?.[cx * 2] ?? ' ';
  const isOpen = (cx, cy) => cell(cx, cy) !== ' ';
  const hConn = (cx, cy) => spec[cy * 2]?.[cx * 2 + 1] ?? ' ';
  const vConn = (cx, cy) => spec[cy * 2 + 1]?.[cx * 2] ?? ' ';
  const set = (x, y, ch) => {
    if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = ch;
  };
  const get = (x, y) => g[y]?.[x] ?? '#';

  // 1) 구역 내부 바닥
  for (let cy = 0; cy < gh; cy++) {
    for (let cx = 0; cx < gw; cx++) {
      if (!isOpen(cx, cy)) continue;
      const x0 = cx * CW;
      const y0 = cy * CH;
      for (let y = 1; y <= CH - 2; y++) for (let x = 1; x <= CW - 2; x++) set(x0 + x, y0 + y, '.');
    }
  }

  // 2) 모서리 건물 덩어리: 구역이 네모반듯해 보이지 않게 한다 (통로 칸은 침범하지 않는 크기)
  for (let cy = 0; cy < gh; cy++) {
    for (let cx = 0; cx < gw; cx++) {
      if (!isOpen(cx, cy)) continue;
      const x0 = cx * CW;
      const y0 = cy * CH;
      for (const [sx, sy] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ]) {
        if (rand() > 0.5) continue;
        const bw = 1 + Math.floor(rand() * 3);
        const bh = 1 + Math.floor(rand() * 2);
        for (let j = 0; j < bh; j++) {
          for (let i = 0; i < bw; i++) {
            const x = sx === 0 ? 1 + i : CW - 2 - i;
            const y = sy === 0 ? 1 + j : CH - 2 - j;
            set(x0 + x, y0 + y, '#');
          }
        }
      }
    }
  }

  // 3) 구역 사이 연결
  for (let cy = 0; cy < gh; cy++) {
    for (let cx = 0; cx < gw; cx++) {
      const x0 = cx * CW;
      const y0 = cy * CH;
      const h = hConn(cx, cy);
      if (h === '-' || h === '=') {
        const [a, b] = h === '-' ? [2, 5] : [1, CH - 2];
        for (let y = a; y <= b; y++) {
          set(x0 + CW - 1, y0 + y, '.');
          set(x0 + CW, y0 + y, '.');
        }
      }
      const v = vConn(cx, cy);
      if (v === '|' || v === 'H') {
        const [a, b] = v === '|' ? [3, 6] : [1, CW - 2];
        for (let x = a; x <= b; x++) {
          set(x0 + x, y0 + CH - 1, '.');
          set(x0 + x, y0 + CH, '.');
        }
      }
    }
  }

  // 4) 통로: 구역 중심끼리 폭 2칸으로 잇는다. 무작위 오브젝트가 놓이지 않는 주 동선이 된다.
  for (let cy = 0; cy < gh; cy++) {
    for (let cx = 0; cx < gw; cx++) {
      if (!isOpen(cx, cy)) continue;
      const x0 = cx * CW;
      const y0 = cy * CH;
      for (let y = 3; y <= 4; y++) for (let x = 4; x <= 5; x++) set(x0 + x, y0 + y, '_');
      if (hConn(cx, cy) !== ' ') {
        for (let x = 4; x <= CW + 5; x++) for (let y = 3; y <= 4; y++) set(x0 + x, y0 + y, '_');
      }
      if (vConn(cx, cy) !== ' ') {
        for (let y = 3; y <= CH + 4; y++) for (let x = 4; x <= 5; x++) set(x0 + x, y0 + y, '_');
      }
    }
  }

  // 5) 표식
  const markers = [];
  const farFromMarkers = (x, y, d) => markers.every((m) => Math.abs(m.x - x) > d || Math.abs(m.y - y) > d);
  const mark = (x, y, ch) => {
    set(x, y, ch);
    markers.push({ x, y, ch });
  };
  const placeLoot = (cx, cy, count) => {
    const x0 = cx * CW;
    const y0 = cy * CH;
    let placed = 0;
    for (let tries = 0; tries < 80 && placed < count; tries++) {
      const x = x0 + 1 + Math.floor(rand() * (CW - 2));
      const y = y0 + 1 + Math.floor(rand() * (CH - 2));
      if (get(x, y) !== '.') continue;
      if (!farFromMarkers(x, y, 2)) continue;
      mark(x, y, 'L');
      placed++;
    }
  };
  for (let cy = 0; cy < gh; cy++) {
    for (let cx = 0; cx < gw; cx++) {
      const c = cell(cx, cy);
      if (c === ' ') continue;
      const x0 = cx * CW;
      const y0 = cy * CH;
      if (c === 'S') {
        mark(x0 + 4, y0 + 3, 'S');
      } else if (c === 'E' || c === 'e') {
        // 출구는 들어온 방향의 반대편 끝에 둔다
        let dx = 0;
        let dy = 0;
        if (cx > 0 && hConn(cx - 1, cy) !== ' ') dx = 1;
        else if (hConn(cx, cy) !== ' ') dx = -1;
        else if (cy > 0 && vConn(cx, cy - 1) !== ' ') dy = 1;
        else if (vConn(cx, cy) !== ' ') dy = -1;
        const ex = x0 + 4 + (dx > 0 ? 4 : dx < 0 ? -3 : 0);
        const ey = y0 + 3 + (dy > 0 ? 3 : dy < 0 ? -2 : 0);
        for (let j = -1; j <= 1; j++) {
          for (let i = -1; i <= 1; i++) {
            const x = ex + i;
            const y = ey + j;
            const inside = x > x0 && x < x0 + CW - 1 && y > y0 && y < y0 + CH - 1;
            if (inside && get(x, y) === '#') set(x, y, '.');
          }
        }
        // 중심에서 출구까지도 통로로 잇는다
        for (let x = Math.min(x0 + 4, ex); x <= Math.max(x0 + 5, ex); x++) {
          for (let y = y0 + 3; y <= y0 + 4; y++) if (get(x, y) !== '_') set(x, y, '_');
        }
        for (let y = Math.min(y0 + 3, ey); y <= Math.max(y0 + 4, ey); y++) {
          for (let x = x0 + 4; x <= x0 + 5; x++) if (get(x, y) !== '_') set(x, y, '_');
        }
        mark(ex, ey, 'E');
        if (c === 'E') mark(x0 + 5, y0 + 4, 'G');
      } else if (c === 'm') {
        mark(x0 + 5, y0 + 3, 'M');
        if (rand() < 0.5) placeLoot(cx, cy, 1);
      } else if (c === 't') {
        mark(x0 + 5, y0 + 3, 'M');
        placeLoot(cx, cy, 2);
      } else if (c === 'l') {
        placeLoot(cx, cy, 2);
      } else if (c === 'n') {
        mark(x0 + 4, y0 + 4, 'N');
        placeLoot(cx, cy, 1);
      } else if (c === 'o') {
        if (rand() < 0.4) placeLoot(cx, cy, 1);
      }
    }
  }

  validate(name, g, W, H);
  write(name, title, g);
}

/** 사방이 막힌 단일 전투장 (보스전, 웨이브) */
function buildArena({ name, title, w, h, floor, pillars, start, boss, waves }) {
  const g = Array.from({ length: h }, () => Array(w).fill('#'));
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) g[y][x] = floor;
  // 모서리를 깎아 둥근 전투장으로
  const cut = 3;
  for (let j = 0; j < cut; j++) {
    for (let i = 0; i < cut - j; i++) {
      g[1 + j][1 + i] = '#';
      g[1 + j][w - 2 - i] = '#';
      g[h - 2 - j][1 + i] = '#';
      g[h - 2 - j][w - 2 - i] = '#';
    }
  }
  for (const [x, y] of pillars) g[y][x] = 'X';
  g[start[1]][start[0]] = 'S';
  if (boss) g[boss[1]][boss[0]] = 'G';
  for (const [x, y] of waves ?? []) g[y][x] = 'W';
  validate(name, g, w, h);
  write(name, title, g);
}

function validate(name, g, W, H) {
  let sx = -1;
  let sy = -1;
  const targets = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = g[y][x];
      if (c === 'S') {
        sx = x;
        sy = y;
      } else if ('EGMLNW'.includes(c)) targets.push([x, y, c]);
    }
  }
  if (sx < 0) throw new Error(`${name}: 시작 지점(S)이 없습니다`);
  const seen = new Uint8Array(W * H);
  const queue = [[sx, sy]];
  seen[sy * W + sx] = 1;
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      if (seen[ny * W + nx] || g[ny][nx] === '#' || g[ny][nx] === 'X') continue;
      seen[ny * W + nx] = 1;
      queue.push([nx, ny]);
    }
  }
  for (const [x, y, c] of targets) {
    if (!seen[y * W + x]) throw new Error(`${name}: (${x},${y})의 ${c} 표식에 걸어서 갈 수 없습니다`);
  }
  const count = (ch) => targets.filter((t) => t[2] === ch).length;
  console.log(
    `${name.padEnd(12)} ${W}x${H}  무리 후보 ${count('M')}  수색 후보 ${count('L')}  NPC 후보 ${count('N')}  출구 ${count('E')}`,
  );
}

function write(name, title, g) {
  mkdirSync(OUT, { recursive: true });
  const body = g.map((row) => row.join('')).join('\n');
  writeFileSync(join(OUT, `${name}.txt`), [`; ${title}`, ...LEGEND, body, ''].join('\n'), 'utf8');
}

const SECTORS = [
  {
    name: 'sector01',
    title: '섹터 1 · 골목 어귀',
    seed: 101,
    spec: ['S-m-o  ', '    |  ', '  n-m=m', '      |', '    l-E'],
  },
  {
    name: 'sector02',
    title: '섹터 2 · 폐상가',
    seed: 202,
    spec: ['o=m-t  ', 'H   |  ', 'S   m-n', '    |  ', 'l-m-o=E'],
  },
  {
    name: 'sector03',
    title: '섹터 3 · 주차장 뒷길',
    seed: 303,
    spec: ['    l    ', '    |    ', 'S=m=m-n  ', '    H    ', '  t-m=o  ', '      |  ', '      E-l'],
  },
  {
    name: 'sector04',
    title: '섹터 4 · 시장 골목',
    seed: 404,
    spec: ['l-m-S  ', '  |    ', '  o=m-t', '    |  ', 'n-m-o  ', '  |    ', '  m=m-E'],
  },
  {
    name: 'sector05',
    title: '섹터 5 · 철길 건널목',
    seed: 505,
    spec: ['S-m=m-o-l', '      |  ', 'l-m=m-o  ', '  |      ', '  o-n    ', '  |      ', '  m=m-E  '],
  },
  {
    name: 'sector06',
    title: '섹터 6 · 학교 뒤편',
    seed: 606,
    spec: ['m=m-t    ', '|   |    ', 'S   m=m-l', '    |    ', 'n-o-m    ', '    |    ', 'l-m=m-E  '],
  },
  {
    name: 'sector07',
    title: '섹터 7 · 강변 창고',
    seed: 707,
    spec: ['    S    ', '    |    ', 'l-m=m=m-n', '  |   |  ', '  m   m  ', '  |   |  ', '  o=E=o  '],
  },
  {
    name: 'sector08',
    title: '섹터 8 · 구도심 광장',
    seed: 808,
    spec: ['t-m=m-S  ', '  H H    ', '  m=m-o-l', '  |      ', 'n-o-m=m  ', '      |  ', '    l-E  '],
  },
  {
    name: 'bonus01',
    title: '보너스 · 버려진 보급소',
    seed: 901,
    spec: ['S-l=l', '  | |', '  l e'],
  },
];

const ARENAS = [
  {
    name: 'sector09',
    title: '섹터 9 · 그믐의 우산 (보스 전투장)',
    w: 28,
    h: 20,
    floor: '_',
    pillars: [
      [7, 6],
      [20, 6],
      [7, 13],
      [20, 13],
    ],
    start: [14, 16],
    boss: [14, 7],
  },
  {
    name: 'arena_wave',
    title: '괴이 범람 전투장',
    w: 34,
    h: 24,
    floor: '.',
    pillars: [
      [9, 7],
      [24, 7],
      [9, 16],
      [24, 16],
      [16, 5],
      [17, 18],
    ],
    start: [17, 12],
    waves: [
      [5, 3],
      [16, 2],
      [28, 3],
      [31, 11],
      [28, 20],
      [17, 21],
      [5, 20],
      [2, 12],
    ],
  },
];

const only = process.argv.slice(2);
for (const s of SECTORS) if (!only.length || only.includes(s.name)) buildSector(s);
for (const a of ARENAS) if (!only.length || only.includes(a.name)) buildArena(a);
