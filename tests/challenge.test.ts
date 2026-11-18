// 도전 모드(특급 괴이 토벌, 괴이 범람)를 저장된 조사 팀과 테스트용 조사 팀으로 자동 플레이한다.
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import {
  bestRecord,
  buildChallenge,
  challengeLevels,
  challengeMonsters,
  challengeScene,
  challengeTitle,
  raidBoss,
  raidGrade,
  raidRecommend,
  recommendOf,
  recordKey,
  submitRecord,
  type Challenge,
} from '../src/game/run/challenge';
import { makeDeck, runFromDeck, type Deck, type SaveData } from '../src/game/run/save';
import { buildTestDeck, testDecks } from '../src/game/run/testDecks';
import { World } from '../src/game/world/World';
import { runBot } from './helpers/bot';
import { playRun } from './helpers/play';

const ch = (id: string, level = 1): Challenge => ({ def: db.challenge(id), level });

function deckFrom(seed: number, team: string[], petId: string): Deck {
  const { run, outcome } = playRun(seed, 'elite', team, petId);
  expect(outcome).toBe('boss');
  return makeDeck(run, 'boss');
}

function play(deck: Deck, c: Challenge, seed: number): World {
  const rng = new Rng(seed);
  const run = runFromDeck(deck, c.def.season);
  const w = new World(run, buildChallenge(run, c, rng), rng);
  const limit = c.def.kind === 'raid' ? db.P('raid.timeLimit') : db.P('wave.duration');
  runBot(w, limit + 20);
  return w;
}

describe('도전 모드의 컨텐츠', () => {
  it('표에 시즌 1·2의 보스 토벌과 범람이 있다', () => {
    expect(db.challenges.map((c) => c.id)).toEqual(['raid', 'raid2', 'wave']);
    expect(raidBoss(db.challenge('raid')).id).toBe('boss');
    expect(raidBoss(db.challenge('raid2')).id).toBe('witch');
    expect(challengeLevels(db.challenge('raid2'))).toBe(db.P('raid.levels'));
    expect(challengeLevels(db.challenge('wave'))).toBe(1);
  });

  it('이름과 권장 점수', () => {
    expect(challengeTitle(ch('raid2', 3))).toBe('특급 괴이 토벌 · 부서져 가는 마녀 인형 · 난이도 3');
    expect(challengeTitle(ch('wave'))).toBe('괴이 범람');
    expect(recommendOf(ch('raid', 3))).toBe(raidRecommend(3));
    expect(recommendOf(ch('wave'))).toBe(0);
  });

  it('토벌은 그 시즌의 보스 전투장에서 그 시즌의 보스와 싸운다', () => {
    for (const [id, boss, scene] of [['raid', 'boss', 'alley'], ['raid2', 'witch', 'oz_stage']] as const) {
      const c = ch(id, 2);
      const run = runFromDeck(testDecks()[2], c.def.season);
      const setup = buildChallenge(run, c, new Rng(1));
      expect(setup.mode).toBe('raid');
      expect(setup.def.scene).toBe(scene);
      expect(challengeScene(c.def)).toBe(scene);
      const w = new World(run, setup, new Rng(1));
      expect(w.enemies.map((e) => e.def.id)).toEqual([boss]);
      // 난이도가 오르면 보스가 강해진다
      const hard = new World(run, buildChallenge(run, ch(id, 5), new Rng(1)), new Rng(1));
      expect(hard.enemies[0].maxHp).toBeGreaterThan(w.enemies[0].maxHp);
      // 미리 받아 둘 그림: 보스와 보스가 불러내는 몬스터
      expect(challengeMonsters(c.def)).toEqual([boss, ...db.monster(boss).summon.map((m) => m.id)]);
    }
    expect(challengeMonsters(db.challenge('wave'))).toContain('wisp');
  });

  it('기록: 토벌은 짧은 시간이, 범람은 높은 점수가 신기록이다', () => {
    const save: SaveData = { decks: [], run: null, records: {}, wallet: 0, season: 1 };
    const raid = ch('raid', 2);
    expect(submitRecord(save, 'd', raid, 90)).toBe(true);
    expect(submitRecord(save, 'd', raid, 120)).toBe(false);
    expect(submitRecord(save, 'd', raid, 70)).toBe(true);
    expect(save.records[recordKey('d', raid)]).toBe(70);
    const wave = ch('wave');
    expect(submitRecord(save, 'd', wave, 800)).toBe(true);
    expect(submitRecord(save, 'd', wave, 500)).toBe(false);
    expect(submitRecord(save, 'd', wave, 1200)).toBe(true);
    expect(save.records[recordKey('d', wave)]).toBe(1200);
  });

  it('기록의 이름은 예전 저장과 같다 (시즌 1 토벌 "덱:raid:난이도", 범람 "덱:wave")', () => {
    expect(recordKey('d', ch('raid', 3))).toBe('d:raid:3');
    expect(recordKey('d', ch('wave'))).toBe('d:wave');
    expect(recordKey('d', ch('raid2', 3))).toBe('d:raid2:3');
  });

  it('컨텐츠 화면에는 모든 조사 팀을 통틀어 가장 좋은 기록이 나온다', () => {
    const save: SaveData = { decks: [], run: null, records: {}, wallet: 0, season: 1 };
    expect(bestRecord(save, ch('raid', 1))).toBeUndefined();
    submitRecord(save, 'a', ch('raid', 1), 100);
    submitRecord(save, 'b', ch('raid', 1), 80);
    submitRecord(save, 'a', ch('raid', 2), 60);
    // 시즌 2 토벌의 기록은 시즌 1 토벌의 기록과 섞이지 않는다
    submitRecord(save, 'a', ch('raid2', 1), 50);
    submitRecord(save, 'a', ch('wave'), 700);
    submitRecord(save, 'b', ch('wave'), 900);
    expect(bestRecord(save, ch('raid', 1))).toBe(80);
    expect(bestRecord(save, ch('raid', 2))).toBe(60);
    expect(bestRecord(save, ch('raid2', 1))).toBe(50);
    expect(bestRecord(save, ch('raid2', 2))).toBeUndefined();
    expect(bestRecord(save, ch('wave'))).toBe(900);
  });
});

