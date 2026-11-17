// 섹터 사이의 진행 규칙: 클리어 처리, 경로 선택, 캠프, 팀 회복 (기획서 7.1, 7.7, 7.8절)
import type { Rng } from '../../core/rng';
import { db } from '../../data/tables';
import type { RouteDef, SectorDef } from '../../data/types';
import type { RunState } from './RunState';
import { computeStats } from './stats';

export interface RouteOption {
  /** 보너스 맵이면 'bonus', 아니면 routes.csv의 id */
  id: string;
  bonus: boolean;
  name: string;
  desc: string;
  /** 위험 등급 (보너스 맵은 0) */
  grade: number;
  route: RouteDef | null;
}

export type NextStep =
  /** 런 종료: 보스를 격파했다 */
  | { kind: 'end' }
  /** 경로를 고른 뒤 다음 섹터로 */
  | { kind: 'route'; options: RouteOption[] }
  /** 선택 없이 다음 섹터로 (보스 직전, 보너스 맵을 나온 뒤) */
  | { kind: 'next' };

export interface ClearResult {
  /** 다음으로 넘어가기 전에 캠프에 들르는지 */
  camp: boolean;
  step: NextStep;
}

/** 섹터를 클리어했을 때 런 상태를 갱신하고, 다음에 할 일을 알려 준다 */
export function onSectorClear(run: RunState, def: SectorDef, rng: Rng): ClearResult {
  if (def.type === 'bonus') {
    // 보너스 맵을 나오면 원래의 다음 섹터로 이어진다
    run.bonus = false;
    return { camp: false, step: { kind: 'next' } };
  }
  run.cleared++;
  run.routeScore += db.route(run.route).score;
  if (def.type === 'boss' || def.index >= db.lastSector) return { camp: false, step: { kind: 'end' } };

  const next = db.sector(def.index + 1);
  run.sector = next.index;
  run.route = 'normal';
  run.bonus = false;
  if (next.type === 'boss') return { camp: def.camp, step: { kind: 'next' } };
  return { camp: def.camp, step: { kind: 'route', options: rollRouteOptions(def, rng) } };
}

/** 다음 섹터로 가는 경로 선택지 (기획서 7.7절) */
export function rollRouteOptions(cleared: SectorDef, rng: Rng): RouteOption[] {
  const out: RouteOption[] = [];
  for (const r of [...db.routeList].sort((a, b) => a.grade - b.grade)) {
    if (r.special > 0 && cleared.index < db.P('route.specialFrom')) continue;
    out.push({ id: r.id, bonus: false, name: r.name, desc: r.desc, grade: r.grade, route: r });
  }
  const bonus = db.bonusSector;
  if (bonus && rng.chance(db.pct('route.bonusChance'))) {
    out.push({
      id: 'bonus',
      bonus: true,
      name: `보너스 · ${bonus.name}`,
      desc: '몬스터가 없는 보급소. 수색 오브젝트가 많다. 나온 뒤에는 일반 경로로 다음 섹터에 들어간다',
      grade: 0,
      route: null,
    });
  }
  return out;
}

export function chooseRoute(run: RunState, option: RouteOption): void {
  if (option.bonus) {
    run.bonus = true;
    run.route = 'normal';
  } else {
    run.bonus = false;
    run.route = option.id;
  }
}

/**
 * 섹터 밖에서 팀을 회복시킨다 (캠프 휴식, 상점 응급 처치).
 * @param revivePct 0보다 크면 쓰러진 캐릭터를 이 비율의 체력으로 복귀시킨다
 */
export function healRunTeam(run: RunState, pct: number, revivePct = 0): void {
  for (const m of run.team) {
    const maxHp = computeStats(run, db.char(m.id)).maxHp;
    if (m.dead) {
      if (revivePct > 0) {
        m.dead = false;
        m.hp = Math.round(maxHp * revivePct);
      }
      continue;
    }
    if (m.hp < 0) continue; // 이미 최대 체력
    m.hp = Math.min(maxHp, Math.round(m.hp + maxHp * pct));
  }
}

/** 캠프 휴식 */
export function campRest(run: RunState): void {
  healRunTeam(run, db.pct('camp.restHeal'), db.pct('camp.reviveHp'));
}
