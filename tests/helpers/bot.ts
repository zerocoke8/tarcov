// 화면 없이 섹터를 끝까지 플레이해 보는 자동 조작. 규칙 코드가 멈추지 않고 진행되는지,
// 한 섹터에 걸리는 시간과 받는 피해가 어느 정도인지 확인하는 데 쓴다.
import type { Enemy } from '../../src/game/enemy/Enemy';
import type { Thing } from '../../src/game/entities';
import { emptyInput, type InputState } from '../../src/game/input';
import { distToSegment } from '../../src/game/world/collision';
import { FlowField } from '../../src/game/world/flow';
import type { World } from '../../src/game/world/World';

export interface BotResult {
  result: string;
  time: number;
  kills: number;
  dealt: number;
  taken: number;
  packs: string;
  hp: string;
}

export function runBot(w: World, maxSeconds = 300, dt = 1 / 30): BotResult {
  const input: InputState = emptyInput();
  const nav = new FlowField(w.grid);
  const dir = { x: 0, y: 0 };
  const snap = (x: number, y: number): void => {
    const idx = Math.round(Math.atan2(y, x) / (Math.PI / 4));
    input.dirX = Math.cos((idx * Math.PI) / 4);
    input.dirY = Math.sin((idx * Math.PI) / 4);
    input.dirActive = true;
  };
  const walkTo = (x: number, y: number): void => {
    nav.compute(x, y);
    if (nav.dir(w.party.x, w.party.y, dir)) snap(dir.x, dir.y);
    else snap(x - w.party.x || 1, y - w.party.y);
  };

  // 한번 정한 목표는 끝낼 때까지 유지한다. 매번 가장 가까운 것을 다시 고르면
  // 벽을 돌아가는 도중 목표가 바뀌어 제자리를 맴돌게 된다.
  let thing: Thing | undefined;
  let sleeping: Enemy | null = null;

  while (!w.over && w.time < maxSeconds) {
    const p = w.party;
    input.dirActive = false;
    input.dirX = input.dirY = 0;
    input.attack = false;

    const range = p.active.range();
    const fighting = w.nearestEnemy(p.x, p.y, 99999, (e) => e.aggro);
    if (!sleeping || sleeping.dead || sleeping.aggro) sleeping = w.nearestEnemy(p.x, p.y, 99999, (e) => !e.aggro);
    if (!thing || thing.done || thing.locked) {
      thing = w.things
        .filter((t) => !t.done && !t.locked && t.kind !== 'exit')
        .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    }
    const exit = w.things.find((t) => t.kind === 'exit' && !t.locked && !t.done);

    // 곧 터질 공격 예고 안에 있으면 범위 밖으로 회피
    const threat = w.zones.find((z) => {
      if (z.team !== 'enemy' || z.t < z.dur * 0.45) return false;
      if (z.look === 'tele') return Math.hypot(z.x - p.x, z.y - p.y) < z.r + 26;
      if (z.look === 'teleLine') return distToSegment(p.x, p.y, z.x, z.y, z.x2 ?? z.x, z.y2 ?? z.y) < (z.half ?? 8) + 26;
      return false;
    });

    if (threat && p.dodgeCharges > 0 && !p.busy) {
      if (threat.look === 'teleLine') {
        // 예고선에 수직인 방향으로
        snap(-((threat.y2 ?? threat.y) - threat.y), (threat.x2 ?? threat.x) - threat.x);
      } else snap(p.x - threat.x || 1, p.y - threat.y);
      input.actions.push({ type: 'dodge' });
    } else if (
      p.autoTarget ||
      (fighting && Math.hypot(fighting.x - p.x, fighting.y - p.y) < range * 0.9 && w.los(p.x, p.y, fighting.x, fighting.y))
    ) {
      input.attack = true;
      if (p.active.charges > 0) input.actions.push({ type: 'active' });
      if (p.active.ult >= 100) input.actions.push({ type: 'ult' });
      if (w.pet.cd <= 0) input.actions.push({ type: 'pet' });
    } else if (fighting) walkTo(fighting.x, fighting.y);
    else if (thing) walkTo(thing.x, thing.y);
    else if (sleeping) walkTo(sleeping.x, sleeping.y);
    else if (exit) walkTo(exit.x, exit.y);

    // 체력이 낮으면 교체
    if (p.active.hp < p.active.stats.maxHp * 0.3 && p.swapCd <= 0) {
      const idx = p.members.findIndex((m, i) => i !== p.cur && !m.dead && m.hp > m.stats.maxHp * 0.3);
      if (idx >= 0) input.actions.push({ type: 'swap', index: idx });
    }
    w.update(dt, input);
  }

  const q = w.quest();
  return {
    result: w.over ?? 'timeout',
    time: Math.round(w.time),
    kills: w.stats.kills,
    dealt: Math.round(w.stats.dealt),
    taken: Math.round(w.stats.taken),
    packs: `${q.packsCleared}/${q.packsTotal}`,
    hp: w.party.members.map((m) => `${m.def.name} ${Math.round(m.hp)}/${m.stats.maxHp}`).join(', '),
  };
}
