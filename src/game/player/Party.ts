// 플레이어가 조작하는 파티. 필드에는 한 명만 나와 있고, 나머지 둘은 오프 필드에서 대기한다.
//
// 조작 규칙 (기획서 3절)
//  - D패드로 이동한다.
//  - 공격 버튼을 누르면 이동이 멈추고 공격한다. 누르고 있는 동안 반복한다.
//  - D패드 입력 중 공격하면 그 방향으로(가까운 적이 있으면 조준 보정), 입력이 없으면 추천 타겟에게 공격한다.
//  - 공격 중 D패드는 이동 없이 조준 방향만 바꾼다.
import { angDiff, deg } from '../../core/math';
import { db } from '../../data/tables';
import type { Enemy } from '../enemy/Enemy';
import type { CharAnim } from '../entities';
import type { InputAction, InputState } from '../input';
import { moveCircle, type Circle } from '../world/collision';
import type { World } from '../world/World';
import type { Aura, SkillCtx } from './kit';
import type { Member } from './Member';

export type PartyAction = 'attack' | 'cast' | 'dodge' | 'dash' | null;

export interface Aim {
  angle: number;
  target: Enemy | null;
}

export class Party implements Circle {
  x: number;
  y: number;
  r: number;
  /** 바라보는 방향(rad). 화면 아래쪽이 +y */
  facing = Math.PI / 2;
  readonly members: Member[];
  cur = 0;

  /** 지금 하고 있는 행동과 끝날 때까지 남은 시간 */
  action: PartyAction = null;
  lock = 0;
  /** 행동이 취소될 때마다 올라간다. 예약해 둔 판정이 취소된 행동의 것인지 가려낸다 */
  private token = 0;

  /** 회피·돌진·전진 같은 강제 이동 */
  private fvx = 0;
  private fvy = 0;
  private forceT = 0;

  invulnT = 0;
  /** 지금의 무적이 회피로 얻은 것인지 */
  dodging = false;
  hitInvulnT = 0;
  hitFlash = 0;
  /** 교체 등장 연출 남은 시간 */
  tagT = 0;

  dodgeCharges: number;
  dodgeTimer = 0;
  swapCd = 0;

  /** D패드를 누르지 않을 때의 추천 타겟 */
  autoTarget: Enemy | null = null;

  anim: CharAnim = 'Idle';
  animT = 0;
  animDur = 0;
  wiped = false;

  aura: Aura = { atk: 0, crit: 0, guard: 0, ultGain: 0 };

  private buffered: InputAction | null = null;
  private bufferT = 0;

  constructor(members: Member[], x: number, y: number) {
    this.members = members;
    for (const m of members) m.party = this;
    this.x = x;
    this.y = y;
    this.r = db.P('player.radius');
    const first = members.findIndex((m) => !m.dead);
    this.cur = first < 0 ? 0 : first;
    this.dodgeCharges = this.active.stats.dodgeCharges;
  }

  get active(): Member {
    return this.members[this.cur];
  }

  get busy(): boolean {
    return this.action === 'cast' || this.action === 'dodge' || this.action === 'dash';
  }

  avgAtk(): number {
    let sum = 0;
    for (const m of this.members) sum += m.stats.atk;
    return sum / this.members.length;
  }

