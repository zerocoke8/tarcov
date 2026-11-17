// 펫: 팀에 1마리 편성하고 펫 스킬 1개를 쓴다 (기획서 6절)
import { db } from '../../data/tables';
import type { PetDef } from '../../data/types';
import type { World } from '../world/World';

type PetSkill = (w: World, pet: Pet) => void;

const SKILLS: Record<string, PetSkill> = {
  /** A 펑이: 가까운 적에게 달려가 자폭 (v1 = 피해 %, v2 = 넉백) */
  A(w, pet) {
    const p = w.party;
    const t = w.nearestEnemy(p.x, p.y, 520);
    const x = t ? t.x : p.x + Math.cos(p.facing) * 160;
    const y = t ? t.y : p.y + Math.sin(p.facing) * 160;
    pet.jumpTo(x, y, 0.45);
    const power = pet.power(w);
    w.after(0.4, () => {
      w.fx.blast(x, y, pet.def.radius, pet.def.color, 0.35);
      w.fx.shake(7);
      w.areaHit(x, y, pet.def.radius, { m: null, mult: (pet.def.v1 / 100) * power, kind: 'pet', knock: pet.def.v2 }, x, y);
    });
  },

  /** B 포근이: 회복 구역 (v1 = 틱당 회복 %, v2 = 틱 간격) */
  B(w, pet) {
    const p = w.party;
    const r = pet.def.radius;
    w.addZone({
      look: 'heal',
      team: 'party',
      x: p.x,
      y: p.y,
      r,
      dur: pet.def.duration * pet.power(w),
      color: pet.def.color,
      tick: pet.def.v2,
      onTick: (z) => {
        if (Math.hypot(p.x - z.x, p.y - z.y) > z.r) return;
        w.heal(p.active, (p.active.stats.maxHp * pet.def.v1) / 100);
      },
    });
  },

  /** C 느릿이: 슬로우 장판 (v1 = 이동 속도 감소 %) */
  C(w, pet) {
    const p = w.party;
    const t = w.nearestEnemy(p.x, p.y, 450);
    const r = pet.def.radius;
    w.addZone({
      look: 'slow',
      team: 'party',
      x: t ? t.x : p.x,
      y: t ? t.y : p.y,
      r,
      dur: pet.def.duration * pet.power(w),
      color: pet.def.color,
      tick: 0.2,
      onTick: (z) => {
        for (const e of w.enemies) {
          if (!e.dead && Math.hypot(e.x - z.x, e.y - z.y) <= z.r + e.r) e.addDebuff('slow', 0.45, pet.def.v1 / 100);
        }
      },
    });
  },

  /** D 든든이: 조준 방향에 방벽 */
  D(w, pet) {
    const p = w.party;
    const cx = p.x + Math.cos(p.facing) * 74;
    const cy = p.y + Math.sin(p.facing) * 74;
    const half = pet.def.radius * 0.5;
    // 바라보는 방향에 수직으로 세운다
    const nx = -Math.sin(p.facing);
    const ny = Math.cos(p.facing);
    w.addBarrier(cx - nx * half, cy - ny * half, cx + nx * half, cy + ny * half, 14, pet.def.duration * pet.power(w));
  },
};

export class Pet {
  readonly def: PetDef;
  cd = 0;
  /** 화면에 보이는 위치 (파티를 따라다닌다) */
  x = 0;
  y = 0;
  private jumpT = 0;
  private jx = 0;
  private jy = 0;

  constructor(id: string, x: number, y: number) {
    this.def = db.pet(id);
    this.x = x - 30;
    this.y = y + 10;
  }

  /** 펫 성장 "재빠른 발"이 반영된 쿨타임 */
  cooldown(w: World): number {
    return this.def.cooldown * Math.max(0.3, 1 - (w.run.lv('p_cd') * db.upgrade('p_cd').v1) / 100);
  }

  /** 펫 성장 "끈기": 지속시간·위력 배율 */
  power(w: World): number {
    return 1 + (w.run.lv('p_power') * db.upgrade('p_power').v1) / 100;
  }

  /** 쿨타임 진행도 0~1 (1 = 사용 가능) */
  ratio(w: World): number {
    return 1 - this.cd / this.cooldown(w);
  }

  jumpTo(x: number, y: number, dur: number): void {
    this.jx = x;
    this.jy = y;
    this.jumpT = dur;
  }

  update(w: World, dt: number): void {
    this.cd = Math.max(0, this.cd - dt);
    const p = w.party;
    let tx = p.x - Math.cos(p.facing) * 42;
    let ty = p.y - Math.sin(p.facing) * 42 + 6;
    let k = Math.min(1, dt * 6);
    if (this.jumpT > 0) {
      this.jumpT -= dt;
      tx = this.jx;
      ty = this.jy;
      k = Math.min(1, dt * 14);
    }
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;

    // 펫 성장 "자율 행동": 싸우는 중이면 준비되는 대로 스스로 쓴다
    if (this.cd <= 0 && w.run.lv('p_auto') > 0 && w.nearestEnemy(p.x, p.y, 420, (e) => e.aggro)) this.use(w);
  }

  use(w: World): boolean {
    if (this.cd > 0 || w.party.wiped) return false;
    this.cd = this.cooldown(w);
    SKILLS[this.def.id]?.(w, this);
    w.fx.label(w.party.x, w.party.y - 86, this.def.name, this.def.color);
    return true;
  }
}
