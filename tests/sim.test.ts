import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import { RunState } from '../src/game/run/RunState';
import { buildSector, getLayout } from '../src/game/run/sector';
import { TILE } from '../src/game/world/layout';
import { buildPlan, walkDistances } from '../src/game/world/placement';
import { World } from '../src/game/world/World';
import { runBot } from './helpers/bot';

describe('수치 테이블', () => {
  it('모든 테이블을 읽는다', () => {
    expect(db.charList.length).toBeGreaterThanOrEqual(3);
    expect(db.sectors.length).toBeGreaterThanOrEqual(1);
    expect(db.skillDesc('serin', 'active')).toContain('280');
  });
});

describe('맵과 무작위 배치', () => {
  it.each(db.mapNames)('%s: 어떤 배치에서도 모든 목적지에 걸어갈 수 있다', (name) => {
    const layout = getLayout(name);
    for (let seed = 1; seed <= 40; seed++) {
      const plan = buildPlan(
        layout,
        { density: 0.14, packs: 4, loot: 5, npcChance: 1, packMinFromStart: 8, packMinApart: 6 },
        new Rng(seed),
      );
      const start = { x: Math.floor(plan.start.x / TILE), y: Math.floor(plan.start.y / TILE) };
      const d = walkDistances(plan.solid, plan.w, plan.h, start);
      const goals = [...plan.packs, ...plan.loot, ...plan.waves];
      if (plan.exit) goals.push(plan.exit);
      if (plan.npc) goals.push(plan.npc);
      for (const g of goals) {
        const i = Math.floor(g.y / TILE) * plan.w + Math.floor(g.x / TILE);
        expect(d[i], `${name} seed ${seed}`).toBeGreaterThanOrEqual(0);
      }
      // 통로와 표식 주변에는 오브젝트가 없어야 한다
      for (const p of plan.props) {
        if (p.kind === 'pillar') continue;
        for (let y = p.ty; y < p.ty + p.th; y++) {
          for (let x = p.tx; x < p.tx + p.tw; x++) expect(layout.keep[y * layout.w + x]).toBe(0);
        }
      }
    }
  });
});

describe('섹터 자동 플레이', () => {
  it('섹터 1을 멈춤 없이 끝까지 진행한다', () => {
    const results = [];
    for (let seed = 1; seed <= 5; seed++) {
      const run = RunState.create(['serin', 'mido', 'sia'], 'B');
      const rng = new Rng(seed);
      const w = new World(run, buildSector(run, db.sector(1), rng), rng);
      const r = runBot(w);
      results.push(r);
      expect(r.result, JSON.stringify(r)).not.toBe('timeout');
    }
    console.table(results);
  });
});
