// 도전 모드 = 파티덱 컨텐츠 (기획서 9절): 저장된 조사 팀으로 도전한다. 덱의 빌드는 고정이며 컨텐츠 안에서는 성장하지 않는다.
// 어떤 컨텐츠가 있는지는 data/challenges.csv 에 있다.
//  - 특급 괴이 토벌 (raid): 그 시즌의 강화된 보스 1체와 타임어택. 난이도 단계 선택, 클리어 타임에 따라 등급
//  - 괴이 범람 (wave): 닫힌 전투장에서 계속 몰려오는 웨이브를 버티며 점수를 쌓는다
import type { Rng } from '../../core/rng';
import { db } from '../../data/tables';
import type { ChallengeDef, MonsterDef, SectorDef } from '../../data/types';
import { buildPlan } from '../world/placement';
import type { RunState } from './RunState';
import type { SaveData } from './save';
import { getLayout, type SectorSetup } from './sector';

/** 고른 도전: 컨텐츠와 난이도. 난이도가 없는 컨텐츠(범람)는 1 */
export interface Challenge {
  def: ChallengeDef;
  level: number;
}

/** 컨텐츠의 난이도 단계 수 */
export const challengeLevels = (def: ChallengeDef): number => (def.kind === 'raid' ? db.P('raid.levels') : 1);

/** 토벌이 열리는 보스 섹터 */
const raidSector = (def: ChallengeDef): SectorDef => db.sectorsOf(def.season).find((s) => s.type === 'boss')!;

/** 토벌의 대상 (그 시즌의 보스) */
export const raidBoss = (def: ChallengeDef): MonsterDef => db.monster(raidSector(def).gate[0].id);

/** 화면에 보여 줄 이름: "특급 괴이 토벌 · 그믐의 우산 · 난이도 3", "괴이 범람" */
export function challengeTitle(c: Challenge): string {
  return c.def.kind === 'raid' ? `${c.def.name} · ${raidBoss(c.def).name} · 난이도 ${c.level}` : c.def.name;
}

/** 특급 괴이 토벌의 권장 팀 점수 */
export function raidRecommend(level: number): number {
  return db.P('raid.recommendBase') + db.P('raid.recommendPerLevel') * (level - 1);
}

/** 이 도전의 권장 팀 점수 (없으면 0) */
export const recommendOf = (c: Challenge): number => (c.def.kind === 'raid' ? raidRecommend(c.level) : 0);

/** 클리어 타임에 따른 등급 */
export function raidGrade(seconds: number): 'S' | 'A' | 'B' {
  if (seconds <= db.P('raid.gradeS')) return 'S';
  if (seconds <= db.P('raid.gradeA')) return 'A';
  return 'B';
}

/** 기록 이름의 뒷부분: "raid:3", "wave". 앞에 덱 id 가 붙는다 */
const recordTail = (c: Challenge): string => (challengeLevels(c.def) > 1 ? `${c.def.id}:${c.level}` : c.def.id);

export const recordKey = (deckId: string, c: Challenge): string => `${deckId}:${recordTail(c)}`;

/** 토벌은 짧은 시간이, 범람은 높은 점수가 좋은 기록이다 */
const better = (c: Challenge, value: number, prev: number | undefined): boolean => prev === undefined || (c.def.kind === 'raid' ? value < prev : value > prev);

/** 기록을 갱신한다. 신기록이면 true */
export function submitRecord(save: SaveData, deckId: string, c: Challenge, value: number): boolean {
  const key = recordKey(deckId, c);
  if (!better(c, value, save.records[key])) return false;
  save.records[key] = value;
  return true;
}

/** 이 도전에서 모든 조사 팀을 통틀어 가장 좋은 기록 (없으면 undefined) */
export function bestRecord(save: SaveData, c: Challenge): number | undefined {
  const tail = `:${recordTail(c)}`;
  let best: number | undefined;
  for (const [key, value] of Object.entries(save.records)) {
    // 덱 id 에는 ":" 가 없으므로, 첫 ":" 뒤가 통째로 같아야 같은 도전의 기록이다
    if (key.slice(key.indexOf(':')) === tail && better(c, value, best)) best = value;
  }
  return best;
}

/** 이 도전에 나오는 몬스터의 id (그림을 미리 받아 두는 데 쓴다) */
export function challengeMonsters(def: ChallengeDef): string[] {
  const ids = new Set<string>();
  if (def.kind === 'raid') for (const m of raidSector(def).gate) ids.add(m.id);
  else for (const w of db.waves) for (const m of w.members) ids.add(m.id);
  // 보스가 불러내는 몬스터
  for (const id of [...ids]) for (const m of db.monster(id).summon) ids.add(m.id);
  return [...ids];
}

/** 이 도전이 열리는 곳의 맵 그림 세트 */
export const challengeScene = (def: ChallengeDef): string => (def.kind === 'raid' ? raidSector(def).scene : def.scene);

export function buildChallenge(_run: RunState, c: Challenge, rng: Rng): SectorSetup {
  const normal = db.route('normal');
  if (c.def.kind === 'raid') {
    // 그 시즌의 보스 전투장을 쓴다
    const def: SectorDef = { ...raidSector(c.def), index: 0, name: challengeTitle(c) };
    const plan = buildPlan(
      getLayout(def.map),
      { density: 0, packs: 0, loot: 0, npcChance: 0, packMinFromStart: 0, packMinApart: 0 },
      rng,
    );
    const gate = plan.packs.find((p) => p.gate);
    const lv = c.level - 1;
    return {
      def,
      route: normal,
      plan,
      spawns: gate
        ? [
            {
              x: gate.x,
              y: gate.y,
              gate: true,
              quality: 0,
              members: def.gate.flatMap((m) => Array.from({ length: m.count }, () => ({ def: db.monster(m.id), grade: m.grade }))),
            },
          ]
        : [],
      loot: [],
      npc: null,
      // 보스가 부르는 몬스터도 난이도에 맞춰 강해진다
      hpMult: 1.6 + lv * 0.4,
      atkMult: 1.3 + lv * 0.15,
      shardMult: 0,
      mode: 'raid',
      timeLimit: db.P('raid.timeLimit'),
      bossHpMult: 1 + lv * db.pct('raid.hpPerLevel'),
      bossAtkMult: 1 + lv * db.pct('raid.atkPerLevel'),
      rewardQuality: 1,
      mushrooms: [],
      surprise: null,
      surpriseSpot: null,
    };
  }

  const def: SectorDef = {
    season: c.def.season,
    scene: c.def.scene,
    depth: 0,
    fog: 0,
    index: 0,
    name: challengeTitle(c),
    map: c.def.map,
    type: 'normal',
    packs: 0,
    gate: [],
    loot: 0,
    npcChance: 0,
    density: 0.05,
    camp: false,
  };
  const plan = buildPlan(
    getLayout(def.map),
    { density: def.density, packs: 0, loot: 0, npcChance: 0, packMinFromStart: 0, packMinApart: 0 },
    rng,
  );
  return {
    def,
    route: normal,
    plan,
    spawns: [],
    loot: [],
    npc: null,
    hpMult: 1,
    atkMult: 1,
    shardMult: 0,
    mode: 'wave',
    timeLimit: db.P('wave.duration'),
    bossHpMult: 1,
    bossAtkMult: 1,
    rewardQuality: 1,
    mushrooms: [],
    surprise: null,
    surpriseSpot: null,
  };
}
