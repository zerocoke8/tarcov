// 몬스터 행동 규칙. monsters.csv의 ai 열 값으로 고른다.
// 모든 공격은 바닥 예고(선 / 원)를 먼저 보여 준 뒤 판정한다.
import { moveCircle } from '../world/collision';
import type { World } from '../world/World';
import { db } from '../../data/tables';
import { bossAi } from './boss';
import { witchAi } from './witch';
import type { Enemy } from './Enemy';

export type AiFn = (w: World, e: Enemy, dt: number) => void;

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
      e.setAnim('MonsterAttack', e.def.windup + 0.35, e.def.windup);
      w.telegraphCircle(e, cx, cy, r, e.def.windup, () => {
        w.fx.blast(cx, cy, r, 0xff5a5a, 0.18);
        w.fx.sound('mon.swipe', cx, cy, e.def.id);
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
      const len = e.def.p2;
      // 예고 동안 웅크렸다가(동작의 앞부분), 예고가 끝나는 순간 뛰어든다(타격 지점)
      e.setAnim('MonsterAttack', e.def.windup + len / e.def.p1, e.def.windup);
      w.telegraphLine(e, e.x, e.y, e.x + Math.cos(ang) * len, e.y + Math.sin(ang) * len, e.r + 6, e.def.windup, () => {
        e.state = 'act';
        e.t = 0;
        e.vars.hit = 0;
        w.fx.sound('mon.lunge', e.x, e.y, e.def.id);
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
      e.setAnim('MonsterAttack', e.def.windup + 0.3, e.def.windup);
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
      e.setAnim('MonsterAttack', e.def.windup);
      w.telegraphCircle(e, e.x, e.y, r, e.def.windup, () => {
        w.fx.blast(e.x, e.y, r, 0xffa64a, 0.3);
        w.fx.shake(6);
        w.fx.sound('mon.explode', e.x, e.y, e.def.id);
        if (w.partyInCircle(e.x, e.y, r)) w.hurt(e.atk, e);
        w.kill(e, null, true);
      });
    } else approach(w, e, dt);
  }
};

/**
 * 중형 돌격형 (문지기): 멀면 예고선을 따라 돌진, 가까우면 원형 내려찍기.
 * range = 돌진을 시작하는 거리, p1 = 돌진 속도, p2 = 돌진 거리, p3 = 내려찍기 반경, p4 = 내려찍기 예고 시간
 */
const charger: AiFn = (w, e, dt) => {
  const p = w.party;
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  if (e.state === 'move') {
    e.cd -= dt;
    const los = w.los(e.x, e.y, p.x, p.y);
    const slamR = e.def.p3 * e.grade.scale;
    if (e.cd <= 0 && los && d <= slamR * 0.85 + p.r) {
      // 내려찍기
      e.state = 'windup';
      e.setAnim('Pattern', e.def.p4 + 0.8, e.def.p4);
      const x = e.x;
      const y = e.y;
      w.telegraphCircle(e, x, y, slamR, e.def.p4, () => {
        w.fx.blast(x, y, slamR, 0xff7a4a, 0.3);
        w.fx.shake(8);
        w.fx.sound('mon.slam', x, y, e.def.id);
        if (w.partyInCircle(x, y, slamR)) w.hurt(e.atk * 1.2, e);
        e.state = 'recover';
        e.t = 0;
      });
    } else if (e.cd <= 0 && los && d <= e.def.range) {
      // 돌진
      const ang = faceParty(w, e);
      e.state = 'windup';
      const len = e.def.p2;
      e.setAnim('MonsterAttack', e.def.windup + len / e.def.p1, e.def.windup);
      w.telegraphLine(e, e.x, e.y, e.x + Math.cos(ang) * len, e.y + Math.sin(ang) * len, e.r + 8, e.def.windup, () => {
        e.state = 'act';
        e.t = 0;
        e.vars.hit = 0;
        w.fx.sound('mon.charge', e.x, e.y, e.def.id);
      });
    } else if (d > slamR * 0.6) approach(w, e, dt);
    else e.setAnim('Idle');
  } else if (e.state === 'act') {
    const speed = e.def.p1;
    const bx = e.x;
    const by = e.y;
    moveCircle(w.grid, e, e.dirX * speed * dt, e.dirY * speed * dt);
    e.t += dt;
    if (!e.vars.hit && d <= e.r + p.r + 6) {
      e.vars.hit = 1;
      w.hurt(e.atk * 1.4, e);
    }
    // 벽에 막히면 돌진이 끝난다
    const moved = Math.hypot(e.x - bx, e.y - by);
    if (e.t >= e.def.p2 / speed || moved < speed * dt * 0.3) {
      if (moved < speed * dt * 0.3) w.fx.shake(5);
      e.state = 'recover';
      e.t = 0;
    }
  } else if (e.state === 'recover') {
    e.setAnim('Idle');
    recover(e, dt, 0.8);
  }
};

/**
 * 중형 주술형 (주술자): 거리를 두고 지연 폭발 원과 방사형 탄막을 번갈아 쓴다.
 * p1 = 폭발 반경, p2 = 폭발 수, p3 = 방사 탄 수, p4 = 탄속
 */
const caster: AiFn = (w, e, dt) => {
  const p = w.party;
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  if (e.state === 'move') {
    e.cd -= dt;
    const los = w.los(e.x, e.y, p.x, p.y);
    if (e.cd <= 0 && los && d <= e.def.range) {
      e.state = 'windup';
      e.setAnim('Pattern', e.def.windup + 0.5, e.def.windup);
      faceParty(w, e);
      e.vars.n = (e.vars.n ?? 0) + 1;
      if (e.vars.n % 2 === 1) {
        // 지연 폭발: 첫 번째는 플레이어 발밑, 나머지는 그 주변
        const count = Math.max(1, e.def.p2);
        const r = e.def.p1;
        for (let i = 0; i < count; i++) {
          const a = w.rng.range(0, Math.PI * 2);
          const off = i === 0 ? 0 : w.rng.range(70, 150);
          const x = p.x + Math.cos(a) * off;
          const y = p.y + Math.sin(a) * off;
          const last = i === count - 1;
          w.telegraphCircle(e, x, y, r, e.def.windup + i * 0.25, () => {
            w.fx.blast(x, y, r, 0xd9a6ff, 0.3);
            w.fx.sound('mon.curse', x, y, e.def.id);
            if (w.partyInCircle(x, y, r)) w.hurt(e.atk, e);
            if (last) {
              e.state = 'recover';
              e.t = 0;
            }
          });
        }
      } else {
        // 방사형 탄막
        w.telegraphCircle(e, e.x, e.y, e.r + 26, 0.6, () => {
          const n = Math.max(1, e.def.p3);
          const base = w.rng.range(0, Math.PI * 2);
          for (let i = 0; i < n; i++) w.shootEnemy(e, base + (i / n) * Math.PI * 2, e.def.p4, 620, 9, e.atk * 0.8);
          e.state = 'recover';
          e.t = 0;
        });
      }
    } else if (!los || d > e.def.range * 0.85) approach(w, e, dt);
    else if (d < 230) retreat(w, e, dt, 0.9);
    else {
      faceParty(w, e);
      e.setAnim('Idle');
    }
  } else if (e.state === 'recover') recover(e, dt, 0.5);
};

/**
 * 다가가서 빙글 돌며 여러 번 친다 (허수아비).
 * p1 = 회전 반경, p2 = 타격 수, p3 = 도는 시간(초), p4 = 도는 동안의 이동 속도.
 * 도는 동안에도 파티 쪽으로 천천히 따라오므로, 한 번 피했다고 그 자리에 서 있으면 다음 타격에 맞는다
 */
const spinner: AiFn = (w, e, dt) => {
  const p = w.party;
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  const r = e.def.p1 * e.grade.scale;
  if (e.state === 'move') {
    e.cd -= dt;
    if (d <= e.def.range + e.r + p.r && e.cd <= 0 && w.los(e.x, e.y, p.x, p.y)) {
      faceParty(w, e);
      e.state = 'windup';
      // 예고 동안 몸을 비틀어 감고(MonsterAttack), 도는 동안에는 도는 그림(Pattern)을 반복한다
      e.setAnim('MonsterAttack', e.def.windup);
      w.telegraphCircle(e, e.x, e.y, r, e.def.windup, () => {
        e.state = 'act';
        e.t = 0;
        e.vars.hits = 0;
        e.setAnim('Pattern');
      });
    } else if (d > (e.def.range + e.r + p.r) * 0.7) approach(w, e, dt);
    else e.setAnim('Idle');
  } else if (e.state === 'act') {
    e.t += dt;
    const ang = faceParty(w, e);
    moveCircle(w.grid, e, Math.cos(ang) * e.def.p4 * dt, Math.sin(ang) * e.def.p4 * dt);
    const hits = Math.max(1, e.def.p2);
    // 타격은 도는 시간에 고르게 나뉜다
    while (e.vars.hits < hits && e.t >= ((e.vars.hits + 0.5) / hits) * e.def.p3) {
      e.vars.hits++;
      w.fx.play('enemy.spin', e.x, e.y, { size: r, color: e.def.color });
      if (w.partyInCircle(e.x, e.y, r)) w.hurt(e.atk * 0.6, e);
    }
    if (e.t >= e.def.p3) {
      e.state = 'recover';
      e.t = 0;
    }
  } else if (e.state === 'recover') {
    e.setAnim('Idle');
    recover(e, dt, 0.5);
  }
};

/**
 * 다가가서 예고 뒤 크게 내려친다 (양철 나무꾼, 사자 인형).
 * p1 = 타격 반경, p2 = 몸에서 타격 중심까지의 거리 (작으면 자기 둘레를 친다), p3 = 맞은 캐릭터가 휘청거리는 시간(초)
 */
const slammer: AiFn = (w, e, dt) => {
  const p = w.party;
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  if (e.state === 'move') {
    e.cd -= dt;
    const reach = e.def.range + p.r;
    if (d <= reach && e.cd <= 0 && w.los(e.x, e.y, p.x, p.y)) {
      const ang = faceParty(w, e);
      const r = e.def.p1 * e.grade.scale;
      const off = e.def.p2 * e.grade.scale;
      const cx = e.x + Math.cos(ang) * off;
      const cy = e.y + Math.sin(ang) * off;
      e.state = 'windup';
      e.setAnim('MonsterAttack', e.def.windup + 0.7, e.def.windup);
      w.telegraphCircle(e, cx, cy, r, e.def.windup, () => {
        w.fx.play('enemy.slam', cx, cy, { size: r, color: e.def.color, style: e.def.id });
        w.fx.shake(8);
        if (w.partyInCircle(cx, cy, r) && w.hurt(e.atk * 1.3, e) && e.def.p3 > 0) {
          p.active.addBuff({ id: 'daze', label: '휘청', dur: e.def.p3 + 1, speed: -db.pct('daze.slow'), bad: true, key: true, icon: 'speed' });
        }
        e.state = 'recover';
        e.t = 0;
      });
    } else if (d > reach * 0.7) approach(w, e, dt);
    else e.setAnim('Idle');
  } else if (e.state === 'recover') {
    // 내려친 뒤 자세를 푸는 동작이 이 시간 동안 이어진다
    recover(e, dt, 0.7);
  }
};

export const AI: Record<string, AiFn> = { chaser, lunger, shooter, bomber, charger, caster, spinner, slammer, boss: bossAi, witch: witchAi };
