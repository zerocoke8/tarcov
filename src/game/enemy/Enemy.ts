// 몬스터 1체의 전투 중 상태
import type { Attr, GradeDef, MonsterDef } from '../../data/types';
import type { MonsterAnim, Pack, Zone } from '../entities';
import type { Circle } from '../world/collision';

export type DebuffId = 'slow' | 'shock' | 'mark' | 'jolt' | 'bleed' | 'burn' | 'poison';

/** 지속 피해를 주는 디버프. v = 초당 피해 (중첩 1개당) */
export const DOTS: DebuffId[] = ['bleed', 'burn', 'poison'];

export interface Debuff {
  id: DebuffId;
  t: number;
  /** 효과 크기 (둔화 비율, 받는 피해 증가 비율 등) */
  v: number;
  stacks: number;
}

/** 머리 위에 보여 줄 상위 디버프 1개의 글자 */
const DEBUFF_LABEL: Record<DebuffId, string> = {
  jolt: '감',
  mark: '표',
  shock: '전',
  slow: '둔',
  bleed: '혈',
  burn: '화',
  poison: '독',
};
const DEBUFF_PRIORITY: DebuffId[] = ['jolt', 'mark', 'shock', 'burn', 'poison', 'bleed', 'slow'];

export type EnemyState = 'idle' | 'move' | 'windup' | 'act' | 'recover';

export class Enemy implements Circle {
  readonly id: number;
  readonly def: MonsterDef;
  readonly grade: GradeDef;
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  atk: number;
  weak: Attr;

  pack: Pack | null = null;
  aggro = false;
  dead = false;
  /** 사망 연출이 끝나고 목록에서 빠질 때까지 남은 시간 */
  deathT = 0;

  state: EnemyState = 'idle';
  /** 현재 상태에 머문 시간 */
  t = 0;
  /** 다음 공격까지 남은 시간 */
  cd = 0;
  dirX = 0;
  dirY = 1;

  stunT = 0;
  /** 넉백 속도 */
  kx = 0;
  ky = 0;
  hitFlash = 0;
  debuffs: Debuff[] = [];
  /** 자연 속성 연쇄가 다시 일어나기까지 남은 시간 */
  chainIcd = 0;

  anim: MonsterAnim = 'Idle';
  animT = 0;
  /** 지금 동작의 전체 길이(초). 0이면 정해지지 않음 (그림의 원래 빠르기로 재생) */
  animDur = 0;
  /** 동작이 시작된 뒤 타격이 들어가는 시점(초). 그림의 타격 프레임을 여기에 맞춘다. 0이면 맞추지 않음 */
  animHit = 0;

  /** 중형 이상: 넉백되지 않는다 */
  superArmor: boolean;
  boss = false;
  invuln = false;
  /** 지금 걸어 둔 공격 예고 */
  tele: Zone | null = null;
  vars: Record<string, number> = {};
  view?: unknown;

  constructor(id: number, def: MonsterDef, grade: GradeDef, x: number, y: number, hpMult: number, atkMult: number) {
    this.id = id;
    this.def = def;
    this.grade = grade;
    this.x = x;
    this.y = y;
    this.r = def.radius * grade.scale;
    this.maxHp = Math.round(def.hp * grade.hpMult * hpMult);
    this.hp = this.maxHp;
    this.atk = def.atk * grade.atkMult * atkMult;
    this.weak = def.weak;
    this.superArmor = def.size !== 'S';
    this.boss = def.size === 'L';
  }

  /**
   * 동작을 바꾼다. 같은 동작이면 이어서 재생한다 (restart 를 주면 처음부터 다시).
   * @param dur   동작의 전체 길이(초). 공격처럼 규칙이 시간을 정하는 동작에 준다
   * @param hitAt 타격이 들어가는 시점(초)
   */
  setAnim(a: MonsterAnim, dur = 0, hitAt = 0, restart = false): void {
    if (this.anim === a && !restart) return;
    this.anim = a;
    this.animT = 0;
    this.animDur = dur;
    this.animHit = hitAt;
  }

  /** 길이가 정해진 동작(공격 등)이 끝까지 재생됐는지. 길이가 없는 동작은 언제나 끝난 것으로 본다 */
  animDone(): boolean {
    return this.animDur <= 0 || this.animT >= this.animDur;
  }

  debuff(id: DebuffId): Debuff | undefined {
    return this.debuffs.find((d) => d.id === id);
  }

  hasDebuff(id: DebuffId): boolean {
    return this.debuffs.some((d) => d.id === id);
  }

  addDebuff(id: DebuffId, dur: number, v = 0, maxStacks = 1): void {
    const cur = this.debuff(id);
    if (cur) {
      cur.t = Math.max(cur.t, dur);
      cur.v = Math.max(cur.v, v);
      cur.stacks = Math.min(maxStacks, cur.stacks + 1);
    } else this.debuffs.push({ id, t: dur, v, stacks: 1 });
  }

  /** 받는 피해 배율 (표식·감전) */
  vulnerability(): number {
    let v = 1;
    for (const d of this.debuffs) if (d.id === 'mark' || d.id === 'jolt') v += d.v;
    return v;
  }

  speed(): number {
    const slow = this.debuff('slow');
    return this.def.speed * (slow ? 1 - Math.min(0.9, slow.v) : 1);
  }

  /** 기절. 진행 중이던 공격 예고는 취소된다 */
  stun(sec: number): void {
    if (this.boss) return;
    this.stunT = Math.max(this.stunT, this.superArmor ? sec * 0.5 : sec);
    this.interrupt();
  }

  /** 진행 중인 공격을 끊고 추적 상태로 되돌린다 */
  interrupt(): void {
    if (this.tele) {
      this.tele.dead = true;
      this.tele = null;
    }
    if (this.state === 'windup' || this.state === 'act') {
      this.state = 'move';
      this.cd = Math.max(this.cd, 0.4);
    }
  }

  /** 머리 위에 보여 줄 상위 상태 1개 */
  topStatus(): string {
    if (this.stunT > 0) return '기';
    for (const id of DEBUFF_PRIORITY) if (this.hasDebuff(id)) return DEBUFF_LABEL[id];
    return '';
  }

  tickTimers(dt: number): void {
    this.animT += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.chainIcd > 0) this.chainIcd -= dt;
    for (let i = this.debuffs.length - 1; i >= 0; i--) {
      this.debuffs[i].t -= dt;
      if (this.debuffs[i].t <= 0) this.debuffs.splice(i, 1);
    }
  }
}
