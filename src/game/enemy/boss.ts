// 괴이(보스) "그믐의 우산" (기획서 8.5절). 페이즈 3단계, 체력 66% / 33%에서 전환한다.
//  1페이즈: 방사형 탄막, 조준 부채꼴 탄, 플레이어 위치 연속 내려찍기
//  2페이즈: + 직선 돌진, 소형 몬스터 소환
//  3페이즈: + 회전 나선 탄막, 패턴 사이 간격 단축
// 패턴 수치는 params.csv의 boss.* 항목에 있다.
import { db } from '../../data/tables';
import { moveCircle } from '../world/collision';
import type { World } from '../world/World';
import type { Enemy } from './Enemy';

type Pattern = 'radial' | 'fan' | 'slam' | 'charge' | 'spiral';

const PATTERNS: Record<number, Pattern[]> = {
  1: ['radial', 'fan', 'slam'],
  2: ['fan', 'charge', 'radial', 'slam'],
  3: ['spiral', 'charge', 'slam', 'fan', 'radial'],
};

const B = (k: string): number => db.P(`boss.${k}`);

function done(e: Enemy): void {
  e.state = 'recover';
  e.t = 0;
}

/** 예약한 동작이 페이즈 전환이나 사망으로 무효가 됐는지 */
function guard(e: Enemy): () => boolean {
  const token = e.vars.token;
  return () => !e.dead && e.vars.token === token;
}

function bullet(w: World, e: Enemy, angle: number, speed = B('bulletSpeed')): void {
  w.shootEnemy(e, angle, speed, 900, 10, (e.atk * B('bulletDmg')) / 100);
}

function startPattern(w: World, e: Enemy, pat: Pattern): void {
  const p = w.party;
  const ok = guard(e);
  const phase = e.vars.phase;
  e.state = 'windup';
  e.setAnim('Pattern');
  // 패턴을 시작할 때마다 운다 (예고 소리)
  w.fx.sound('mon.windup', e.x, e.y, e.def.id);
  const aimAt = (): number => Math.atan2(p.y - e.y, p.x - e.x);

  switch (pat) {
    case 'radial': {
      const n = B('radialCount');
      const ring = (offset: number): void => {
        for (let i = 0; i < n; i++) bullet(w, e, offset + (i / n) * Math.PI * 2);
      };
      w.telegraphCircle(e, e.x, e.y, e.r + 40, 0.6, () => {
        const base = w.rng.range(0, Math.PI * 2);
        ring(base);
        // 2페이즈부터는 어긋난 두 번째 고리가 따라온다
        if (phase >= 2) w.after(0.45, () => ok() && ring(base + Math.PI / n));
        w.after(phase >= 2 ? 0.6 : 0.2, () => ok() && done(e));
      });
      break;
    }
    case 'fan': {
      const volleys = B('fanVolleys');
      const count = B('fanCount');
      for (let v = 0; v < volleys; v++) {
        w.after(0.45 + v * 0.38, () => {
          if (!ok()) return;
          const a = aimAt();
          e.dirX = Math.cos(a);
          e.dirY = Math.sin(a);
          for (let i = 0; i < count; i++) bullet(w, e, a + (i - (count - 1) / 2) * 0.2, B('bulletSpeed') * 1.25);
          if (v === volleys - 1) done(e);
        });
      }
      break;
    }
    case 'slam': {
      const count = B('slamCount');
      const r = B('slamRadius');
      for (let i = 0; i < count; i++) {
        w.after(i * 0.42, () => {
          if (!ok()) return;
          const x = p.x;
          const y = p.y;
          const last = i === count - 1;
          // 예고는 보스가 죽을 때만 취소되도록 주인을 따로 두지 않는다
          w.telegraphCircle(null, x, y, r, B('slamWindup'), () => {
            if (!ok()) return;
            w.fx.blast(x, y, r, 0xff4d6a, 0.3);
            w.fx.shake(6);
            w.fx.sound('mon.slam', x, y, e.def.id);
            if (w.partyInCircle(x, y, r)) w.hurt((e.atk * B('slamDmg')) / 100, e);
            if (last) done(e);
          });
        });
      }
      break;
    }
    case 'charge': {
      const a = aimAt();
      e.dirX = Math.cos(a);
      e.dirY = Math.sin(a);
      const len = B('chargeDist');
      w.telegraphLine(e, e.x, e.y, e.x + e.dirX * len, e.y + e.dirY * len, e.r + 10, e.def.windup, () => {
        e.state = 'act';
        e.t = 0;
        e.vars.hit = 0;
        e.vars.act = 1;
        e.setAnim('MonsterAttack');
      });
      break;
    }
    case 'spiral': {
      e.state = 'act';
      e.t = 0;
      e.vars.act = 2;
      e.vars.spin = w.rng.range(0, Math.PI * 2);
      e.vars.spinT = 0;
      break;
    }
  }
}

