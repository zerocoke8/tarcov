// 팀 점수 (기획서 7.10절)
import { db } from '../../data/tables';
import type { RunState } from './RunState';

export interface ScoreBreakdown {
  upgrades: number;
  equipment: number;
  sectors: number;
  routes: number;
  boss: number;
  total: number;
}

export function teamScore(run: RunState): ScoreBreakdown {
  let upgrades = 0;
  for (const id in run.upgrades) {
    const u = db.upgrades.get(id);
    if (u) upgrades += run.upgrades[id] * db.P(`score.upgrade.t${u.tier}`);
  }
  let equipment = 0;
  for (const { item } of run.allItems()) equipment += db.rarity(item.rarity).score;
  const sectors = run.cleared * db.P('score.sector');
  const routes = run.routeScore;
  const boss = run.bossKilled ? db.P('score.boss') : 0;
  return { upgrades, equipment, sectors, routes, boss, total: upgrades + equipment + sectors + routes + boss };
}
