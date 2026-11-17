// 캐릭터별 스킬 구현(kit)이 따르는 규격
import type { Enemy } from '../enemy/Enemy';
import type { HitSpec } from '../entities';
import type { World } from '../world/World';
import type { Member } from './Member';
import type { Party } from './Party';

/** 스킬을 쓸 때의 상황 */
export interface SkillCtx {
  w: World;
  p: Party;
  m: Member;
  /** 조준 각도(rad) */
  aim: number;
  /** 조준된 적 (없을 수 있음) */
  target: Enemy | null;
}

/** 오프 필드 캐릭터가 필드 캐릭터에게 주는 효과의 합 */
export interface Aura {
  /** 공격력 증가 (0.1 = +10%) */
  atk: number;
  /** 치명타 확률 증가 (0.05 = +5%p) */
  crit: number;
  /** 받는 피해 감소 (0.08 = -8%) */
  guard: number;
  /** 궁극기 게이지 획득 증가 */
  ultGain: number;
}

export interface Kit {
  /** 기본 공격 1회. 반환값 = 다음 행동까지 걸리는 시간(초) */
  basic(c: SkillCtx): number;
  /** 액티브 스킬. 반환값 = 시전 중 행동 불가 시간(초) */
  active(c: SkillCtx): number;
  /** 궁극기. 반환값 = 시전 중 행동 불가 시간(초) */
  ult(c: SkillCtx): number;
  /** 매 프레임 호출 (패시브, 오프 필드 행동) */
  update?(w: World, m: Member, dt: number, onField: boolean): void;
  /** 오프 필드일 때 필드 캐릭터에게 주는 효과를 aura에 더한다 */
  aura?(m: Member, aura: Aura): void;
  onHit?(w: World, m: Member, e: Enemy, h: HitSpec, dmg: number): void;
  /** 팀의 누군가가 적을 처치했을 때 */
  onKill?(w: World, m: Member, e: Enemy, killer: Member | null): void;
  onDodge?(w: World, m: Member): void;
  onSwapIn?(w: World, m: Member): void;
  /** 무적 시간으로 공격을 흘렸을 때 */
  onEvade?(w: World, m: Member): void;
}
