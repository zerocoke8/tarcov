// 시즌 2의 괴이(보스) "부서져 가는 마녀 인형". 불을 두른 채 발레를 추듯 싸운다.
// 페이즈 3단계, 체력이 witch.phase2 / witch.phase3 (%) 아래로 내려갈 때 전환한다.
//  1페이즈: 회전 공격(근접), 불 던지기(원거리), 불기둥(자리에 불바닥이 남는다)
//  2페이즈: + 불의 잔상 2개(본체의 공격을 따라 한다), 불의 파도(넓은 직선)
//  3페이즈: + 필살기 (주저앉아 웃으며 주변에 폭발을 여러 번 부른다)
// 불에 맞으면 화상(지속 피해)이 걸린다. 패턴 수치는 params.csv의 witch.* 항목에 있다.
import { db } from '../../data/tables';
import type { Zone } from '../entities';
import { moveCircle } from '../world/collision';
import type { World } from '../world/World';
import type { Enemy } from './Enemy';

type Pattern = 'spin' | 'fire' | 'pillar' | 'clones' | 'wave' | 'finale';

const PATTERNS: Record<number, Pattern[]> = {
  1: ['spin', 'fire', 'pillar'],
  2: ['clones', 'fire', 'wave', 'spin', 'pillar'],
  3: ['finale', 'wave', 'clones', 'fire', 'pillar', 'spin'],
};

const W = (k: string): number => db.P(`witch.${k}`);
const FIRE = 0xff8a3c;

/** 지금 떠 있는 잔상들 (보스 한 마리당) */
const clones = new WeakMap<Enemy, Zone[]>();
const liveClones = (e: Enemy): Zone[] => (clones.get(e) ?? []).filter((z) => !z.dead);

function done(e: Enemy): void {
  e.state = 'recover';
  e.t = 0;
}

/** 예약한 동작이 페이즈 전환이나 사망으로 무효가 됐는지 */
function guard(e: Enemy): () => boolean {
  const token = e.vars.token;
  return () => !e.dead && e.vars.token === token;
}

/** 불로 입히는 피해: 맞으면 화상이 걸린다. mult 는 공격력에 대한 % */
function burnHit(w: World, e: Enemy, mult: number): void {
  if (w.hurt((e.atk * mult) / 100, e)) w.afflict('burn', W('burn.time'), W('burn.dot'));
}

/** (x, y)에서 회전 공격: 예고 뒤 둘레를 여러 번 친다 */
function spinAt(w: World, e: Enemy, x: number, y: number, mult: number, ok: () => boolean, onEnd?: () => void): void {
  const r = W('spin.radius');
  const hits = W('spin.hits');
  w.telegraphCircle(null, x, y, r, 0.7, () => {
    if (!ok()) return;
    for (let i = 0; i < hits; i++) {
      w.after(i * 0.26, () => {
        if (!ok()) return;
        w.fx.play('fire.burst', x, y, { size: r, color: FIRE });
        if (w.partyInCircle(x, y, r)) burnHit(w, e, W('spin.dmg') * mult);
        if (i === hits - 1) onEnd?.();
      });
    }
  });
}

/** (x, y)에서 파티 쪽으로 불을 부채꼴로 던진다 */
function fireFrom(w: World, e: Enemy, x: number, y: number, count: number, mult: number): void {
  const p = w.party;
  const a = Math.atan2(p.y - y, p.x - x);
  for (let i = 0; i < count; i++) {
    const shot = w.shootEnemy(e, a + (i - (count - 1) / 2) * 0.24, W('fire.speed'), 900, 13, (e.atk * W('fire.dmg') * mult) / 100);
    shot.x = x;
    shot.y = y;
    shot.color = FIRE;
    shot.look = 'fire';
    shot.onHitParty = () => w.afflict('burn', W('burn.time'), W('burn.dot'));
  }
}

/** (x, y)에 불기둥: 예고 뒤 터지고, 그 자리에 불바닥이 남는다 */
function pillarAt(w: World, e: Enemy, x: number, y: number, ok: () => boolean, onEnd?: () => void): void {
  const r = W('pillar.radius');
  w.telegraphCircle(null, x, y, r, W('pillar.windup'), () => {
    if (!ok()) return;
    w.fx.play('fire.burst', x, y, { size: r, color: FIRE });
    w.fx.shake(6);
    if (w.partyInCircle(x, y, r)) burnHit(w, e, W('pillar.dmg'));
    w.addZone({
      look: 'burn',
      team: 'enemy',
      x,
      y,
      r: r * 0.8,
      dur: W('pillar.burnTime'),
      color: FIRE,
      tick: 0.5,
      onTick: (z) => {
        if (w.partyInCircle(z.x, z.y, z.r)) w.afflict('burn', W('burn.time'), W('pillar.burnDot'));
      },
    });
    onEnd?.();
  });
}