describe('테스트용 조사 팀', () => {
  it('다섯 팀이 있고, 약한 팀부터 강한 팀까지 권장 점수 범위에 걸쳐 있다', () => {
    const decks = testDecks();
    expect(decks.length).toBe(5);
    const scores = decks.map((d) => d.score);
    console.table(decks.map((d) => ({ 이름: d.name, 팀: d.team.join(','), 펫: d.petId, 시즌: d.season, 팀점수: d.score, 성장레벨: Object.values(d.upgrades).reduce((a, b) => a + b, 0), 장비: Object.values(d.equipment).reduce((n, e) => n + Object.keys(e).length, 0) })));
    expect([...scores].sort((a, b) => a - b)).toEqual(scores);
    // 가장 약한 팀은 난이도 1의 권장 점수에 못 미치고, 가장 강한 팀은 가장 높은 난이도의 권장 점수 언저리다
    expect(scores[0]).toBeLessThan(raidRecommend(1));
    expect(scores[4]).toBeGreaterThan(raidRecommend(db.P('raid.levels')) - 200);
    // 두 시즌의 팀이 모두 있다
    expect(new Set(decks.map((d) => d.season))).toEqual(new Set([1, 2]));
    for (const d of decks) {
      expect(d.test).toBe(true);
      expect(d.name).toBeTruthy();
      expect(new Set(d.team).size).toBe(3);
    }
  });

  it('언제 만들어도 같은 빌드가 나온다', () => {
    for (const def of db.testDecks) {
      const a = buildTestDeck(def);
      const b = buildTestDeck(def);
      expect(a.upgrades).toEqual(b.upgrades);
      expect(a.score).toBe(b.score);
      expect(Object.values(a.equipment).flatMap((e) => Object.values(e).map((i) => `${i!.skill}:${i!.rarity}`))).toEqual(
        Object.values(b.equipment).flatMap((e) => Object.values(e).map((i) => `${i!.skill}:${i!.rarity}`)),
      );
    }
  });

  it('빌드를 만든 뒤에도 진행 중이던 시즌이 그대로다', () => {
    db.useSeason(1);
    for (const def of db.testDecks) buildTestDeck(def);
    testDecks();
    expect(db.seasonId).not.toBe(0);
    db.useSeason(2);
    testDecks();
    expect(db.seasonId).toBe(2);
    db.useSeason(1);
  });

  it('시즌 스킬과 장비는 그 팀을 만든 시즌의 것이다', () => {
    for (const d of testDecks()) {
      for (const id of Object.keys(d.upgrades)) {
        const u = db.upgrade(id);
        if (u.category === 'season') expect(u.season, `${d.name} ${id}`).toBe(d.season);
      }
      for (const e of Object.values(d.equipment)) for (const item of Object.values(e)) expect(db.equipSkill(item!.skill).season, d.name).toBe(d.season);
    }
  });
});

