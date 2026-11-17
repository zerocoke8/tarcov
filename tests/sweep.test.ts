// 무작위 팀·펫·경로로 런을 여러 번 돌려, 어떤 조합에서도 진행이 멈추지 않는지 확인한다.
// (몬스터나 파티가 벽에 끼는 종류의 문제를 잡는다. 멈추면 그때의 상황을 출력한다.)
import { expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import { campRest, chooseRoute, onSectorClear } from '../src/game/run/flow';
import { applyReward, rollChoices, type Reward } from '../src/game/run/rewards';
import { RunState } from '../src/game/run/RunState';
import { buildSector, currentSectorDef } from '../src/game/run/sector';
import { TILE } from '../src/game/world/layout';
import { World } from '../src/game/world/World';
import { runBot } from './helpers/bot';

function take(run: RunState, reward: Reward): void {
  if (reward.type === 'upgrade') return void applyReward(run, reward);
  const slot = reward.item.slot;
  const target = [...run.team].sort(
    (a, b) => (run.equipment[a.id]?.[slot]?.rarity ?? 0) - (run.equipment[b.id]?.[slot]?.rarity ?? 0),
  )[0];
  applyReward(run, reward, target.id);
}

it('무작위 조합 40회: 어떤 런도 멈추지 않는다', () => {
  const ids = db.charList.map((c) => c.id);
  let stuck = 0;
  let wipes = 0;
  for (let seed = 100; seed < 140; seed++) {
    const rng = new Rng(seed);
    const team = rng.shuffle([...ids]).slice(0, 3);
    const run = RunState.create(team, rng.pick(['A', 'B', 'C', 'D']), 'form');
    const routeId = rng.pick(['normal', 'elite', 'special']);
    for (let guard = 0; guard < 30; guard++) {
      const def = currentSectorDef(run);
      const w = new World(run, buildSector(run, def, rng), rng);
      w.events.onThing = (t) => {
        if (t.kind === 'chest') {
          take(run, rollChoices(run, rng, t.quality)[0]);
          w.refreshTeam();
        }
      };
      const r = runBot(w, 420);
      if (r.result === 'timeout') {
        stuck++;
        const p = w.party;
        const tile = (x: number, y: number): string => `(${Math.floor(x / TILE)},${Math.floor(y / TILE)})`;
        console.log(
          `\n[멈춤] seed ${seed} 팀 ${team.join(',')} 섹터 ${def.index} ${routeId}. 파티 ${tile(p.x, p.y)} ${p.active.def.id} action=${p.action} anim=${p.anim} hp=${Math.round(p.active.hp)} target=${p.autoTarget?.def.id ?? '-'}`,
        );
        console.log(
          '남은 적:',
          w.enemies
            .filter((e) => !e.dead)
            .map((e) => `${e.def.id}${tile(e.x, e.y)} ag=${e.aggro ? 1 : 0} ${e.state} hp=${e.hp} stun=${e.stunT.toFixed(1)} los=${w.los(p.x, p.y, e.x, e.y) ? 1 : 0}`)
            .join(' | '),
        );
        console.log(
          '남은 것:',
          w.things
            .filter((t) => !t.done)
            .map((t) => `${t.kind}${tile(t.x, t.y)} lock=${t.locked ? 1 : 0}`)
            .join(' | '),
        );
        const tx = Math.floor(p.x / TILE);
        const ty = Math.floor(p.y / TILE);
        let out = '';
        for (let y = ty - 6; y <= ty + 6; y++) {
          for (let x = tx - 12; x <= tx + 12; x++) {
            const solid = x < 0 || y < 0 || x >= w.grid.w || y >= w.grid.h || w.grid.solid[y * w.grid.w + x];
            const enemy = w.enemies.find((e) => !e.dead && Math.floor(e.x / TILE) === x && Math.floor(e.y / TILE) === y);
            out += x === tx && y === ty ? '@' : enemy ? 'e' : solid ? '#' : '.';
          }
          out += '\n';
        }
        console.log(out);
        break;
      }
      if (r.result === 'wipe') {
        wipes++;
        break;
      }
      if (def.type !== 'boss') take(run, rollChoices(run, rng, 1)[0]);
      const res = onSectorClear(run, def, rng);
      if (res.camp) campRest(run);
      if (res.step.kind === 'end') break;
      if (res.step.kind === 'route') {
        const options = res.step.options;
        chooseRoute(run, options.find((o) => o.id === routeId) ?? options[0]);
      }
    }
  }
  console.log(`런 40회: 멈춤 ${stuck}회, 전멸 ${wipes}회`);
  expect(stuck).toBe(0);
}, 600000);