function startPhase(w: World, e: Enemy, phase: number): void {
  e.interrupt();
  e.vars.token = (e.vars.token ?? 0) + 1;
  e.vars.phase = phase;
  e.vars.pat = 0;
  e.kx = e.ky = 0;
  e.invuln = true;
  e.state = 'windup';
  e.setAnim('Pattern');
  const ok = guard(e);
  const r = B('shockRadius');
  w.fx.label(e.x, e.y, `페이즈 ${phase}`, 0xff4d6a, e.r * 3);
  w.fx.ring(e.x, e.y, r, 0xff4d6a, 0.6);
  w.fx.sound('boss.phase', e.x, e.y, e.def.id);
  w.telegraphCircle(null, e.x, e.y, r, B('phaseInvuln'), () => {
    if (!ok()) return;
    e.invuln = false;
    w.fx.blast(e.x, e.y, r, 0xff4d6a, 0.4);
    w.fx.shake(12);
    w.fx.sound('boss.burst', e.x, e.y, e.def.id);
    if (w.partyInCircle(e.x, e.y, r)) w.hurt((e.atk * B('shockDmg')) / 100, e);
    // 소환: 보스와 같은 무리에 넣지 않으므로 처치하지 않아도 보스전은 끝난다
    const members = e.def.summon.flatMap((m) =>
      Array.from({ length: m.count }, () => ({ def: db.monster(m.id), grade: m.grade })),
    );
    if (members.length) {
      const pack = w.spawnPack({ x: e.x, y: e.y, gate: false, quality: 0, members });
      w.packs.splice(w.packs.indexOf(pack), 1);
      for (const s of pack.members) {
        s.pack = null;
        w.aggro(s);
      }
    }
    done(e);
  });
}

export function bossAi(w: World, e: Enemy, dt: number): void {
  const p = w.party;
  if (!e.vars.phases) {
    e.vars.phases = 3;
    e.vars.phase = 1;
    e.vars.token = 0;
    e.vars.pat = 0;
    e.cd = 1.4;
  }
  const ratio = e.hp / e.maxHp;
  const want = ratio <= db.pct('boss.phase3') ? 3 : ratio <= db.pct('boss.phase2') ? 2 : 1;
  if (want > e.vars.phase) {
    startPhase(w, e, want);
    return;
  }

  const d = Math.hypot(p.x - e.x, p.y - e.y);
  if (e.state === 'move') {
    // 패턴 사이에는 플레이어와 적당한 거리를 유지하며 다가온다
    if (d > 240) {
      const sp = e.speed();
      moveCircle(w.grid, e, ((p.x - e.x) / d) * sp * dt, ((p.y - e.y) / d) * sp * dt);
      e.setAnim('Move');
    } else e.setAnim('Idle');
    e.dirX = (p.x - e.x) / (d || 1);
    e.dirY = (p.y - e.y) / (d || 1);
    e.cd -= dt;
    if (e.cd <= 0) {
      const list = PATTERNS[e.vars.phase] ?? PATTERNS[1];
      startPattern(w, e, list[e.vars.pat % list.length]);
      e.vars.pat++;
    }
  } else if (e.state === 'act') {
    e.t += dt;
    if (e.vars.act === 1) {
      // 돌진
      const speed = B('chargeSpeed');
      const bx = e.x;
      const by = e.y;
      moveCircle(w.grid, e, e.dirX * speed * dt, e.dirY * speed * dt);
      if (!e.vars.hit && d <= e.r + p.r + 8) {
        e.vars.hit = 1;
        w.hurt((e.atk * B('chargeDmg')) / 100, e);
      }
      const moved = Math.hypot(e.x - bx, e.y - by);
      if (e.t >= B('chargeDist') / speed || moved < speed * dt * 0.3) {
        w.fx.shake(6);
        done(e);
      }
    } else {
      // 회전 나선 탄막
      e.vars.spinT += dt;
      while (e.vars.spinT >= 0.075) {
        e.vars.spinT -= 0.075;
        e.vars.spin += 0.43;
        bullet(w, e, e.vars.spin, B('bulletSpeed') * 0.9);
        bullet(w, e, e.vars.spin + Math.PI, B('bulletSpeed') * 0.9);
      }
      if (e.t >= 2.6) done(e);
    }
  } else if (e.state === 'recover') {
    e.setAnim('Idle');
    e.t += dt;
    if (e.t >= 0.4) {
      e.state = 'move';
      e.cd = B(`gap${e.vars.phase}`);
    }
  }
}
