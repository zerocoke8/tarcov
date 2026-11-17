// 화면 없이 섹터를 끝까지 플레이해 보는 자동 조작. 규칙 코드가 멈추지 않고 진행되는지,
// 한 섹터에 걸리는 시간과 받는 피해가 어느 정도인지 확인하는 데 쓴다.
import { emptyInput, type InputState } from '../../src/game/input';
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

  while (!w.over && w.time < maxSeconds) {
    const p = w.party;
    input.dirActive = false;
    input.dirX = input.dirY = 0;
    input.attack = false;

    const enemy = w.nearestEnemy(p.x, p.y, 99999);
    const exit = w.things.find((t) => t.kind === 'exit' && !t.locked && !t.done);
    const range = p.active.range();
    const threat = w.zones.find(
      (z) => z.team === 'enemy' && z.look === 'tele' && Math.hypot(z.x - p.x, z.y - p.y) < z.r + 24 && z.t > z.dur * 0.5,
    );

    if (threat && p.dodgeCharges > 0 && !p.busy) {
      // 예고 범위 안이면 범위 밖으로 회피
      snap(p.x - threat.x || 1, p.y - threat.y);
      input.actions.push({ type: 'dodge' });
    } else if (p.autoTarget || (enemy && Math.hypot(enemy.x - p.x, enemy.y - p.y) < range * 0.9 && w.los(p.x, p.y, enemy.x, enemy.y))) {
      input.attack = true;
      if (p.active.charges > 0) input.actions.push({ type: 'active' });
      if (p.active.ult >= 100) input.actions.push({ type: 'ult' });
      if (w.pet.cd <= 0) input.actions.push({ type: 'pet' });
    } else {
      const goal = enemy ?? exit;
      if (goal) {
        nav.compute(goal.x, goal.y);
        if (nav.dir(p.x, p.y, dir)) snap(dir.x, dir.y);
        else snap(goal.x - p.x, goal.y - p.y);
      }
    }
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
