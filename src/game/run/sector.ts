// 섹터 한 판의 구성을 정한다: 고정 맵 + 무작위 배치 + 몬스터 무리 구성 + 경로·깊이에 따른 보정
import type { Rng } from '../../core/rng';
import { db } from '../../data/tables';
import type { MonsterDef, PackMember, RouteDef, SectorDef, SurpriseDef } from '../../data/types';
import type { ThingKind } from '../entities';
import { parseLayout, tileCenter, type MapLayout, type Pt } from '../world/layout';
import { buildPlan, type SectorPlan } from '../world/placement';
import type { RunState } from './RunState';

export interface SpawnMember {
  def: MonsterDef;
  /** 0 일반, 1 정예, 2 특급 */
  grade: number;
}

export interface PackSpawn {
  x: number;
  y: number;
  gate: boolean;
  /** 처치 시 보상 상자의 품질 (1~3) */
  quality: number;
  members: SpawnMember[];
}

export interface LootSpawn {
  x: number;
  y: number;
  kind: ThingKind;
}

export interface SectorSetup {
  def: SectorDef;
  route: RouteDef;
  plan: SectorPlan;
  spawns: PackSpawn[];
  loot: LootSpawn[];
  npc: { x: number; y: number } | null;
  /** 섹터 깊이와 경로에 따른 몬스터 체력·공격력 배율 */
  hpMult: number;
  atkMult: number;
  shardMult: number;
  /** sector = 시즌 런의 섹터, raid = 특급 괴이 토벌, wave = 괴이 범람 */
  mode: 'sector' | 'raid' | 'wave';
  /** 제한 시간(초). 0이면 없음 */
  timeLimit: number;
  /** 보스(대형)에게만 적용되는 체력·공격력 배율 */
  bossHpMult: number;
  bossAtkMult: number;
  /** 클리어 보상의 품질 (1~3). 보통은 경로의 것이지만, 가려진 선택지와 돌발 사건이 바꿀 수 있다 */
  rewardQuality: number;
  /** 포자 버섯이 놓이는 자리 (안개 낀 맵) */
  mushrooms: Pt[];
  /** 이 섹터에 일어나는 돌발 사건과, 그 사건이 무언가를 놓는 자리 */
  surprise: SurpriseDef | null;
  surpriseSpot: Pt | null;
}

const layouts = new Map<string, MapLayout>();

export function getLayout(name: string): MapLayout {
  let l = layouts.get(name);
  if (!l) {
    l = parseLayout(name, db.mapText(name));
    layouts.set(name, l);
  }
  return l;
}

function expand(list: PackMember[]): SpawnMember[] {
  const out: SpawnMember[] = [];
  for (const m of list) {
    const def = db.monster(m.id);
    for (let i = 0; i < m.count; i++) out.push({ def, grade: m.grade });
  }
  return out;
}

/** 무리의 보상 품질: 가장 높은 등급의 구성원을 따른다 */
function packQuality(members: SpawnMember[]): number {
  let q = 1;
  for (const m of members) q = Math.max(q, db.grade(m.grade).quality);
  return q;
}

/** 지금 시즌에 나올 수 있는 몬스터의 id (무리, 출구 수호 무리, 특급 중형, 그리고 그들이 부르는 몬스터). 그림을 미리 받아 두는 데 쓴다 */
export function seasonMonsterIds(): string[] {
  const ids = new Set<string>(db.seasonDef.mediums);
  for (const p of db.packs) for (const m of p.members) ids.add(m.id);
  for (const s of db.sectors) for (const m of s.gate) ids.add(m.id);
  for (const id of [...ids]) for (const m of db.monster(id).summon) ids.add(m.id);
  return [...ids];
}

/** 지금 들어갈 섹터의 정의 (보너스 맵을 먼저 들르는 경우 포함) */
export function currentSectorDef(run: RunState): SectorDef {
  if (run.bonus && db.bonusSector) return db.bonusSector;
  return db.sector(run.sector);
}

/**
 * 포자 버섯을 놓을 자리. 길 위와 시작 지점·출구·무리·수색 오브젝트 가까이는 피하고, 버섯끼리도 띄운다.
 * (길을 벗어나 풀숲으로 들어갈 때 조심해야 하는 것이 되도록)
 */
function placeMushrooms(plan: SectorPlan, rng: Rng): Pt[] {
  const { w, h, solid, layout } = plan;
  const TILE = tileCenter({ x: 1, y: 0 }).x - tileCenter({ x: 0, y: 0 }).x;
  const cells: number[] = [];
  for (let i = 0; i < w * h; i++) if (!solid[i] && !layout.road[i]) cells.push(i);
  const count = Math.round(cells.length * db.P('mushroom.count'));
  const apart = db.P('mushroom.apart') * TILE;
  const avoid: Pt[] = [plan.start, ...(plan.exit ? [plan.exit] : []), ...plan.packs, ...plan.loot, ...(plan.npc ? [plan.npc] : [])];
  const out: Pt[] = [];
  for (const i of rng.shuffle(cells)) {
    if (out.length >= count) break;
    const c = tileCenter({ x: i % w, y: Math.floor(i / w) });
    if (avoid.some((a) => Math.hypot(a.x - c.x, a.y - c.y) < TILE * 3)) continue;
    if (out.some((o) => Math.hypot(o.x - c.x, o.y - c.y) < apart)) continue;
    out.push(c);
  }
  return out;
}

