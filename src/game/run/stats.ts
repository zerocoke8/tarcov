// 캐릭터의 최종 능력치 계산: 기본 능력치 → 속성 특성 → (2단계부터) 스킬 성장·장비
import { db } from '../../data/tables';
import type { CharDef } from '../../data/types';
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
  /** 공격 범위·사거리 배율 */
  range: number;
  dodgeCharges: number;
}

export function computeStats(_run: RunState, def: CharDef): Stats {
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

  s.maxHp = Math.round(s.maxHp);
  return s;
}
