// 팀에 편성된 캐릭터 1명의 전투 중 상태
import { db } from '../../data/tables';
import type { CharDef, SkillDef } from '../../data/types';
import type { MemberState, RunState } from '../run/RunState';
import { computeStats, type Stats } from '../run/stats';
import type { World } from '../world/World';
import type { Kit } from './kit';
import type { Party } from './Party';

export type BuffStat = 'atk' | 'aspd' | 'speed' | 'guard' | 'crit';

/** 일정 시간 유지되는 강화 효과. 수치는 중첩 1개당 값이다 (0.1 = +10%). */
export interface Buff {
  id: string;
  /** HUD에 보이는 짧은 이름 */
  label: string;
  t: number;
  dur: number;
  stacks: number;
  maxStacks: number;
  atk?: number;
  aspd?: number;
  speed?: number;
  /** 받는 피해 감소 */
  guard?: number;
  crit?: number;
}

export interface StatusIcon {
  label: string;
  stacks: number;
  /** 남은 시간 비율 0~1 */
  ratio: number;
}

export class Member {
  readonly def: CharDef;
  readonly kit: Kit;
  readonly state: MemberState;
  readonly activeDef: SkillDef;
  party!: Party;
  stats: Stats;

  hp: number;
  dead: boolean;
  ult: number;

  /** 액티브 잔여 카운트와 다음 충전까지 남은 시간 */
  charges: number;
  cd = 0;

  /** 기본 공격 연속기 단계 */
  combo = 0;
  comboT = 0;

  /** 형상: 빌드업 중첩 */
  formStacks = 0;
  formT = 0;
  /** 반전: 임팩트 남은 시간 */
  reverseT = 0;

  shield = 0;
  shieldT = 0;
  buffs: Buff[] = [];
  /** 스킬 구현이 자유롭게 쓰는 값 */
  vars: Record<string, number> = {};

  constructor(def: CharDef, kit: Kit, state: MemberState, run: RunState) {
    this.def = def;
    this.kit = kit;
    this.state = state;
    this.activeDef = db.skill(def.id, 'active');
    this.stats = computeStats(run, def);
    this.hp = state.hp < 0 ? this.stats.maxHp : Math.min(state.hp, this.stats.maxHp);
    this.dead = state.dead;
    this.ult = state.ult;
    this.charges = this.maxCharges();
  }

  /** 스킬 성장·장비가 바뀌었을 때 능력치를 다시 계산한다 */
  refresh(run: RunState): void {
    const before = this.stats.maxHp;
    this.stats = computeStats(run, this.def);
    if (this.stats.maxHp > before) this.hp += this.stats.maxHp - before;
    this.hp = Math.min(this.hp, this.stats.maxHp);
    this.charges = Math.min(this.charges, this.maxCharges());
  }

  /** 섹터가 끝날 때 런 상태에 되돌려 적는다 */
  save(): void {
    this.state.hp = this.hp;
    this.state.dead = this.dead;
    this.state.ult = this.ult;
  }

  get onField(): boolean {
    return this.party.active === this;
  }

  maxCharges(): number {
    return Math.max(1, this.activeDef.charges);
  }

  cooldown(): number {
    return this.activeDef.cooldown * this.stats.cdr;
  }

  /** 액티브 쿨타임 진행도 0~1 (1 = 사용 가능) */
  cdRatio(): number {
    if (this.charges > 0) return 1;
    const total = this.cooldown();
    return total > 0 ? 1 - this.cd / total : 1;
  }

  useCharge(): void {
    this.charges--;
    if (this.cd <= 0) this.cd = this.cooldown();
  }

  reduceCooldown(sec: number): void {
    if (this.charges >= this.maxCharges()) return;
    this.cd -= sec;
  }

  buffSum(stat: BuffStat): number {
    let v = 0;
    for (const b of this.buffs) v += (b[stat] ?? 0) * b.stacks;
    return v;
  }

  atk(): number {
    const aura = this.onField ? this.party.aura.atk : 0;
    return this.stats.atk * (1 + this.buffSum('atk') + aura);
  }

  aspd(): number {
    return this.stats.aspd * (1 + this.buffSum('aspd'));
  }

  speed(): number {
    return this.stats.speed * (1 + this.buffSum('speed'));
  }

  critRate(): number {
    const aura = this.onField ? this.party.aura.crit : 0;
    return this.stats.critRate + this.buffSum('crit') + aura;
  }

  /** 받는 피해 배율 */
  damageTaken(): number {
    const aura = this.onField ? this.party.aura.guard : 0;
    return this.stats.dmgTaken * Math.max(0.2, 1 - this.buffSum('guard') - aura);
  }

  range(): number {
    return this.def.range * this.stats.range;
  }

  /** 속성 특성에 따른 피해 배율 (형상 빌드업, 반전 임팩트) */
  traitMult(): number {
    if (this.def.attr === 'form') return 1 + this.formStacks * db.pct('attr.form.perStack');
    if (this.def.attr === 'reverse' && this.reverseT > 0) return 1 + db.pct('attr.reverse.bonus');
    return 1;
  }

  formMax(): number {
    return db.P('attr.form.maxStacks');
  }

  addBuff(b: Omit<Buff, 't' | 'stacks' | 'maxStacks'> & { maxStacks?: number }): void {
    const cur = this.buffs.find((x) => x.id === b.id);
    if (cur) {
      cur.t = b.dur;
      cur.dur = b.dur;
      cur.stacks = Math.min(cur.maxStacks, cur.stacks + 1);
      return;
    }
    this.buffs.push({ ...b, t: b.dur, stacks: 1, maxStacks: b.maxStacks ?? 1 });
  }

  heal(amount: number): number {
    if (this.dead) return 0;
    const before = this.hp;
    this.hp = Math.min(this.stats.maxHp, this.hp + amount);
    return this.hp - before;
  }

  /** HUD의 버프 칸에 보여 줄 목록 */
  statusIcons(): StatusIcon[] {
    const out: StatusIcon[] = [];
    if (this.formStacks > 0) {
      out.push({ label: '빌드업', stacks: this.formStacks, ratio: this.formT / db.P('attr.form.duration') });
    }
    if (this.reverseT > 0) {
      out.push({ label: '임팩트', stacks: 1, ratio: this.reverseT / db.P('attr.reverse.duration') });
    }
    if (this.shield > 0) out.push({ label: '보호막', stacks: 1, ratio: 1 });
    for (const b of this.buffs) out.push({ label: b.label, stacks: b.stacks, ratio: b.t / b.dur });
    return out;
  }

  tick(w: World, dt: number, onField: boolean): void {
    const max = this.maxCharges();
    if (this.charges < max) {
      this.cd -= dt;
      if (this.cd <= 0) {
        this.charges++;
        this.cd = this.charges < max ? this.cooldown() : 0;
      }
    }
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }
    if (this.formStacks > 0) {
      this.formT -= dt;
      if (this.formT <= 0) this.formStacks = 0;
    }
    if (this.reverseT > 0) this.reverseT -= dt;
    if (this.shield > 0) {
      this.shieldT -= dt;
      if (this.shieldT <= 0) this.shield = 0;
    }
    for (let i = this.buffs.length - 1; i >= 0; i--) {
      this.buffs[i].t -= dt;
      if (this.buffs[i].t <= 0) this.buffs.splice(i, 1);
    }
    this.kit.update?.(w, this, dt, onField);
  }
}
