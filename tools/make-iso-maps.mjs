// 마름모(아이소메트릭) 화면용 고정 맵 생성기. data/maps/s3_*.txt 를 만든다.
//
//   node tools/make-iso-maps.mjs            전체 생성
//   node tools/make-iso-maps.mjs s3_field   지정한 맵만 생성
//
// 한 번 만든 뒤에는 txt 파일을 직접 고쳐도 된다 (이 도구를 다시 실행하면 덮어쓴다).
//
// 마름모 화면에서는 맵의 +x 가 화면 오른쪽 아래(↘), -y 가 화면 오른쪽 위(↗)로 간다.
// 그래서 길을 "동(+x)으로 조금, 북(-y)으로 조금"을 번갈아 가는 계단 모양으로 놓으면
// 화면에서는 왼쪽에서 오른쪽으로 지그재그로 나아가는 길이 된다. 이렇게 놓으면
//  - 길의 뒤쪽(화면 위쪽)에는 걸어 다니는 곳이 없어, 높은 벽과 나무·건물이 배경처럼 늘어서고
//  - 길의 앞쪽(화면 아래쪽) 벽은 낮게 잘려 캐릭터를 가리지 않는다. (높이는 표시부가 정한다: src/render/isoMapView.ts)
//
// 맵 파일 문자는 기존 맵과 같다 (README 의 "맵" 절).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'maps');
/** 맵 바깥 가장자리에 두는 벽의 두께 (칸) */
const PAD = 4;

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

/** 덮어쓰는 순서: 표식 > 통로 > 고정 장애물 > 바닥 */
const RANK = { '.': 1, X: 2, _: 3 };
const rank = (ch) => RANK[ch] ?? 4;

/**
 * 길을 따라가며 바닥을 파는 붓. 위치(x, y)는 폭 2칸짜리 통로의 왼쪽 위 칸이다.
 * 좌표는 어디서 시작하든 상관없다. 다 그린 뒤 전체를 감싸는 크기로 맵을 만든다.
 */
class Brush {
  constructor(seed) {
    this.cells = new Map();
    this.x = 0;
    this.y = 0;
    this.rand = makeRng(seed);
    this.rooms = [];
  }

  put(x, y, ch) {
    const k = `${x},${y}`;
    const old = this.cells.get(k);
    if (!old || rank(ch) >= rank(old)) this.cells.set(k, ch);
  }

  get(x, y) {
    return this.cells.get(`${x},${y}`) ?? '#';
  }

  rect(x0, y0, x1, y1, ch) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.put(x, y, ch);
  }

  /** 지금 자리를 가운데로 하는 방 (통로 2칸 + 사방으로 rx, ry 칸) */
  room(rx, ry = rx) {
    const { x, y } = this;
    this.rect(x - rx, y - ry, x + 1 + rx, y + 1 + ry, '.');
    this.rect(x, y, x + 1, y + 1, '_');
    this.rooms.push({ x0: x - rx, y0: y - ry, x1: x + 1 + rx, y1: y + 1 + ry });
    return this;
  }

  /** 동쪽(+x, 화면 오른쪽 아래)으로 n칸. m = 통로 양옆 바닥의 폭 */
  E(n, m = 1) {
    const { x, y } = this;
    this.rect(x, y - m, x + n + 1, y + 1 + m, '.');
    this.rect(x, y, x + n + 1, y + 1, '_');
    this.x += n;
    return this;
  }

  /** 북쪽(-y, 화면 오른쪽 위)으로 n칸 */
  N(n, m = 1) {
    const { x, y } = this;
    this.rect(x - m, y - n, x + 1 + m, y + 1, '.');
    this.rect(x, y - n, x + 1, y + 1, '_');
    this.y -= n;
    return this;
  }

  /** 지금 자리에서 (dx, dy) 떨어진 칸에 표식 */
  mark(ch, dx = 0, dy = 0) {
    this.put(this.x + dx, this.y + dy, ch);
    return this;
  }

  /**
   * 곁방: 지금 자리에서 (dx, dy) 떨어진 곳에 작은 방을 파고 폭 2칸 바닥으로 잇는다 (통로 표시는 없다).
   * ch 를 주면 그 방 가운데에 표식을 놓는다
   */
  pocket(dx, dy, rx, ry, ch) {
    const cx = this.x + dx;
    const cy = this.y + dy;
    this.rect(this.x, this.y, cx + 1, this.y + 1, '.');
    this.rect(cx, this.y, cx + 1, cy + 1, '.');
    this.rect(cx - rx, cy - ry, cx + 1 + rx, cy + 1 + ry, '.');
    if (ch) this.put(cx, cy, ch);
    this.rooms.push({ x0: cx - rx, y0: cy - ry, x1: cx + 1 + rx, y1: cy + 1 + ry });
    return this;
  }

  /** 방 모서리를 조금씩 메워 네모반듯해 보이지 않게 한다 (통로와 표식 주변은 건드리지 않는다) */
  notch(chance = 0.6) {
    const near = (x, y) => {
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (rank(this.get(x + i, y + j)) >= 3 && this.get(x + i, y + j) !== '#') return true;
      return false;
    };
    for (const r of this.rooms) {
      for (const [cx, cy, sx, sy] of [
        [r.x0, r.y0, 1, 1],
        [r.x1, r.y0, -1, 1],
        [r.x0, r.y1, 1, -1],
        [r.x1, r.y1, -1, -1],
      ]) {
        if (this.rand() > chance) continue;
        const bw = 1 + Math.floor(this.rand() * 2);
        const bh = 1 + Math.floor(this.rand() * 2);
        for (let j = 0; j < bh; j++) {
          for (let i = 0; i < bw - j; i++) {
            const x = cx + sx * i;
            const y = cy + sy * j;
            if (this.get(x, y) === '.' && !near(x, y)) this.cells.delete(`${x},${y}`);
          }
        }
      }
    }
    return this;
  }

  grid() {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const k of this.cells.keys()) {
      const [x, y] = k.split(',').map(Number);
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    const W = x1 - x0 + 1 + PAD * 2;
    const H = y1 - y0 + 1 + PAD * 2;
    const g = Array.from({ length: H }, () => Array(W).fill('#'));
    for (const [k, ch] of this.cells) {
      const [x, y] = k.split(',').map(Number);
      g[y - y0 + PAD][x - x0 + PAD] = ch;
    }
    return { g, W, H };
  }
}

