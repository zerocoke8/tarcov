// 섹터 한 판의 구성을 정한다: 고정 맵 + 무작위 배치 + 몬스터 무리 구성 + 깊이에 따른 보정
import type { Rng } from '../../core/rng';
import { db } from '../../data/tables';
import type { MonsterDef, PackMember, SectorDef } from '../../data/types';
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
  quality: number;
  members: SpawnMember[];
}

export interface SectorSetup {
  def: SectorDef;
  plan: SectorPlan;
  spawns: PackSpawn[];
  /** 섹터 깊이에 따른 몬스터 체력·공격력 배율 */
  hpMult: number;
  atkMult: number;
  shardMult: number;
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

function expand(list: PackMember[], grade: number): SpawnMember[] {
  const out: SpawnMember[] = [];
  for (const m of list) {
    const def = db.monster(m.id);
    for (let i = 0; i < m.count; i++) out.push({ def, grade });
  }
  return out;
}

export function buildSector(_run: RunState, def: SectorDef, rng: Rng): SectorSetup {
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

  const depth = def.index - 1;
  const templates = db.packs.filter((p) => def.index >= p.minSector && def.index <= p.maxSector);
  const spawns: PackSpawn[] = [];
  for (const spot of plan.packs) {
    if (spot.gate) {
      if (!def.gate.length) continue;
      spawns.push({ x: spot.x, y: spot.y, gate: true, quality: 1, members: expand(def.gate, 0) });
    } else {
      const t = rng.weighted(templates, (p) => p.weight);
      if (!t) continue;
      spawns.push({ x: spot.x, y: spot.y, gate: false, quality: 1, members: expand(t.members, 0) });
    }
  }

  return {
    def,
    plan,
    spawns,
    hpMult: 1 + depth * db.pct('scaling.hpPerSector'),
    atkMult: 1 + depth * db.pct('scaling.atkPerSector'),
    shardMult: 1,
  };
}
