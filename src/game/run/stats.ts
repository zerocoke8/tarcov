// 캐릭터의 최종 능력치 계산: 기본 능력치 → 속성 특성 → 스킬 성장 → 괴담의 잔재 → 장비 옵션
//
// 여기서는 "능력치가 달라지는" 성장만 다룬다. 스킬의 동작이 달라지는 성장(검기 수 증가 등)은
// 각 캐릭터의 스킬 구현(player/kits)에서 run.lv(id)로 직접 읽는다.
import { db } from '../../data/tables';
import type { CharDef, OptStat, UpgradeDef } from '../../data/types';
import type { RunState } from './RunState';

export interface Stats {
  maxHp: number;
  atk: number;
  speed: number;
  /** 치명타 확률 (0~1) */
  critRate: number;
  /** 치명타 피해 배율 */
  critDmg: number;
  /** 공격 속도 배율 (클수록 빠름) */
  aspd: number;
  /** 쿨타임 배율 (작을수록 빠름) */
  cdr: number;
  /** 받는 피해 배율 */
  dmgTaken: number;
  basicDmg: number;
  activeDmg: number;
  ultDmg: number;
  allDmg: number;
  /** 궁극기 게이지 획득 배율 */
  ultGain: number;
  /** 기본 공격의 범위·사거리 배율 */
  range: number;
  dodgeCharges: number;
}

type StatEffect = (s: Stats, lv: number, u: UpgradeDef) => void;

/** 스킬 성장 id → 능력치 변화. v1, v2는 upgrades.csv의 값(레벨당) */
const UPGRADE_STATS: Record<string, StatEffect> = {
  // 서린
  serin_wave_cd: (s, lv, u) => (s.cdr *= 1 - (lv * u.v1) / 100),
  serin_dodge: (s, lv, u) => (s.dodgeCharges += lv * u.v1),
  serin_range: (s, lv, u) => (s.range *= 1 + (lv * u.v1) / 100),
  serin_heavy: (s, lv, u) => (s.cdr *= 1 + (lv * u.v2) / 100),
  // 미도
  mido_nova_cd: (s, lv, u) => (s.cdr *= 1 - (lv * u.v1) / 100),
  // 시아
  sia_rain: (s, lv, u) => (s.cdr *= 1 - (lv * u.v2) / 100),
  // 시즌 스킬 — 팀
  s_atk: (s, lv, u) => (s.atk *= 1 + (lv * u.v1) / 100),
  s_hp: (s, lv, u) => (s.maxHp *= 1 + (lv * u.v1) / 100),
  s_crit: (s, lv, u) => (s.critRate += (lv * u.v1) / 100),
  s_speed: (s, lv, u) => (s.speed *= 1 + (lv * u.v1) / 100),
  s_ult: (s, lv, u) => (s.ultGain *= 1 + (lv * u.v1) / 100),
  // 시즌 스킬 — 포지션
  s_striker: (s, lv, u) => {
    s.activeDmg *= 1 + (lv * u.v1) / 100;
    s.critDmg += (lv * u.v2) / 100;
  },
  s_leader: (s, lv, u) => {
    s.basicDmg *= 1 + (lv * u.v1) / 100;
    s.dmgTaken *= 1 - (lv * u.v2) / 100;
  },
  s_support: (s, lv, u) => (s.cdr *= 1 - (lv * u.v1) / 100),
};

/** 장비 능력치 옵션 (값은 %) */
const OPTION_STATS: Record<OptStat, (s: Stats, v: number) => void> = {
  atk: (s, v) => (s.atk *= 1 + v / 100),
  hp: (s, v) => (s.maxHp *= 1 + v / 100),
  critRate: (s, v) => (s.critRate += v / 100),
  critDmg: (s, v) => (s.critDmg += v / 100),
  aspd: (s, v) => (s.aspd *= 1 + v / 100),
  basicDmg: (s, v) => (s.basicDmg *= 1 + v / 100),
  activeDmg: (s, v) => (s.activeDmg *= 1 + v / 100),
  ultDmg: (s, v) => (s.ultDmg *= 1 + v / 100),
  guard: (s, v) => (s.dmgTaken *= 1 - v / 100),
  speed: (s, v) => (s.speed *= 1 + v / 100),
  cdr: (s, v) => (s.cdr *= 1 - v / 100),
  ultGain: (s, v) => (s.ultGain *= 1 + v / 100),
};

/** 그 스킬 성장이 이 캐릭터에게 적용되는지 */
export function upgradeApplies(u: UpgradeDef, def: CharDef): boolean {
  if (u.category === 'unique') return u.owner === def.id;
  if (u.category === 'season') return u.owner === 'team' || u.owner === def.position;
  return false;
}

export function computeStats(run: RunState, def: CharDef): Stats {
  const s: Stats = {
    maxHp: def.hp,
    atk: def.atk,
    speed: def.speed,
    critRate: db.pct('crit.rate'),
    critDmg: db.pct('crit.dmg'),
    aspd: 1,
    cdr: 1,
    dmgTaken: 1,
    basicDmg: 1,
    activeDmg: 1,
    ultDmg: 1,
    allDmg: 1,
    ultGain: 1,
    range: 1,
    dodgeCharges: db.P('dodge.charges'),
  };

  // 속성 특성 — 실체(체급): 최대 체력 증가, 받는 피해 감소
  if (def.attr === 'substance') {
    s.maxHp *= 1 + db.pct('attr.substance.hp');
    s.dmgTaken *= 1 - db.pct('attr.substance.dr');
  }

  for (const id in run.upgrades) {
    const lv = run.upgrades[id];
    const fx = UPGRADE_STATS[id];
    if (!fx || lv <= 0) continue;
    const u = db.upgrade(id);
    if (upgradeApplies(u, def)) fx(s, lv, u);
  }

  s.atk *= 1 + run.relics.atk * db.pct('relic.atk');
  s.maxHp *= 1 + run.relics.hp * db.pct('relic.hp');
  s.critRate += run.relics.crit * db.pct('relic.crit');

  for (const item of run.itemsOf(def.id)) {
    for (const o of item.opts) OPTION_STATS[o.stat](s, o.v);
  }

  s.cdr = Math.max(0.3, s.cdr);
  s.dmgTaken = Math.max(0.2, s.dmgTaken);
  s.maxHp = Math.round(s.maxHp);
  s.atk = Math.round(s.atk * 10) / 10;
  return s;
}
