// 팀에 편성된 캐릭터 1명의 전투 중 상태
import { db } from '../../data/tables';
import type { CharDef, SkillDef } from '../../data/types';
import type { Enemy } from '../enemy/Enemy';
import type { HitSpec } from '../entities';
import { EQUIP_SKILLS, makeInst, type EquipInst } from '../equip/equipSkills';
import type { MemberState, RunState } from '../run/RunState';
import { computeStats, type Stats } from '../run/stats';
import type { World } from '../world/World';
import type { Kit } from './kit';
import type { Party } from './Party';

export type BuffStat = 'atk' | 'aspd' | 'speed' | 'guard' | 'crit' | 'ultGain';

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
  /** 궁극기 게이지 획득량 증가 */
  ultGain?: number;
  /** 지속 피해 (화상·중독): 초당 최대 체력의 이 비율을 잃는다. 이것만으로는 쓰러지지 않는다 */
  dot?: number;
  /** 핵심 상태: 필드 캐릭터의 머리 위에도 보여 준다 (궁극기·스킬로 얻는 한정 강화, 치명적인 디버프) */
  key?: boolean;
  /** 디버프 */
  bad?: boolean;
  /** 아이콘의 기호. 적지 않으면 올려 주는 능력치에서 고른다 */
  icon?: StatusGlyph;
  /** 범위 안에 있는 동안 계속 갱신되는 효과. 남은 시간을 줄어드는 것처럼 보여 주지 않는다 */
  steady?: boolean;
}

/** 상태 아이콘의 기호 종류 */
export type StatusGlyph = 'atk' | 'aspd' | 'speed' | 'guard' | 'crit' | 'shield' | 'stack' | 'impact' | 'ult' | 'flag' | 'regen' | 'hp' | 'burn' | 'poison';

export interface StatusIcon {
  /** 같은 상태를 알아보는 이름 */
  id: string;
  icon: StatusGlyph;
  label: string;
  stacks: number;
  /** 남은 시간 비율 0~1. 시간제한이 없으면 1 */
  ratio: number;
  /** 디버프 */
  bad: boolean;
  /** 핵심 상태 (머리 위에도 보여 준다) */
  key: boolean;
}

export class Member {
  readonly def: CharDef;
  readonly kit: Kit;
  readonly state: MemberState;
  readonly activeDef: SkillDef;
  /** 스킬 성장 레벨을 읽기 위한 런 상태 */
  readonly run: RunState;
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
  /** 시간에 걸친 회복 (초당 회복량, 남은 시간) */
  private regens: { rate: number; t: number }[] = [];
  /** 착용 중인 장비의 전투 중 상태 */
  equips: EquipInst[] = [];
  /** 스킬 구현이 자유롭게 쓰는 값 */
  vars: Record<string, number> = {};
  /** 지속 피해로 잃은 체력 중 아직 숫자로 띄우지 않은 양과, 다음에 띄울 때까지 남은 시간 */
  private dotShown = 0;
  private dotT = 0;

  constructor(def: CharDef, kit: Kit, state: MemberState, run: RunState) {
    this.def = def;
    this.kit = kit;
    this.state = state;
    this.run = run;
    this.activeDef = db.skill(def.id, 'active');
    this.stats = computeStats(run, def);
    this.hp = state.hp < 0 ? this.stats.maxHp : Math.min(state.hp, this.stats.maxHp);
    this.dead = state.dead;
    this.ult = state.ult;
    this.charges = this.maxCharges();
    this.buildEquips(run);
  }

  /** 스킬 성장·장비가 바뀌었을 때 능력치를 다시 계산한다 */
  refresh(run: RunState): void {
    const before = this.stats.maxHp;
    this.stats = computeStats(run, this.def);
    if (this.stats.maxHp > before && !this.dead) this.hp += this.stats.maxHp - before;
    this.hp = Math.min(this.hp, this.stats.maxHp);
    this.charges = Math.min(this.charges, this.maxCharges());
    this.buildEquips(run);
  }

  private buildEquips(run: RunState): void {
    const old = this.equips;
    this.equips = run.itemsOf(this.def.id).map((item) => {
      const q = makeInst(item);
      const prev = old.find((o) => o.item.uid === item.uid);
      if (prev) {
        q.cd = prev.cd;
        q.count = prev.count;
        q.used = prev.used;
      }
      return q;
    });
  }

  // ---- 장비 스킬 발동 ------------------------------------------------------

  eqBasic(w: World, aim: number): void {
    for (const q of this.equips) EQUIP_SKILLS[q.def.id]?.basic?.(w, this, q, aim);
  }

  eqHit(w: World, e: Enemy, h: HitSpec, dmg: number, crit: boolean): void {
    for (const q of this.equips) EQUIP_SKILLS[q.def.id]?.hit?.(w, this, q, e, h, dmg, crit);
  }

  eqKill(w: World, e: Enemy): void {
    for (const q of this.equips) EQUIP_SKILLS[q.def.id]?.kill?.(w, this, q, e);
  }