  update(w: World, input: InputState, dt: number): void {
    if (this.wiped) return;
    const P = db.P;

    this.swapCd = Math.max(0, this.swapCd - dt);
    this.hitInvulnT = Math.max(0, this.hitInvulnT - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.tagT = Math.max(0, this.tagT - dt);
    if (this.invulnT > 0) {
      this.invulnT -= dt;
      if (this.invulnT <= 0) {
        this.invulnT = 0;
        this.dodging = false;
      }
    }

    // 오프 필드 캐릭터가 필드 캐릭터에게 주는 효과
    const aura = this.aura;
    aura.atk = aura.crit = aura.guard = aura.ultGain = 0;
    for (const m of this.members) {
      if (m !== this.active && !m.dead) m.kit.aura?.(m, aura);
    }
    for (const m of this.members) {
      if (!m.dead) m.tick(w, dt, m === this.active);
    }

    // 회피 카운트 충전
    const maxCharges = this.active.stats.dodgeCharges;
    if (this.dodgeCharges < maxCharges) {
      this.dodgeTimer += dt;
      if (this.dodgeTimer >= P('dodge.recharge')) {
        this.dodgeTimer = 0;
        this.dodgeCharges++;
      }
    } else {
      this.dodgeTimer = 0;
      this.dodgeCharges = maxCharges;
    }

    if (this.forceT > 0) {
      const step = Math.min(dt, this.forceT);
      moveCircle(w.grid, this, this.fvx * step, this.fvy * step);
      this.forceT -= step;
    }

    if (this.action) {
      this.lock -= dt;
      if (this.lock <= 0) {
        this.action = null;
        this.lock = 0;
      }
    }
    this.animT += dt;

    const m = this.active;
    this.autoTarget = input.dirActive ? null : w.findTarget(this.x, this.y, m.range() * P('aim.targetBonus'));

    // 버튼 입력. 지금 할 수 없으면 잠깐 기억해 두었다가 가능해지는 즉시 실행한다.
    for (const a of input.actions) {
      if (!this.perform(w, input, a)) {
        this.buffered = a;
        this.bufferT = 0.25;
      } else this.buffered = null;
    }
    input.actions.length = 0;
    if (this.buffered) {
      this.bufferT -= dt;
      if (this.perform(w, input, this.buffered) || this.bufferT <= 0) this.buffered = null;
    }
    if (this.wiped) return;

    if (!this.action) {
      if (input.attack) {
        this.startBasic(w, input);
      } else if (input.dirActive) {
        const speed = this.active.speed();
        moveCircle(w.grid, this, input.dirX * speed * dt, input.dirY * speed * dt);
        this.facing = Math.atan2(input.dirY, input.dirX);
        this.setAnim('Move');
      } else {
        this.setAnim('Idle');
      }
    }
  }

  // ---- 조준 ---------------------------------------------------------------

  /** 지금 입력 상태에서 공격이 향할 방향과 대상 */
  resolveAim(w: World, input: InputState, range: number): Aim {
    if (input.dirActive) {
      const base = Math.atan2(input.dirY, input.dirX);
      const assist = deg(db.P('aim.assistDeg'));
      let best: Enemy | null = null;
      let bestD = Infinity;
      if (assist > 0) {
        for (const e of w.enemies) {
          if (e.dead) continue;
          const d = Math.hypot(e.x - this.x, e.y - this.y);
          if (d - e.r > range || d >= bestD) continue;
          if (Math.abs(angDiff(base, Math.atan2(e.y - this.y, e.x - this.x))) > assist) continue;
          if (!w.los(this.x, this.y, e.x, e.y)) continue;
          best = e;
          bestD = d;
        }
      }
      if (best) return { angle: Math.atan2(best.y - this.y, best.x - this.x), target: best };
      return { angle: base, target: null };
    }
    const t = this.autoTarget && !this.autoTarget.dead ? this.autoTarget : null;
    if (t) return { angle: Math.atan2(t.y - this.y, t.x - this.x), target: t };
    return { angle: this.facing, target: null };
  }

  private ctx(w: World, aim: Aim): SkillCtx {
    return { w, p: this, m: this.active, aim: aim.angle, target: aim.target };
  }

  // ---- 행동 ---------------------------------------------------------------

  private begin(action: PartyAction, lock: number, anim: CharAnim): void {
    this.action = action;
    this.lock = lock;
    this.anim = anim;
    this.animT = 0;
    this.animDur = lock;
  }

  private setAnim(anim: CharAnim): void {
    if (this.anim === anim) return;
    this.anim = anim;
    this.animT = 0;
    this.animDur = 0;
  }

  /** 진행 중인 행동의 예약 판정을 무효화한다 */
  cancel(): void {
    this.token++;
    this.forceT = 0;
  }

  /**
   * 지금 행동에 묶인 지연 실행. 그 사이 행동이 취소되거나(회피·교체) 캐릭터가 쓰러지면 실행되지 않는다.
   * 선딜레이 뒤의 타격 판정에 쓴다.
   */
  after(w: World, delay: number, fn: () => void): void {
    const token = this.token;
    const m = this.active;
    w.after(delay, () => {
      if (token === this.token && !m.dead && this.active === m && !this.wiped) fn();
    });
  }

  /** angle 방향으로 distance만큼 dur초에 걸쳐 밀려간다 (벽에는 막힌다) */
  force(angle: number, distance: number, dur: number): void {
    if (dur <= 0) return;
    this.fvx = (Math.cos(angle) * distance) / dur;
    this.fvy = (Math.sin(angle) * distance) / dur;
    this.forceT = dur;
  }

  /** 스킬이 직접 거는 돌진 (무적 여부 선택) */
  dash(angle: number, distance: number, dur: number, invuln: boolean): void {
    this.force(angle, distance, dur);
    this.action = 'dash';
    this.lock = Math.max(this.lock, dur);
    if (invuln) this.invulnT = Math.max(this.invulnT, dur + 0.05);
  }

  private startBasic(w: World, input: InputState): void {
    const m = this.active;
    const aim = this.resolveAim(w, input, m.range());
    this.facing = aim.angle;
    const lock = m.kit.basic(this.ctx(w, aim));
    this.begin('attack', lock, 'BasicAttack');
  }

  private perform(w: World, input: InputState, a: InputAction): boolean {
    switch (a.type) {
      case 'pet':
        return w.pet.use(w);
      case 'swap':
        return this.swap(w, a.index);
      case 'dodge':
        return this.dodge(w, input);
      case 'active':
        return this.castActive(w, input);
      case 'ult':
        return this.castUlt(w, input);
    }
  }

  private dodge(w: World, input: InputState): boolean {
    if (this.busy || this.dodgeCharges <= 0) return false;
    const angle = input.dirActive ? Math.atan2(input.dirY, input.dirX) : this.facing;
    this.cancel();
    this.dodgeCharges--;
    const dur = db.P('dodge.duration');
    this.force(angle, db.P('dodge.distance'), dur);
    this.invulnT = Math.max(this.invulnT, db.P('dodge.invuln'));
    this.dodging = true;
    this.facing = angle;
    this.begin('dodge', dur, 'Escape');
    const m = this.active;
    if (m.def.attr === 'reverse') m.reverseT = db.P('attr.reverse.duration');
    m.kit.onDodge?.(w, m);
    w.fx.ring(this.x, this.y, 34, 0xffffff, 0.25);
    return true;
  }

  private castActive(w: World, input: InputState): boolean {
    const m = this.active;
    if (this.busy || m.charges <= 0) return false;
    this.cancel();
    const aim = this.resolveAim(w, input, m.range());
    this.facing = aim.angle;
    m.useCharge();
    const lock = m.kit.active(this.ctx(w, aim));
    if (this.action !== 'dash') this.begin('cast', lock, 'ActiveSkill');
    else {
      this.anim = 'ActiveSkill';
      this.animT = 0;
      this.animDur = lock;
      this.lock = Math.max(this.lock, lock);
    }
    return true;
  }

  private castUlt(w: World, input: InputState): boolean {
    const m = this.active;
    if (this.busy || m.ult < db.P('ult.max')) return false;
    this.cancel();
    const aim = this.resolveAim(w, input, m.range());
    this.facing = aim.angle;
    m.ult = 0;
    const lock = m.kit.ult(this.ctx(w, aim));
    if (this.action !== 'dash') this.begin('cast', lock, 'Ultimate');
    else {
      this.anim = 'Ultimate';
      this.animT = 0;
      this.animDur = lock;
      this.lock = Math.max(this.lock, lock);
    }
    // 궁극기 시전 중에는 무적
    this.invulnT = Math.max(this.invulnT, lock);
    w.fx.ring(this.x, this.y, 90, 0xffe9a8, 0.45);
    return true;
  }

  private swap(w: World, index: number): boolean {
    const next = this.members[index];
    if (!next || index === this.cur || next.dead || this.busy || this.swapCd > 0) return false;
    this.cancel();
    this.cur = index;
    this.swapCd = db.P('swap.cooldown');
    this.enter(w, db.P('swap.invuln'));
    return true;
  }

  /** 새 캐릭터가 필드에 나올 때의 공통 처리 */
  private enter(w: World, invuln: number): void {
    const m = this.active;
    this.action = null;
    this.lock = 0;
    this.tagT = 0.3;
    this.invulnT = Math.max(this.invulnT, invuln);
    this.dodging = false;
    this.dodgeCharges = Math.min(this.dodgeCharges, m.stats.dodgeCharges);
    this.setAnim('Idle');
    if (m.def.attr === 'reverse') m.reverseT = db.P('attr.reverse.duration');
    m.kit.onSwapIn?.(w, m);
    w.fx.ring(this.x, this.y, 60, m.def.colors.hair, 0.3);
  }

  /** 필드 캐릭터가 쓰러졌을 때: 다음 캐릭터로 자동 교체, 없으면 전멸 */
  memberDown(w: World): void {
    const m = this.active;
    m.dead = true;
    m.hp = 0;
    this.cancel();
    w.fx.label(this.x, this.y - 78, `${m.def.name} 전투 불능`, 0xff8a8a);
    let next = -1;
    for (let i = 1; i <= this.members.length; i++) {
      const idx = (this.cur + i) % this.members.length;
      if (!this.members[idx].dead) {
        next = idx;
        break;
      }
    }
    if (next < 0) {
      this.wiped = true;
      this.action = null;
      this.anim = 'Death';
      this.animT = 0;
      w.finish('wipe');
      return;
    }
    this.cur = next;
    this.swapCd = 0.5;
    this.enter(w, 1.2);
  }

  /** 무적 시간으로 공격을 흘렸을 때 */
  evaded(w: World): void {
    const m = this.active;
    m.kit.onEvade?.(w, m);
  }

  /** 궁극기 게이지 획득. 필드 캐릭터는 전부, 오프 필드 캐릭터는 일부만 받는다 */
  gainUlt(amount: number): void {
    const max = db.P('ult.max');
    const off = db.pct('ult.offField');
    for (const m of this.members) {
      if (m.dead) continue;
      const field = m === this.active;
      const gain = amount * (field ? 1 + this.aura.ultGain : off) * m.stats.ultGain;
      m.ult = Math.min(max, m.ult + gain);
    }
  }
}
