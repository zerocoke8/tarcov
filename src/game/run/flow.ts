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
  /** 클리어 보상 품질 (1~3) */
  reward: number;
  /**
   * 가려진 선택지면 무엇이 가려졌는지. 가려진 것은 고르기 전까지 화면에 "?"로 보인다.
   * (팀 공통 장비 스킬 "초록 안경"이 있으면 가려졌던 것이 보이지만, 가려진 선택지라는 점은 그대로다)
   */
  hidden: { risk: boolean; reward: boolean } | null;
}

/** 보상 품질의 이름 */
export const REWARD_NAME = ['', '일반', '희귀 이상', '영웅 이상'];

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
  run.routeScore += db.route(run.route).score + (run.routeHidden ? db.P('route.hiddenScore') : 0);
  if (def.type === 'boss' || def.index >= db.lastSector) return { camp: false, step: { kind: 'end' } };

  const next = db.sector(def.index + 1);
  run.sector = next.index;
  run.route = 'normal';
  run.routeReward = 0;
  run.routeHidden = false;
  run.bonus = false;
  if (next.type === 'boss') return { camp: def.camp, step: { kind: 'next' } };
  return { camp: def.camp, step: { kind: 'route', options: rollRouteOptions(def, rng, run) } };
}

/** 다음 섹터로 가는 경로 선택지 (기획서 7.7절) */
export function rollRouteOptions(cleared: SectorDef, rng: Rng, run?: RunState): RouteOption[] {
  const out: RouteOption[] = [];
  const routes: RouteDef[] = [];
  for (const r of [...db.routeList].sort((a, b) => a.grade - b.grade)) {
    // 특급 경로는 다음 섹터의 강화 단계가 기준 이상일 때부터 나온다 (시즌 1에서는 섹터 3을 클리어한 뒤부터)
    if (r.special > 0 && db.sector(cleared.index + 1).depth < db.P('route.specialFrom')) continue;
    routes.push(r);
    out.push({ id: r.id, bonus: false, name: r.name, desc: r.desc, grade: r.grade, route: r, reward: r.quality, hidden: null });
  }

  // 가려진 선택지: 위험과 보상이 따로 정해지고, 그 가운데 하나 또는 둘 다가 가려진 채로 나온다.
  // 약한 무리에 좋은 보상일 수도, 특급 괴이에 평범한 보상일 수도 있다. 대신 고르면 팀 점수가 붙는다
  if (rng.chance(db.pct('route.hiddenChance'))) {
    const route = rng.weighted(routes, (r) => r.hidden);
    const reward = rng.weighted([1, 2, 3], (q) => db.P(`route.hiddenReward.q${q}`));
    if (route && reward) {
      const both = rng.chance(db.pct('route.hiddenBoth'));
      const risk = both || rng.chance(0.5);
      // 초록 안경: 위험이 보인다. 희귀 등급부터는 보상도 보인다
      const glasses = run ? run.teamSkillRarity('c2_glasses') : 0;
      const hidden = { risk: risk && glasses < 1, reward: (both || !risk) && glasses < 2 };
      const opt: RouteOption = { id: route.id, bonus: false, name: '가려진 길', desc: hiddenDesc(route, reward, hidden), grade: route.grade, route, reward, hidden };
      // 위험한 경로가 둘 이상 나와 있으면 그중 하나의 자리를 차지하고, 아니면 한 장이 더 놓인다
      const risky = out.filter((o) => o.grade > 1);
      if (risky.length >= 2) out[out.indexOf(rng.pick(risky))] = opt;
      else out.push(opt);
    }
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
      reward: 1,
      hidden: null,
    });
  }
  return out;
}

/** 가려진 선택지의 설명문. 가려진 것은 "?"로 적는다 */
function hiddenDesc(route: RouteDef, reward: number, hidden: { risk: boolean; reward: boolean }): string {
  const risk = hidden.risk ? '위험: ? — 어떤 괴이가 기다리는지 들어가 봐야 안다' : `위험: ${route.name}`;
  const prize = hidden.reward ? '클리어 보상: ? — 무엇이 나올지 알 수 없다' : `클리어 보상: ${REWARD_NAME[reward]}`;
  return `${risk}. ${prize}`;
}

export function chooseRoute(run: RunState, option: RouteOption): void {
  run.routeReward = 0;
  run.routeHidden = false;
  if (option.bonus) {
    run.bonus = true;
    run.route = 'normal';
  } else {
    run.bonus = false;
    run.route = option.id;
    if (option.hidden) {
      run.routeHidden = true;
      run.routeReward = option.reward;
    }
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