  eqHurt(w: World, dmg: number, src: Enemy | null): void {
    for (const q of this.equips) EQUIP_SKILLS[q.def.id]?.hurt?.(w, this, q, dmg, src);
  }

  /** 쓰러질 피해를 막아 주는 장비가 있으면 true */
  eqFatal(w: World): boolean {
    for (const q of this.equips) if (EQUIP_SKILLS[q.def.id]?.fatal?.(w, this, q)) return true;
    return false;
  }

  eqEvent(kind: 'swapIn' | 'dodge' | 'active' | 'ult', w: World): void {
    for (const q of this.equips) EQUIP_SKILLS[q.def.id]?.[kind]?.(w, this, q);
  }

  /** amount만큼을 dur초에 걸쳐 회복한다 */
  addRegen(amount: number, dur: number): void {
    if (dur > 0 && amount > 0) this.regens.push({ rate: amount / dur, t: dur });
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
    return Math.max(1, this.activeDef.charges + this.stats.chargeBonus);
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
    return this.stats.critRate + this.buffSum('crit') + aura + (this.kit.critBonus?.(this) ?? 0);
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
    if (this.def.attr === 'reverse' && this.reverseT > 0) {
      return 1 + db.pct('attr.reverse.bonus') + (this.kit.trait?.(this).reverseBonus ?? 0);
    }
    return 1;
  }

  formMax(): number {
    return db.P('attr.form.maxStacks') + (this.kit.trait?.(this).formMax ?? 0);
  }

  /** 반전: 임팩트 지속시간 */
  reverseDur(): number {
    return db.P('attr.reverse.duration') + (this.kit.trait?.(this).reverseDur ?? 0);
  }

  /** 반전 속성이면 임팩트를 켠다 (회피·교체 등장 직후) */
  triggerReverse(): void {
    if (this.def.attr === 'reverse') this.reverseT = this.reverseDur();
  }

  addBuff(b: Omit<Buff, 't' | 'stacks' | 'maxStacks'> & { maxStacks?: number }): void {
    const cur = this.buffs.find((x) => x.id === b.id);
    if (cur) {
      cur.t = b.dur;
      cur.dur = b.dur;
      cur.stacks = Math.min(cur.maxStacks, cur.stacks + 1);
      if (b.dot) cur.dot = Math.max(cur.dot ?? 0, b.dot);
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
    // 속성 특성의 상태와 보호막은 싸우는 방식에 바로 영향을 주므로 핵심 상태다
    if (this.formStacks > 0) {
      out.push({ id: 'form', icon: 'stack', label: '빌드업', stacks: this.formStacks, ratio: this.formT / db.P('attr.form.duration'), bad: false, key: true });
    }
    if (this.reverseT > 0) {
      out.push({ id: 'reverse', icon: 'impact', label: '임팩트', stacks: 1, ratio: this.reverseT / this.reverseDur(), bad: false, key: true });
    }
    if (this.shield > 0) out.push({ id: 'shield', icon: 'shield', label: '보호막', stacks: 1, ratio: 1, bad: false, key: true });
    for (const b of this.buffs) {
      out.push({
        id: b.id,
        icon: b.icon ?? (b.atk ? 'atk' : b.aspd ? 'aspd' : b.speed ? 'speed' : b.guard ? 'guard' : b.crit ? 'crit' : 'ult'),
        label: b.label,
        stacks: b.stacks,
        ratio: b.steady ? 1 : b.t / b.dur,
        bad: !!b.bad,
        key: !!b.key,
      });
    }
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
    // 지속 피해 (화상·중독). 체력 1 아래로는 내려가지 않는다
    let loss = 0;
    for (const b of this.buffs) if (b.dot) loss += b.dot * b.stacks * this.stats.maxHp * dt;
    if (loss > 0 && !w.cheatInvuln) {
      const took = Math.min(loss, Math.max(0, this.hp - 1));
      this.hp -= took;
      this.dotShown += took;
      w.stats.taken += took;
    }
    if (this.dotShown > 0) {
      this.dotT -= dt;
      if (this.dotT <= 0) {
        this.dotT = 0.5;
        if (onField && this.dotShown >= 1) w.fx.number(this.party.x, this.party.y, Math.round(this.dotShown), 'hurt', 70);
        this.dotShown = 0;
      }
    }
    for (let i = this.buffs.length - 1; i >= 0; i--) {
      this.buffs[i].t -= dt;
      if (this.buffs[i].t <= 0) this.buffs.splice(i, 1);
    }
    for (let i = this.regens.length - 1; i >= 0; i--) {
      const r = this.regens[i];
      this.heal(r.rate * Math.min(dt, r.t));
      r.t -= dt;
      if (r.t <= 0) this.regens.splice(i, 1);
    }
    for (const q of this.equips) if (q.cd > 0) q.cd -= dt;
    this.kit.update?.(w, this, dt, onField);
  }
}
