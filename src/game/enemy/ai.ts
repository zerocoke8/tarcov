// 몬스터 행동 규칙. monsters.csv의 ai 열 값으로 고른다.
// 모든 공격은 바닥 예고(선 / 원)를 먼저 보여 준 뒤 판정한다.
import { moveCircle } from '../world/collision';
import type { World } from '../world/World';
import type { Enemy } from './Enemy';

type AiFn = (w: World, e: Enemy, dt: number) => void;

const tmp = { x: 0, y: 0 };

/** 플레이어에게 다가간다. 가려져 있으면 길찾기를 따른다 */
function approach(w: World, e: Enemy, dt: number, speedMul = 1): void {
  const p = w.party;
  const dx = p.x - e.x;
  const dy = p.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  let ux = dx / d;
  let uy = dy / d;
  if (!w.los(e.x, e.y, p.x, p.y) && w.flow.dir(e.x, e.y, tmp)) {
    ux = tmp.x;
    uy = tmp.y;
  }
  const sp = e.speed() * speedMul;
  moveCircle(w.grid, e, ux * sp * dt, uy * sp * dt);
  e.dirX = ux;
  e.dirY = uy;
  e.setAnim('Move');
}

/** 플레이어에게서 물러난다 */
function retreat(w: World, e: Enemy, dt: number, speedMul = 1): void {
  const p = w.party;
  const dx = e.x - p.x;
  const dy = e.y - p.y;
  const d = Math.hypot(dx, dy) || 1;
  const sp = e.speed() * speedMul;
  moveCircle(w.grid, e, (dx / d) * sp * dt, (dy / d) * sp * dt);
  e.dirX = -dx / d;
  e.dirY = -dy / d;
  e.setAnim('Move');
}

function faceParty(w: World, e: Enemy): number {
  const ang = Math.atan2(w.party.y - e.y, w.party.x - e.x);
  e.dirX = Math.cos(ang);
  e.dirY = Math.sin(ang);
  return ang;
}

function recover(e: Enemy, dt: number, time: number): void {
  e.t += dt;
  if (e.t >= time) {
    e.state = 'move';
    e.cd = e.def.cooldown;
  }
}

/** 다가와서 근접 공격 (p1 = 타격 반경) */
const chaser: AiFn = (w, e, dt) => {
  const p = w.party;
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  if (e.state === 'move') {
    e.cd -= dt;
    const reach = e.def.range + e.r + p.r;
    if (d <= reach && e.cd <= 0 && w.los(e.x, e.y, p.x, p.y)) {
      const ang = faceParty(w, e);
      const r = e.def.p1 * e.grade.scale;
      const cx = e.x + Math.cos(ang) * (e.r + r * 0.55);
      const cy = e.y + Math.sin(ang) * (e.r + r * 0.55);
      e.state = 'windup';
      e.setAnim('MonsterAttack');
      w.telegraphCircle(e, cx, cy, r, e.def.windup, () => {
        w.fx.blast(cx, cy, r, 0xff5a5a, 0.18);
        if (w.partyInCircle(cx, cy, r)) w.hurt(e.atk, e);
        e.state = 'recover';
        e.t = 0;
      });
    } else if (d > reach * 0.75) approach(w, e, dt);
    else e.setAnim('Idle');
  } else if (e.state === 'recover') recover(e, dt, 0.35);
};

/** 접근 후 예고선을 따라 도약 (p1 = 도약 속도, p2 = 도약 거리) */
const lunger: AiFn = (w, e, dt) => {
  const p = w.party;
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  if (e.state === 'move') {
    e.cd -= dt;
    if (d <= e.def.range && e.cd <= 0 && w.los(e.x, e.y, p.x, p.y)) {
      const ang = faceParty(w, e);
      e.state = 'windup';
      e.setAnim('Idle');
      const len = e.def.p2;
      w.telegraphLine(e, e.x, e.y, e.x + Math.cos(ang) * len, e.y + Math.sin(ang) * len, e.r + 6, e.def.windup, () => {
        e.state = 'act';
        e.t = 0;
        e.vars.hit = 0;
        e.setAnim('MonsterAttack');
      });
    } else if (d > e.def.range * 0.6) approach(w, e, dt);
    else e.setAnim('Idle');
  } else if (e.state === 'act') {
    const speed = e.def.p1;
    moveCircle(w.grid, e, e.dirX * speed * dt, e.dirY * speed * dt);
    e.t += dt;
    if (!e.vars.hit && d <= e.r + p.r + 4) {
      e.vars.hit = 1;
      w.hurt(e.atk, e);
    }
    if (e.t >= e.def.p2 / speed) {
      e.state = 'recover';
      e.t = 0;
    }
  } else if (e.state === 'recover') {
    e.setAnim('Idle');
    recover(e, dt, 0.5);
  }
};

/** 거리를 두고 예고선 방향으로 투사체 발사 (p1 = 투사체 속도, p2 = 유지 거리) */
const shooter: AiFn = (w, e, dt) => {
  const p = w.party;
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  if (e.state === 'move') {
    e.cd -= dt;
    const los = w.los(e.x, e.y, p.x, p.y);
    if (los && d <= e.def.range && e.cd <= 0) {
      const ang = faceParty(w, e);
      const len = e.def.range + 80;
      e.state = 'windup';
      e.setAnim('MonsterAttack');
      w.telegraphLine(e, e.x, e.y, e.x + Math.cos(ang) * len, e.y + Math.sin(ang) * len, 7, e.def.windup, () => {
        w.shootEnemy(e, ang, e.def.p1, len, 9, e.atk);
        e.state = 'recover';
        e.t = 0;
      });
    } else if (!los || d > e.def.range * 0.9) approach(w, e, dt);
    else if (d < e.def.p2 - 50) retreat(w, e, dt, 0.85);
    else {
      faceParty(w, e);
      e.setAnim('Idle');
    }
  } else if (e.state === 'recover') recover(e, dt, 0.3);
};

/** 달라붙어 자폭 (p1 = 폭발 반경). 예고 중에 처치하면 터지지 않는다 */
const bomber: AiFn = (w, e, dt) => {
  const p = w.party;
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  if (e.state === 'move') {
    if (d <= e.def.range + p.r) {
      const r = e.def.p1 * e.grade.scale;
      e.state = 'windup';
      e.setAnim('MonsterAttack');
      w.telegraphCircle(e, e.x, e.y, r, e.def.windup, () => {
        w.fx.blast(e.x, e.y, r, 0xffa64a, 0.3);
        w.fx.shake(6);
        if (w.partyInCircle(e.x, e.y, r)) w.hurt(e.atk, e);
        w.kill(e, null, true);
      });
    } else approach(w, e, dt);
  }
};

export const AI: Record<string, AiFn> = { chaser, lunger, shooter, bomber };
