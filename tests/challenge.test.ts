// 파티덱 컨텐츠(특급 괴이 토벌, 괴이 범람)를 저장된 조사 팀으로 자동 플레이한다.
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import { buildChallenge, raidGrade, recordKey, submitRecord, type Challenge } from '../src/game/run/challenge';
import { makeDeck, runFromDeck, type Deck, type SaveData } from '../src/game/run/save';
import { World } from '../src/game/world/World';
import { runBot } from './helpers/bot';
import { playRun } from './helpers/play';

function deckFrom(seed: number, team: string[], petId: string): Deck {
  const { run, outcome } = playRun(seed, 'elite', team, petId);
  expect(outcome).toBe('boss');
  return makeDeck(run, 'boss');
}

function play(deck: Deck, c: Challenge, seed: number): World {
  const rng = new Rng(seed);
  const run = runFromDeck(deck);
  const w = new World(run, buildChallenge(run, c, rng), rng);
  const limit = c.kind === 'raid' ? db.P('raid.timeLimit') : db.P('wave.duration');
  runBot(w, limit + 20);
  return w;
}

describe('파티덱 컨텐츠', () => {
  const deck = deckFrom(31, ['serin', 'mido', 'sia'], 'B');
  const deck2 = deckFrom(32, ['karen', 'yuna', 'roa'], 'A');

  it('덱에서 되살린 팀은 체력이 가득 차 있고 빌드가 그대로다', () => {
    const run = runFromDeck(deck);
    expect(run.team.every((m) => m.hp < 0 && !m.dead)).toBe(true);
    expect(run.upgrades).toEqual(deck.upgrades);
    expect(run.allItems().length).toBeGreaterThan(0);
  });

  it('특급 괴이 토벌: 난이도마다 제한 시간 안에 결과가 난다', () => {
    const rows = [];
    for (const d of [deck, deck2]) {
      for (let level = 1; level <= db.P('raid.levels'); level++) {
        const w = play(d, { kind: 'raid', level }, 400 + level);
        expect(w.over, `난이도 ${level}`).not.toBeNull();
        expect(w.time).toBeLessThanOrEqual(db.P('raid.timeLimit') + 2);
        rows.push({
          팀: d.team.join(','),
          점수: d.score,
          난이도: level,
          결과: w.over,
          시간: Math.round(w.time),
          등급: w.over === 'clear' ? raidGrade(w.time) : '-',
          받은피해: w.stats.taken,
        });
      }
    }
    console.table(rows);
    // 완성된 덱이면 난이도 1은 깰 수 있어야 한다
    expect(rows[0].결과).toBe('clear');
  });

  it('괴이 범람: 끝까지 진행되고 점수가 쌓인다', () => {
    const rows = [];
    for (const d of [deck, deck2]) {
      const w = play(d, { kind: 'wave' }, 500);
      expect(w.over).not.toBeNull();
      expect(w.score).toBeGreaterThan(0);
      rows.push({
        팀: d.team.join(','),
        결과: w.over,
        시간: Math.round(w.time),
        단계: w.waveStage + 1,
        처치: w.stats.kills,
        점수: Math.floor(w.score),
        받은피해: w.stats.taken,
      });
    }
    console.table(rows);
  });

  it('기록: 토벌은 짧은 시간이, 범람은 높은 점수가 신기록이다', () => {
    const save: SaveData = { decks: [], run: null, records: {}, wallet: 0 };
    const raid: Challenge = { kind: 'raid', level: 2 };
    expect(submitRecord(save, 'd', raid, 90)).toBe(true);
    expect(submitRecord(save, 'd', raid, 120)).toBe(false);
    expect(submitRecord(save, 'd', raid, 70)).toBe(true);
    expect(save.records[recordKey('d', raid)]).toBe(70);
    const wave: Challenge = { kind: 'wave' };
    expect(submitRecord(save, 'd', wave, 800)).toBe(true);
    expect(submitRecord(save, 'd', wave, 500)).toBe(false);
    expect(submitRecord(save, 'd', wave, 1200)).toBe(true);
    expect(save.records[recordKey('d', wave)]).toBe(1200);
  });
});