function startPattern(w: World, e: Enemy, pat: Pattern): void {
  const p = w.party;
  const ok = guard(e);
  e.state = 'windup';
  e.setAnim('Pattern');
  const cloneMult = W('clone.dmg') / 100;

  switch (pat) {
    case 'spin': {
      // 파티에게 바짝 붙은 뒤 돈다. 잔상도 제자리에서 따라 돈다
      e.vars.act = 1;
      e.state = 'act';
      e.t = 0;
      break;
    }
    case 'fire': {
      const volleys = e.vars.phase >= 2 ? 3 : 2;
      for (let v = 0; v < volleys; v++) {
        w.after(0.5 + v * 0.55, () => {
          if (!ok()) return;
          const a = Math.atan2(p.y - e.y, p.x - e.x);
          e.dirX = Math.cos(a);
          e.dirY = Math.sin(a);
          fireFrom(w, e, e.x, e.y, W('fire.count'), 1);
          for (const c of liveClones(e)) fireFrom(w, e, c.x, c.y, 1, cloneMult);
          if (v === volleys - 1) done(e);
        });
      }
      break;
    }
    case 'pillar': {
      // 파티가 선 자리와, 움직이는 쪽으로 조금 앞선 자리에 떨어뜨린다
      const count = e.vars.phase >= 2 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        w.after(i * 0.5, () => {
          if (!ok()) return;
          const lead = i === 0 ? 0 : 90;
          pillarAt(w, e, p.x + Math.cos(p.facing) * lead, p.y + Math.sin(p.facing) * lead, ok, i === count - 1 ? () => done(e) : undefined);
        });
      }
      break;
    }
    case 'clones': {
      // 불의 잔상: 보스 양옆에 서서 얼마 동안 본체의 공격을 따라 한다
      for (const c of liveClones(e)) c.dead = true;
      const n = W('clone.count');
      const list: Zone[] = [];
      w.fx.label(e.x, e.y - e.r * 3, '불의 잔상', FIRE);
      for (let i = 0; i < n; i++) {
        const z = w.addZone({ look: 'clone', team: 'enemy', x: e.x, y: e.y, r: e.r, dur: W('clone.time'), color: FIRE, owner: e });
        z.tag = i;
        list.push(z);
        w.fx.play('fire.burst', e.x, e.y, { size: e.r * 2, color: FIRE });
      }
      clones.set(e, list);
      w.after(0.8, () => ok() && done(e));
      break;
    }
    case 'wave': {
      const a = Math.atan2(p.y - e.y, p.x - e.x);
      e.dirX = Math.cos(a);
      e.dirY = Math.sin(a);
      const len = W('wave.length');
      const half = W('wave.half');
      const x2 = e.x + e.dirX * len;
      const y2 = e.y + e.dirY * len;
      const x1 = e.x;
      const y1 = e.y;
      w.telegraphLine(e, x1, y1, x2, y2, half, W('wave.windup'), () => {
        if (!ok()) return;
        w.fx.play('fire.wave', x1, y1, { x2, y2, size: half, color: FIRE });
        w.fx.shake(10);
        if (w.partyInLine(x1, y1, x2, y2, half)) burnHit(w, e, W('wave.dmg'));
        done(e);
      });
      break;
    }
    case 'finale': {
      // 필살기: 주저앉아 웃으며 주변에 폭발을 여러 번 부른다. 이 동안 보스는 움직이지 않는다 (공격할 틈)
      const count = W('finale.count');
      const r = W('finale.radius');
      w.fx.label(e.x, e.y - e.r * 3, '막이 내린다', FIRE);
      for (let i = 0; i < count; i++) {
        w.after(0.6 + i * W('finale.gap'), () => {
          if (!ok()) return;
          // 셋 중 하나는 파티가 선 자리, 나머지는 그 둘레의 무작위 자리
          const aimed = i % 3 === 0;
          const a = w.rng.range(0, Math.PI * 2);
          const d = aimed ? 0 : w.rng.range(120, 300);
          const x = p.x + Math.cos(a) * d;
          const y = p.y + Math.sin(a) * d;
          const last = i === count - 1;
          w.telegraphCircle(null, x, y, r, W('finale.windup'), () => {
            if (!ok()) return;
            w.fx.play('fire.burst', x, y, { size: r, color: FIRE });
            if (w.partyInCircle(x, y, r)) burnHit(w, e, W('finale.dmg'));
            if (last) done(e);
          });
        });
      }
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
  const r = 240;
  w.fx.label(e.x, e.y - e.r * 3, `페이즈 ${phase}`, FIRE);
  w.fx.ring(e.x, e.y, r, FIRE, 0.6);
  w.telegraphCircle(null, e.x, e.y, r, 1.6, () => {
    if (!ok()) return;
    e.invuln = false;
    w.fx.play('fire.burst', e.x, e.y, { size: r, color: FIRE });
    w.fx.shake(12);
    if (w.partyInCircle(e.x, e.y, r)) burnHit(w, e, 120);
    // 소환: 보스와 같은 무리에 넣지 않으므로 처치하지 않아도 보스전은 끝난다
    const members = e.def.summon.flatMap((m) => Array.from({ length: m.count }, () => ({ def: db.monster(m.id), grade: m.grade })));
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

export function witchAi(w: World, e: Enemy, dt: number): void {
  const p = w.party;
  if (!e.vars.phases) {
    e.vars.phases = 3;
    e.vars.phase = 1;
    e.vars.token = 0;
    e.vars.pat = 0;
    e.cd = 1.6;
  }
  // 잔상은 보스의 양옆에 붙어 다닌다
  const live = liveClones(e);
  live.forEach((z) => {
    const side = (z.tag ?? 0) % 2 === 0 ? 1 : -1;
    const a = Math.atan2(e.dirY, e.dirX) + (Math.PI / 2) * side;
    const tx = e.x + Math.cos(a) * 150;
    const ty = e.y + Math.sin(a) * 150;
    z.x += (tx - z.x) * Math.min(1, dt * 5);
    z.y += (ty - z.y) * Math.min(1, dt * 5);
  });

  const ratio = e.hp / e.maxHp;
  const want = ratio <= db.pct('witch.phase3') ? 3 : ratio <= db.pct('witch.phase2') ? 2 : 1;
  if (want > e.vars.phase) {
    startPhase(w, e, want);
    return;
  }

  const d = Math.hypot(p.x - e.x, p.y - e.y) || 1;
  if (e.state === 'move') {
    // 패턴 사이: 우아하게 걸어 거리를 좁힌다. 멀면 발레 도약으로 단숨에 다가온다
    if (d > 420) {
      const sp = e.speed() * 3.2;
      moveCircle(w.grid, e, ((p.x - e.x) / d) * sp * dt, ((p.y - e.y) / d) * sp * dt);
      e.setAnim('Move');
    } else if (d > 230) {
      const sp = e.speed();
      moveCircle(w.grid, e, ((p.x - e.x) / d) * sp * dt, ((p.y - e.y) / d) * sp * dt);
      e.setAnim('Move');
    } else e.setAnim('Idle');
    e.dirX = (p.x - e.x) / d;
    e.dirY = (p.y - e.y) / d;
    e.cd -= dt;
    if (e.cd <= 0) {
      const list = PATTERNS[e.vars.phase] ?? PATTERNS[1];
      startPattern(w, e, list[e.vars.pat % list.length]);
      e.vars.pat++;
    }
  } else if (e.state === 'act') {
    // 회전 공격: 0.45초 동안 파티에게 달려든 뒤 그 자리에서 돈다
    e.t += dt;
    if (e.vars.act === 1) {
      if (e.t < 0.45 && d > e.r + p.r + 30) {
        const sp = e.speed() * 3;
        moveCircle(w.grid, e, ((p.x - e.x) / d) * sp * dt, ((p.y - e.y) / d) * sp * dt);
        e.setAnim('Move');
      } else {
        e.vars.act = 0;
        e.state = 'windup';
        e.setAnim('MonsterAttack');
        const ok = guard(e);
        spinAt(w, e, e.x, e.y, 1, ok, () => done(e));
        for (const c of live) spinAt(w, e, c.x, c.y, W('clone.dmg') / 100, ok);
      }
    }
  } else if (e.state === 'recover') {
    e.setAnim('Idle');
    e.t += dt;
    if (e.t >= 0.4) {
      e.state = 'move';
      e.cd = W('rest') * (e.vars.phase >= 3 ? 0.75 : 1);
    }
  }
}
