// 입장할 때마다 달라지는 것(엄폐 오브젝트, 무리 위치, 수색 오브젝트, NPC)을 규칙에 따라 뽑는다.
// 지형 자체는 고정 맵에서 온다.
//
// 규칙
//  1. 통로와 표식 주변(keep)에는 엄폐 오브젝트를 놓지 않는다.
//  2. 오브젝트 덩어리 사이는 최소 1칸을 띄운다.
//  3. 맵별 밀도 값만큼만 놓는다.
//  4. 배치 후 시작 지점에서 모든 목적지까지 걸어갈 수 있는지 검사하고, 길을 막는 오브젝트는 제거한다.
//  5. 무리·수색 오브젝트·NPC는 맵에 표시된 후보 위치 중 일부를 뽑는다.
import type { Rng } from '../../core/rng';
import { tileCenter, type MapLayout, type Pt } from './layout';

export type PropKind = 'crate' | 'crates' | 'container' | 'car' | 'vending' | 'planter' | 'barrel' | 'pillar';

export interface Prop {
  /** 왼쪽 위 칸과 크기(칸) */
  tx: number;
  ty: number;
  tw: number;
  th: number;
  kind: PropKind;
  /** 같은 종류 안에서 색·모양을 바꾸는 값 */
  variant: number;
}

export interface PackSpot extends Pt {
  gate: boolean;
}

export interface SectorPlan {
  layout: MapLayout;
  w: number;
  h: number;
  /** 1 = 이동과 투사체가 막히는 칸 (벽 + 오브젝트) */
  solid: Uint8Array;
  props: Prop[];
  /** 아래는 모두 월드 좌표(px) */
  start: Pt;
  exit: Pt | null;
  packs: PackSpot[];
  loot: Pt[];
  npc: Pt | null;
  waves: Pt[];
}

export interface PlacementCfg {
  /** 바닥 칸 대비 엄폐 오브젝트 비율 (0~1) */
  density: number;
  /** 출구 수호 무리를 뺀 무리 수 */
  packs: number;
  loot: number;
  npcChance: number;
  /** 무리가 시작 지점에서 떨어져야 하는 최소 칸 수 (걸어가는 거리 기준) */
  packMinFromStart: number;
  /** 무리끼리 떨어져야 하는 최소 칸 수 */
  packMinApart: number;
}

interface Shape {
  kind: PropKind;
  tw: number;
  th: number;
  weight: number;
}

const SHAPES: Shape[] = [
  { kind: 'crate', tw: 1, th: 1, weight: 30 },
  { kind: 'barrel', tw: 1, th: 1, weight: 12 },
  { kind: 'vending', tw: 1, th: 1, weight: 8 },
  { kind: 'crates', tw: 2, th: 1, weight: 16 },
  { kind: 'crates', tw: 1, th: 2, weight: 10 },
  { kind: 'planter', tw: 2, th: 1, weight: 10 },
  { kind: 'container', tw: 2, th: 2, weight: 6 },
  { kind: 'car', tw: 3, th: 2, weight: 5 },
];

/** 시작 칸에서 각 칸까지 걸어가는 거리(칸 수). 갈 수 없으면 -1 */
export function walkDistances(solid: Uint8Array, w: number, h: number, from: Pt): Int32Array {
  const d = new Int32Array(w * h).fill(-1);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const s = from.y * w + from.x;
  d[s] = 0;
  queue[tail++] = s;
  while (head < tail) {
    const i = queue[head++];
    const x = i % w;
    const y = (i - x) / w;
    const nd = d[i] + 1;
    if (x > 0 && !solid[i - 1] && d[i - 1] < 0) {
      d[i - 1] = nd;
      queue[tail++] = i - 1;
    }
    if (x < w - 1 && !solid[i + 1] && d[i + 1] < 0) {
      d[i + 1] = nd;
      queue[tail++] = i + 1;
    }
    if (y > 0 && !solid[i - w] && d[i - w] < 0) {
      d[i - w] = nd;
      queue[tail++] = i - w;
    }
    if (y < h - 1 && !solid[i + w] && d[i + w] < 0) {
      d[i + w] = nd;
      queue[tail++] = i + w;
    }
  }
  return d;
}

