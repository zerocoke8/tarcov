// 캐릭터별 스킬 구현(kit)이 따르는 규격
import type { Enemy } from '../enemy/Enemy';
import type { CharAnim, HitSpec } from '../entities';
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

/**
 * 교체로 나올 때 보이는 모습 (표시부가 들어오는 길을 이것으로 고른다).
 * rush = 뒤에서 달려든다, drop = 위에서 떨어진다, roll = 구르듯 미끄러져 들어온 뒤 공격한다, blink = 그 자리에 나타난다
 */
export type EntryStyle = 'rush' | 'drop' | 'roll' | 'blink';

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
  /** 이 캐릭터의 이펙트 색 (타격 섬광 등) */
  color?: number;
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
  /** 자연 속성 연쇄에 대한 캐릭터 고유 보정 (추가 대상 수, 피해 증가 비율) */
  natureChain?(w: World): { extraTargets: number; bonus: number };
  /** 이 캐릭터가 주는 피해에 곱해지는 배율 (패시브·고유 성장의 조건부 피해 증가) */
  dmgMult?(w: World, m: Member, e: Enemy, h: HitSpec): number;
  /** 치명타 확률에 더해지는 값 (0.1 = +10%p) */
  critBonus?(m: Member): number;
  /** 속성 특성에 대한 캐릭터 고유 보정 */
  trait?(m: Member): TraitMods;
  /** 이 캐릭터에서 다른 캐릭터로 교체해 나갈 때 */
  onSwapOut?(w: World, m: Member, next: Member): void;
  /**
   * 등장 기술: 교체로(또는 쓰러진 동료 대신) 필드에 나오면서 쓰는 짧은 기술 (기획서 3.7절).
   * 가까운 적이 있으면 그 적을, 없으면 바라보던 쪽을 겨눈 채로 불린다. 반환값 = 그 동작 동안 이동할 수 없는 시간(초).
   * 기본 공격처럼 회피·스킬로 끊을 수 있어야 하므로 타격은 p.after 로 예약한다
   */
  entry?(c: SkillCtx): number;
  /** 등장 기술을 쓰는 동안의 동작 그림 (기본: 기본 공격) */
  entryAnim?: CharAnim;
  /** 등장 기술로 나올 때 보이는 모습 (기본: rush) */
  entryStyle?: EntryStyle;
}

export interface TraitMods {
  /** 반전: 임팩트 피해 증가에 더해지는 값 */
  reverseBonus?: number;
  /** 반전: 임팩트 지속시간에 더해지는 값(초) */
  reverseDur?: number;
  /** 형상: 빌드업 최대 중첩에 더해지는 값 */
  formMax?: number;
}
