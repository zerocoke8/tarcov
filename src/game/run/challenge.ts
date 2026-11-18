// 파티덱 컨텐츠 (기획서 9절): 저장된 조사 팀으로 도전한다. 덱의 빌드는 고정이며 컨텐츠 안에서는 성장하지 않는다.
//  - 특급 괴이 토벌: 강화 보스 1체와 타임어택. 난이도 단계 선택, 클리어 타임에 따라 등급
//  - 괴이 범람: 닫힌 전투장에서 계속 몰려오는 웨이브를 버티며 점수를 쌓는다
import type { Rng } from '../../core/rng';
import { db } from '../../data/tables';
import type { SectorDef } from '../../data/types';
import { buildPlan } from '../world/placement';
import type { RunState } from './RunState';
import type { SaveData } from './save';
import { getLayout, type SectorSetup } from './sector';

export type Challenge = { kind: 'raid'; level: number } | { kind: 'wave' };

export const RAID_NAME = '특급 괴이 토벌';
export const WAVE_NAME = '괴이 범람';

/** 특급 괴이 토벌의 권장 팀 점수 */
export function raidRecommend(level: number): number {
  return db.P('raid.recommendBase') + db.P('raid.recommendPerLevel') * (level - 1);
}

/** 클리어 타임에 따른 등급 */
export function raidGrade(seconds: number): 'S' | 'A' | 'B' {
  if (seconds <= db.P('raid.gradeS')) return 'S';
  if (seconds <= db.P('raid.gradeA')) return 'A';
  return 'B';
}

export const recordKey = (deckId: string, c: Challenge): string =>
  c.kind === 'raid' ? `${deckId}:raid:${c.level}` : `${deckId}:wave`;

/** 기록을 갱신한다. 신기록이면 true (토벌은 짧은 시간, 범람은 높은 점수가 좋다) */
export function submitRecord(save: SaveData, deckId: string, c: Challenge, value: number): boolean {
  const key = recordKey(deckId, c);
  const prev = save.records[key];
  const better = prev === undefined || (c.kind === 'raid' ? value < prev : value > prev);
  if (better) save.records[key] = value;
  return better;
}

export function buildChallenge(_run: RunState, c: Challenge, rng: Rng): SectorSetup {
  const normal = db.route('normal');
  if (c.kind === 'raid') {
    // 덱 컨텐츠는 시즌 1의 보스 전투장을 쓴다
    const base = db.sectorsOf(1).find((s) => s.type === 'boss')!;
    const def: SectorDef = { ...base, index: 0, name: `${RAID_NAME} · 난이도 ${c.level}` };
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
    season: 1,
    scene: 'alley',
    depth: 0,
    fog: 0,
    index: 0,
    name: WAVE_NAME,
    map: 'arena_wave',
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