function validate(name, g, W, H) {
  let sx = -1;
  let sy = -1;
  const targets = [];
  let floor = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = g[y][x];
      if (c !== '#') floor++;
      if (c === 'S') {
        if (sx >= 0) throw new Error(`${name}: 시작 지점(S)이 둘 이상입니다`);
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
  for (const [x, y, c] of targets) if (!seen[y * W + x]) throw new Error(`${name}: (${x},${y})의 ${c} 표식에 걸어서 갈 수 없습니다`);
  const count = (ch) => targets.filter((t) => t[2] === ch).length;
  console.log(`${name.padEnd(12)} ${W}x${H}  바닥 ${floor}칸  무리 후보 ${count('M')}  수색 후보 ${count('L')}  NPC 후보 ${count('N')}  출구 ${count('E')}  수호/보스 ${count('G')}`);
}

function write(name, title, b) {
  const { g, W, H } = b.grid();
  validate(name, g, W, H);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${name}.txt`), [`; ${title}`, ...LEGEND, g.map((row) => row.join('')).join('\n'), ''].join('\n'), 'utf8');
}

// ---- 맵 ---------------------------------------------------------------------
// 표식의 (dx, dy)는 지금 자리(통로 2칸의 왼쪽 위)에서 잰다. +dx = 동(↘), +dy = 남(↙).

const MAPS = {
  /** 섹터 1 · 짓밟힌 꽃길: 넓은 꽃밭 길이 지그재그로 길게 이어진다 */
  s3_field() {
    const b = new Brush(3101);
    b.room(4, 3).mark('S', -2, 0).mark('L', -3, 3);
    b.E(11, 2).room(4, 4).mark('M', 2, -2).pocket(0, 8, 2, 1, 'L');
    b.N(9, 2).room(3, 3).mark('M', -2, -1).mark('X', 3, 3);
    b.E(12, 2).room(4, 4).mark('M', 1, -3).mark('N', -3, 2).pocket(-6, -7, 2, 2, 'L');
    b.N(10, 2).room(4, 3).mark('M', 3, -1).mark('L', -3, -2);
    b.E(11, 2).room(3, 3).mark('M', 2, 2).mark('X', -2, -2);
    b.N(9, 2).room(4, 4).mark('M', -2, -3).mark('L', 4, 3).pocket(8, 0, 1, 2, 'L');
    b.E(12, 2).room(4, 4).mark('M', 3, -2).mark('N', -2, 3).mark('L', 4, 4);
    b.N(10, 2).room(3, 3).mark('M', -2, 1).mark('L', 3, -3);
    b.E(11, 2).room(4, 4).mark('M', 2, -3).mark('L', -4, 4).pocket(0, -8, 2, 1, 'L');
    b.N(9, 2).room(3, 4).mark('M', 2, 0).mark('X', -2, 3);
    b.E(11, 2).room(5, 4).mark('G', 0, 0).mark('L', -4, -4).mark('L', 4, 4);
    b.E(8, 2).mark('E', 1, 0);
    b.notch(0.7);
    write('s3_field', '시즌 2 (마름모) · 섹터 1 · 짓밟힌 꽃길 (긴 맵)', b);
  },

  /** 섹터 2 · 안개 낀 세트장 숲: 좁은 숲길과 작은 빈터가 번갈아 나온다 */
  s3_forest() {
    const b = new Brush(3202);
    b.room(3, 3).mark('S', 0, 2).mark('L', -3, -3);
    b.N(8).room(3, 3).mark('M', -1, -2).pocket(-7, 0, 1, 2, 'L');
    b.E(10).room(4, 3).mark('M', 2, -2).mark('L', -3, 3).mark('X', 3, 3);
    b.N(9).room(3, 4).mark('M', -2, -2).mark('N', 2, 3);
    b.E(11).room(4, 4).mark('M', 3, 1).mark('L', -4, -4).pocket(0, 8, 2, 1, 'L');
    b.N(9).room(3, 3).mark('M', 2, -2).mark('X', -3, 2);
    b.E(10).room(3, 4).mark('M', -1, -3).mark('L', 3, 4).pocket(7, -1, 1, 2, 'L');
    b.N(10).room(4, 3).mark('M', 3, -2).mark('L', -4, 2);
    b.E(11).room(4, 4).mark('M', -2, 3).mark('N', 3, -3).pocket(-1, -8, 2, 1, 'L');
    b.N(8).room(3, 3).mark('M', -2, -1).mark('L', 3, 3);
    b.E(10).room(3, 3).mark('M', 2, 2).mark('X', -2, -2);
    b.N(9).room(4, 4).mark('M', -3, 0).mark('L', 4, -4).pocket(0, 8, 1, 1, 'L');
    b.E(10).room(4, 4).mark('G', 0, 0).mark('L', -4, 4);
    b.E(7).mark('E', 1, 0);
    b.notch(0.9);
    write('s3_forest', '시즌 2 (마름모) · 섹터 2 · 안개 낀 세트장 숲 (긴 맵)', b);
  },

  /** 섹터 3 · 무너진 객석 */
  s3_stage1() {
    const b = new Brush(3303);
    b.room(3, 3).mark('S', -1, 0);
    b.E(9).room(4, 3).mark('M', 2, -1).mark('L', -4, -3).mark('X', 3, 3);
    b.N(8).room(3, 3).mark('M', -1, -2).mark('N', 3, 2).pocket(-7, 0, 1, 1, 'L');
    b.E(10).room(4, 4).mark('M', 3, -3).mark('L', -4, 4).mark('X', -3, -3).mark('X', 4, 4);
    b.N(8).room(3, 3).mark('M', 2, 1).mark('L', -3, -3).pocket(0, 7, 1, 1, 'L');
    b.E(9).room(3, 4).mark('M', -2, -3).mark('L', 3, 4);
    b.N(7).room(4, 3).mark('M', 0, -2).mark('L', 4, 2);
    b.E(9).room(4, 4).mark('G', 0, 0).mark('L', -4, -4).mark('X', 3, -3).mark('X', -3, 4);
    b.E(7).mark('E', 1, 0);
    b.notch(0.5);
    write('s3_stage1', '시즌 2 (마름모) · 섹터 3 · 무너진 객석', b);
  },

  /** 섹터 4 · 무대 뒤편: 북쪽으로 먼저 오르고, 넓은 창고 방들을 지난다 */
  s3_stage2() {
    const b = new Brush(3404);
    b.room(3, 3).mark('S', 0, 1);
    b.N(8).room(4, 3).mark('M', -2, -2).mark('L', 4, 2).mark('X', 3, -2);
    b.E(10).room(3, 3).mark('M', 2, 2).mark('L', -3, -3).pocket(0, 7, 2, 1, 'L');
    b.N(8).room(4, 4).mark('M', 3, -3).mark('N', -3, 3).mark('X', -3, -3).mark('X', 4, 4);
    b.E(10).room(4, 3).mark('M', -2, -2).mark('L', 4, 3).pocket(1, -7, 1, 1, 'L');
    b.N(7).room(3, 3).mark('M', 2, -1).mark('L', -3, 2);
    b.E(9).room(3, 4).mark('M', 0, 3).mark('L', 3, -4).mark('X', -2, -3);
    b.N(8).room(4, 4).mark('G', 0, 0).mark('L', -4, 4).mark('X', 4, -3);
    b.N(7).mark('E', 0, -1);
    b.notch(0.5);
    write('s3_stage2', '시즌 2 (마름모) · 섹터 4 · 무대 뒤편', b);
  },

  /** 섹터 5 · 분장실 복도: 긴 복도 뒤쪽으로 분장실이 줄지어 있다 */
  s3_stage3() {
    const b = new Brush(3505);
    b.room(3, 2).mark('S', -1, 0);
    b.E(8).room(3, 3).mark('M', 2, 2).pocket(0, -7, 2, 1, 'L');
    b.E(9).room(3, 3).mark('M', -2, 2).mark('N', 3, 3).pocket(0, -7, 2, 1, 'L');
    b.N(8).room(4, 3).mark('M', 3, -2).mark('L', -4, -3).mark('X', -3, 2);
    b.E(9).room(3, 3).mark('M', 1, 3).pocket(0, -7, 2, 1, 'L').mark('X', 3, -2);
    b.E(9).room(3, 3).mark('M', -1, 2).mark('L', 3, 3).pocket(0, -7, 2, 1, 'L');
    b.N(8).room(4, 4).mark('M', -3, -3).mark('L', 4, 4).mark('X', 3, -3).mark('X', -3, 3);
    b.E(9).room(3, 3).mark('M', 2, -2).mark('L', -3, 3);
    b.N(7).room(4, 4).mark('G', 0, 0).mark('L', 4, -4).mark('X', -3, -3);
    b.E(7).mark('E', 1, 0);
    b.notch(0.4);
    write('s3_stage3', '시즌 2 (마름모) · 섹터 5 · 분장실 복도', b);
  },

  /** 보너스 · 의상 보관실: 몬스터 없이 수색만 한다 */
  s3_bonus() {
    const b = new Brush(3901);
    b.room(3, 3).mark('S', -1, 0).mark('L', 2, -3);
    b.E(8).room(4, 3).mark('L', -3, -3).mark('L', 3, 3).mark('X', 3, -2).pocket(0, 7, 1, 1, 'L');
    b.N(7).room(3, 4).mark('L', -3, -3).mark('L', 3, 0).mark('X', -2, 3);
    b.E(8).room(3, 3).mark('L', 2, -3).mark('L', -3, 3);
    b.E(6).mark('E', 1, 0);
    b.notch(0.5);
    write('s3_bonus', '시즌 2 (마름모) · 보너스 · 의상 보관실', b);
  },

  /**
   * 섹터 6 · 막이 오른 무대 (보스 전투장): 네모난 무대.
   * 마름모 화면에서는 맵의 왼쪽 위 모서리가 화면 위(무대 안쪽), 오른쪽 아래 모서리가 화면 아래(객석 쪽)다.
   * 보스는 무대 안쪽에, 시작 지점은 객석 쪽에 둔다
   */
  s3_boss() {
    const n = 24;
    const b = new Brush(3601);
    b.rect(0, 0, n - 1, n - 1, '_');
    // 모서리는 네모나게만 덜어 낸다. 비스듬히 깎으면 마름모 화면에서 가장자리가 톱니처럼 보인다.
    // 화면 왼쪽·오른쪽 끝(맵의 왼쪽 아래·오른쪽 위 모서리)을 덜어 무대가 옆으로 너무 뾰족해지지 않게 한다
    const cut = 5;
    for (let j = 0; j < cut; j++) {
      for (let i = 0; i < cut; i++) {
        b.cells.delete(`${i},${n - 1 - j}`);
        b.cells.delete(`${n - 1 - i},${j}`);
      }
    }
    for (const [x, y] of [
      [5, 14],
      [14, 5],
      [10, 19],
      [19, 10],
    ]) {
      // 통로 칸 위에도 놓이도록 직접 적는다 (put 은 통로를 장애물로 덮어쓰지 않는다)
      b.cells.set(`${x},${y}`, 'X');
    }
    b.put(8, 8, 'G');
    b.put(17, 17, 'S');
    write('s3_boss', '시즌 2 (마름모) · 섹터 6 · 막이 오른 무대 (보스 전투장)', b);
  },
};

const only = process.argv.slice(2);
for (const [name, make] of Object.entries(MAPS)) if (!only.length || only.includes(name)) make();