describe('도전 모드 자동 플레이', () => {
  const deck = deckFrom(31, ['serin', 'mido', 'sia'], 'B');
  const deck2 = deckFrom(32, ['karen', 'yuna', 'roa'], 'A');

  it('덱에서 되살린 팀은 체력이 가득 차 있고 빌드가 그대로다', () => {
    const run = runFromDeck(deck);
    expect(run.team.every((m) => m.hp < 0 && !m.dead)).toBe(true);
    expect(run.upgrades).toEqual(deck.upgrades);
    expect(run.allItems().length).toBeGreaterThan(0);
    // 저장할 때의 시즌을 기억하고, 도전할 때는 컨텐츠의 시즌에서 싸운다
    expect(deck.season).toBe(1);
    expect(runFromDeck(deck).season).toBe(1);
    expect(runFromDeck(deck, 2).season).toBe(2);
    expect(runFromDeck(deck, 2).upgrades).toEqual(deck.upgrades);
  });

  it('특급 괴이 토벌 (시즌 1): 난이도마다 제한 시간 안에 결과가 난다', () => {
    const rows = [];
    for (const d of [deck, deck2]) {
      for (let level = 1; level <= db.P('raid.levels'); level++) {
        const w = play(d, ch('raid', level), 400 + level);
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

  it('특급 괴이 토벌 (시즌 2 · 마녀 인형): 테스트용 팀 다섯으로 난이도 1·3·5를 돈다', () => {
    const rows = [];
    for (const d of testDecks()) {
      for (const level of [1, 3, 5]) {
        const w = play(d, ch('raid2', level), 600 + level);
        expect(w.over, `${d.name} 난이도 ${level}`).not.toBeNull();
        expect(w.time).toBeLessThanOrEqual(db.P('raid.timeLimit') + 2);
        const boss = w.enemies.find((e) => e.boss);
        rows.push({
          팀: d.name,
          점수: d.score,
          난이도: level,
          결과: w.over,
          시간: Math.round(w.time),
          등급: w.over === 'clear' ? raidGrade(w.time) : '-',
          '보스 남은 체력(%)': boss ? Math.round((boss.hp / boss.maxHp) * 100) : 0,
          받은피해: w.stats.taken,
        });
      }
    }
    console.table(rows);
    // 시즌 1에서 만든 팀도 시즌 2의 보스와 싸울 수 있고, 강한 팀은 난이도 1을 깬다
    expect(rows.filter((r) => r.난이도 === 1 && r.결과 === 'clear').length).toBeGreaterThanOrEqual(2);
  });

  it('괴이 범람: 끝까지 진행되고 점수가 쌓인다', () => {
    const rows = [];
    for (const d of [deck, deck2, testDecks()[3]]) {
      const w = play(d, ch('wave'), 500);
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
});