export function buildPlan(layout: MapLayout, cfg: PlacementCfg, rng: Rng): SectorPlan {
  const { w, h, base, keep } = layout;
  const solid = new Uint8Array(w * h);
  const props: Prop[] = [];
  /** 오브젝트가 차지한 칸 */
  const occupied = new Uint8Array(w * h);

  for (let i = 0; i < w * h; i++) {
    if (base[i] === 1) solid[i] = 1;
    else if (base[i] === 2) {
      solid[i] = 1;
      occupied[i] = 1;
      props.push({ tx: i % w, ty: Math.floor(i / w), tw: 1, th: 1, kind: 'pillar', variant: 0 });
    }
  }

  // --- 엄폐 오브젝트 ---
  let free = 0;
  for (let i = 0; i < w * h; i++) if (base[i] === 0 && !keep[i]) free++;
  const target = Math.round(free * cfg.density);
  let covered = 0;

  const canPlace = (tx: number, ty: number, tw: number, th: number): boolean => {
    if (tx < 1 || ty < 1 || tx + tw > w - 1 || ty + th > h - 1) return false;
    for (let y = ty; y < ty + th; y++) {
      for (let x = tx; x < tx + tw; x++) {
        const i = y * w + x;
        if (base[i] !== 0 || keep[i] || occupied[i]) return false;
      }
    }
    // 다른 오브젝트와 최소 1칸 간격
    for (let y = ty - 1; y <= ty + th; y++) {
      for (let x = tx - 1; x <= tx + tw; x++) {
        if (occupied[y * w + x]) return false;
      }
    }
    return true;
  };

  const random: Prop[] = [];
  for (let tries = 0; tries < target * 40 && covered < target; tries++) {
    const shape = rng.weighted(SHAPES, (s) => s.weight)!;
    const tx = rng.int(1, w - 1 - shape.tw);
    const ty = rng.int(1, h - 1 - shape.th);
    if (!canPlace(tx, ty, shape.tw, shape.th)) continue;
    const prop: Prop = { tx, ty, tw: shape.tw, th: shape.th, kind: shape.kind, variant: rng.int(0, 3) };
    random.push(prop);
    for (let y = ty; y < ty + shape.th; y++) {
      for (let x = tx; x < tx + shape.tw; x++) {
        occupied[y * w + x] = 1;
        solid[y * w + x] = 1;
      }
    }
    covered += shape.tw * shape.th;
  }

  // --- 무리·수색 오브젝트·NPC 후보 뽑기 ---
  const fromStart = walkDistances(solid, w, h, layout.start);
  const packsT: (Pt & { gate: boolean })[] = [];
  if (layout.gate) packsT.push({ ...layout.gate, gate: true });
  const farEnough = (p: Pt, minApart: number): boolean =>
    packsT.every((q) => Math.hypot(q.x - p.x, q.y - p.y) >= minApart);
  const candidates = rng.shuffle([...layout.packSlots]);
  // 조건을 차례로 풀어 가며 필요한 수를 채운다
  const passes: [number, number][] = [
    [cfg.packMinFromStart, cfg.packMinApart],
    [cfg.packMinFromStart / 2, cfg.packMinApart],
    [0, cfg.packMinApart / 2],
    [0, 0],
  ];
  let picked = 0;
  for (const [minStart, minApart] of passes) {
    for (const c of candidates) {
      if (picked >= cfg.packs) break;
      if (packsT.some((q) => q.x === c.x && q.y === c.y)) continue;
      const d = fromStart[c.y * w + c.x];
      if (d >= 0 && d < minStart) continue;
      if (!farEnough(c, minApart)) continue;
      packsT.push({ ...c, gate: false });
      picked++;
    }
  }

  const lootT = rng.shuffle([...layout.lootSlots]).slice(0, cfg.loot);
  const npcT = layout.npcSlots.length && rng.chance(cfg.npcChance) ? rng.pick(layout.npcSlots) : null;

  // --- 도달 검증: 길을 막는 오브젝트는 뒤에서부터 제거 ---
  const goals: Pt[] = [...packsT, ...lootT, ...layout.waveSlots];
  if (layout.exit) goals.push(layout.exit);
  if (npcT) goals.push(npcT);
  const allReachable = (): boolean => {
    const d = walkDistances(solid, w, h, layout.start);
    return goals.every((g) => d[g.y * w + g.x] >= 0);
  };
  while (random.length && !allReachable()) {
    const p = random.pop()!;
    for (let y = p.ty; y < p.ty + p.th; y++) {
      for (let x = p.tx; x < p.tx + p.tw; x++) solid[y * w + x] = 0;
    }
  }
  props.push(...random);

  return {
    layout,
    w,
    h,
    solid,
    props,
    start: tileCenter(layout.start),
    exit: layout.exit ? tileCenter(layout.exit) : null,
    packs: packsT.map((p) => ({ ...tileCenter(p), gate: p.gate })),
    loot: lootT.map(tileCenter),
    npc: npcT ? tileCenter(npcT) : null,
    waves: layout.waveSlots.map(tileCenter),
  };
}
