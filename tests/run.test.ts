// 런 전체(편성 → 9섹터 → 보스)를 화면 없이 자동으로 플레이해, 보상·장비·경로·캠프·보스 규칙이
// 끊기지 않고 이어지는지 확인한다.
import { describe, expect, it } from 'vitest';
import { db } from '../src/data/tables';
import { KITS } from '../src/game/player/kits';
import { RunState } from '../src/game/run/RunState';
import { makeDeck } from '../src/game/run/save';
import { teamScore } from '../src/game/run/score';
import { playRun } from './helpers/play';

describe('런 전체 자동 플레이', () => {
  it('캐릭터 9명이 모두 편성 가능하다', () => {
    expect(db.charList.length).toBe(9);
    for (const c of db.charList) expect(KITS[c.id], `${c.id}의 스킬 구현`).toBeDefined();
    // 고유 성장은 캐릭터마다 5개 이상
    for (const c of db.charList) {
      const n = db.upgradeList.filter((u) => u.category === 'unique' && u.owner === c.id).length;
      expect(n, `${c.id}의 고유 성장 수`).toBeGreaterThanOrEqual(5);
    }
  });

  it.each([
    [11, 'normal', ['serin', 'mido', 'sia'], 'B'],
    [12, 'elite', ['serin', 'mido', 'sia'], 'B'],
    [13, 'special', ['serin', 'mido', 'sia'], 'B'],
    [14, 'bonus', ['serin', 'mido', 'sia'], 'B'],
    [21, 'elite', ['karen', 'raon', 'yuna'], 'A'],
    [22, 'elite', ['haru', 'roa', 'eve'], 'C'],
    [23, 'special', ['yuna', 'roa', 'karen'], 'D'],
    [24, 'normal', ['eve', 'haru', 'raon'], 'B'],
  ] as const)('시드 %i, %s 경로, 팀 %j, 펫 %s — 끝까지 진행한다', (seed, routeId, team, petId) => {
    const { run, log, outcome, stuck } = playRun(seed, routeId, [...team], petId);
    const score = teamScore(run);
    console.table(log);
    console.log(
      `결과: ${outcome} · 클리어 섹터 ${run.cleared} · 팀 점수 ${score.total}`,
      score,
      `· 스킬 성장 ${Object.values(run.upgrades).reduce((a, b) => a + b, 0)}레벨 · 장비 ${run.allItems().length}개 · 조각 ${run.shards} · ${Math.round(run.time / 60)}분`,
    );
    expect(outcome, stuck).not.toBe('stuck');
    // 저장 형태로 바꿨다가 되살려도 같은 런이어야 한다
    const restored = RunState.fromJSON(JSON.parse(JSON.stringify(run.toJSON())));
    expect(restored).not.toBeNull();
    expect(teamScore(restored!).total).toBe(score.total);
    if (outcome === 'boss') {
      expect(run.bossKilled).toBe(true);
      expect(run.cleared).toBe(db.lastSector);
      expect(makeDeck(run, 'boss').score).toBe(score.total);
    }
  });
});
