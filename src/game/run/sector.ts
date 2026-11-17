// 섹터 한 판의 구성을 정한다: 고정 맵 + 무작위 배치 + 몬스터 무리 구성 + 경로·깊이에 따른 보정
import type { Rng } from '../../core/rng';
import { db } from '../../data/tables';
import type { MonsterDef, PackMember, RouteDef, SectorDef } from '../../data/types';
import type { ThingKind } from '../entities';
import { parseLayout, type MapLayout } from '../world/layout';
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

/** 지금 들어갈 섹터의 정의 (보너스 맵을 먼저 들르는 경우 포함) */
export function currentSectorDef(run: RunState): SectorDef {
  if (run.bonus && db.bonusSector) return db.bonusSector;
  return db.sector(run.sector);
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
  const depth = Math.max(0, sectorNo - 1);
  const templates = db.packs.filter((p) => sectorNo >= p.minSector && sectorNo <= p.maxSector);
  const mediums = ['brute', 'seer'].filter((id) => db.monsters.has(id));

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

  return {
    def,
    route,
    plan,
    spawns,
    loot,
    npc: plan.npc,
    hpMult: (1 + depth * db.pct('scaling.hpPerSector')) * route.statMult,
    atkMult: (1 + depth * db.pct('scaling.atkPerSector')) * route.statMult,
    shardMult: route.shardMult,
    mode: 'sector',
    timeLimit: 0,
    bossHpMult: 1,
    bossAtkMult: 1,
  };
}