export function buildSector(run: RunState, def: SectorDef, rng: Rng): SectorSetup {
  // 경로 보정은 일반 섹터에만 적용한다
  const route = def.type === 'normal' ? db.route(run.route) : db.route('normal');
  const plan = buildPlan(
    getLayout(def.map),
    {
      density: def.density,
      packs: def.packs,
      loot: def.loot,
      npcChance: def.npcChance,
      packMinFromStart: db.P('placement.packMinFromStart'),
      packMinApart: db.P('placement.packMinApart'),
    },
    rng,
  );

  const sectorNo = def.type === 'bonus' ? run.sector : def.index;
  // 강화 단계: 보너스 맵은 지금 가려던 본편 섹터의 것을 따른다
  const depth = def.type === 'bonus' ? db.sector(run.sector).depth : def.depth;
  const templates = db.packs.filter((p) => sectorNo >= p.minSector && sectorNo <= p.maxSector);
  const mediums = db.seasonDef.mediums;

  const spawns: PackSpawn[] = [];
  for (const spot of plan.packs) {
    if (spot.gate) {
      if (!def.gate.length) continue;
      const members = expand(def.gate);
      // 위험한 경로에서는 출구 수호 무리에도 정예가 낀다
      if (route.grade >= 2 && def.type === 'normal') {
        const target = members.find((m) => m.def.size !== 'L' && m.grade < 2);
        if (target) target.grade++;
      }
      spawns.push({ x: spot.x, y: spot.y, gate: true, quality: Math.max(route.quality, packQuality(members)), members });
      continue;
    }
    const t = rng.weighted(templates, (p) => p.weight);
    if (!t) continue;
    const members = expand(t.members);
    for (let i = 0; i < route.packBonus; i++) members.push({ def: members[0].def, grade: 0 });
    if (rng.chance(route.eliteChance)) rng.pick(members).grade = 1;
    spawns.push({ x: spot.x, y: spot.y, gate: false, quality: packQuality(members), members });
  }
  // 특급 경로: 일부 무리에 특급 등급의 중형 몬스터가 낀다
  if (route.special > 0 && mediums.length) {
    const normalPacks = rng.shuffle(spawns.filter((s) => !s.gate));
    for (const s of normalPacks.slice(0, route.special)) {
      s.members.push({ def: db.monster(rng.pick(mediums)), grade: 2 });
      s.quality = 3;
    }
  }

  // 수색 오브젝트 종류 (봉인 상자는 섹터당 1개까지, 보너스 맵에는 없음)
  let sealed = 0;
  const loot: LootSpawn[] = plan.loot.map((p) => {
    const pool = db.objectList.filter((o) => o.id !== 'sealed' || (sealed === 0 && def.type === 'normal' && templates.length));
    const kind = (rng.weighted(pool, (o) => o.weight) ?? pool[0]).id as ThingKind;
    if (kind === 'sealed') sealed++;
    return { x: p.x, y: p.y, kind };
  });

  // 돌발 사건 (기획서 7.7절): 일반 섹터에 가끔 하나가 일어난다
  let surprise: SurpriseDef | null = def.type === 'normal' && rng.chance(db.pct('event.chance')) ? (rng.weighted(db.surprises, (s) => s.weight) ?? null) : null;
  let surpriseSpot: Pt | null = null;
  let shardMult = route.shardMult;
  let rewardQuality = def.type === 'normal' && run.routeReward > 0 ? run.routeReward : route.quality;
  if (surprise?.id === 'cache' || surprise?.id === 'merchant') {
    // 맵에 표시된 후보 자리 가운데 이번에 쓰이지 않은 곳에 놓는다. 남은 자리가 없으면 사건은 일어나지 않는다
    const used = [...plan.loot, ...(plan.npc ? [plan.npc] : [])];
    const spare = [...plan.layout.lootSlots, ...plan.layout.npcSlots].map(tileCenter).filter((c) => !used.some((u) => u.x === c.x && u.y === c.y));
    if (spare.length) surpriseSpot = rng.pick(spare);
    else surprise = null;
  } else if (surprise?.id === 'horde') {
    for (const s of spawns) {
      if (s.gate) continue;
      for (let i = 0; i < surprise.v1; i++) s.members.push({ def: s.members[0].def, grade: 0 });
    }
    shardMult *= 1 + surprise.v2 / 100;
  } else if (surprise?.id === 'fortune') rewardQuality = Math.min(3, rewardQuality + surprise.v1);

  return {
    def,
    route,
    plan,
    spawns,
    loot,
    rewardQuality,
    mushrooms: def.fog > 0 ? placeMushrooms(plan, rng) : [],
    surprise,
    surpriseSpot,
    npc: plan.npc,
    hpMult: (1 + depth * db.pct('scaling.hpPerSector')) * route.statMult,
    atkMult: (1 + depth * db.pct('scaling.atkPerSector')) * route.statMult,
    shardMult,
    mode: 'sector',
    timeLimit: 0,
    bossHpMult: 1,
    bossAtkMult: 1,
  };
}
