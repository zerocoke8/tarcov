// 한 번의 런(괴담 조사) 동안 유지되는 상태. 섹터 사이에 그대로 이어지고, 저장·불러오기의 대상이다.
import { db } from '../../data/tables';
import type { BagItem } from './valuables';
import { ATTRS, type Attr, type OptStat, type Slot } from '../../data/types';

export interface MemberState {
  id: string;
  /** -1이면 최대 체력으로 시작 */
  hp: number;
  dead: boolean;
  ult: number;
}

/** 장비 1개 = 장비 스킬 1개 + 능력치 옵션 */
export interface EquipItem {
  uid: string;
  slot: Slot;
  /** equipment_skills.csv의 id */
  skill: string;
  /** 1 일반 ~ 4 전설. 장비 스킬 레벨이기도 하다 */
  rarity: number;
  /** 능력치 옵션 (값은 % 단위) */
  opts: { stat: OptStat; v: number }[];
}

/** 괴담의 잔재로 얻은 팀 능력치 (획득 횟수) */
export interface Relics {
  atk: number;
  hp: number;
  crit: number;
}

export interface RunData {
  /** 시즌 번호 (seasons.csv) */
  season: number;
  team: MemberState[];
  petId: string;
  /** 스킬 성장 id → 레벨 */
  upgrades: Record<string, number>;
  /** 캐릭터 id → 슬롯별 장비 */
  equipment: Record<string, Partial<Record<Slot, EquipItem>>>;
  relics: Relics;
  /** 귀중품 가방 (기획서 7.12절) */
  bag: BagItem[];
  /** 런이 끝날 때까지 남는 저주의 id 목록 */
  curses: string[];
  shards: number;
  /** 지금 진행 중인(또는 다음에 들어갈) 본편 섹터 번호 */
  sector: number;
  /** 그 섹터에 적용되는 경로 */
  route: string;
  /** 그 섹터의 클리어 보상 품질 (1~3). 0이면 경로의 것을 따른다. 가려진 선택지는 위험과 보상이 따로 정해진다 */
  routeReward: number;
  /** 가려진 선택지를 골라 들어가는지 */
  routeHidden: boolean;
  /** 본편 섹터에 앞서 보너스 맵을 먼저 들르는지 */
  bonus: boolean;
  /** 이번 런 보스의 약점 속성 */
  bossWeak: Attr;
  /** 클리어한 본편 섹터 수 */
  cleared: number;
  /** 위험한 경로를 골라 얻은 팀 점수 */
  routeScore: number;
  bossKilled: boolean;
  kills: number;
  time: number;
  seed: number;
}

export class RunState implements RunData {
  season!: number;
  team!: MemberState[];
  petId!: string;
  upgrades!: Record<string, number>;
  equipment!: Record<string, Partial<Record<Slot, EquipItem>>>;
  relics!: Relics;
  bag!: BagItem[];
  curses!: string[];
  shards!: number;
  sector!: number;
  route!: string;
  routeReward!: number;
  routeHidden!: boolean;
  bonus!: boolean;
  bossWeak!: Attr;
  cleared!: number;
  routeScore!: number;
  bossKilled!: boolean;
  kills!: number;
  time!: number;
  seed!: number;

  constructor(data: RunData) {
    Object.assign(this, data);
    // 예전 저장에는 시즌이 없다 (시즌 1)
    this.season = db.season(this.season ?? 1).id;
    // 섹터·무리·시즌 스킬·장비·귀중품 조회가 이 런의 시즌을 따르게 한다
    db.useSeason(this.season);
  }

  /** 새 런 시작 */
  static create(charIds: string[], petId: string, bossWeak?: Attr, season = 1): RunState {
    return new RunState({
      season,
      team: charIds.map((id) => ({ id, hp: -1, dead: false, ult: 0 })),
      petId,
      upgrades: {},
      equipment: {},
      relics: { atk: 0, hp: 0, crit: 0 },
      bag: [],
      curses: [],
      shards: 0,
      sector: 1,
      route: 'normal',
      routeReward: 0,
      routeHidden: false,
      bonus: false,
      bossWeak: bossWeak ?? ATTRS[Math.floor(Math.random() * ATTRS.length)],
      cleared: 0,
      routeScore: 0,
      bossKilled: false,
      kills: 0,
      time: 0,
      seed: (Math.random() * 0xffffffff) >>> 0,
    });
  }

  /** 스킬 성장 레벨 (없으면 0) */
  lv(id: string): number {
    return this.upgrades[id] ?? 0;
  }

  has(charId: string): boolean {
    return this.team.some((m) => m.id === charId);
  }

  addUpgrade(id: string, levels = 1): void {
    const def = db.upgrade(id);
    this.upgrades[id] = Math.min(def.max, this.lv(id) + levels);
  }

  /** 장비를 장착하고, 그 슬롯에 있던 장비를 돌려준다 */
  equip(charId: string, item: EquipItem): EquipItem | undefined {
    const slots = (this.equipment[charId] ??= {});
    const old = slots[item.slot];
    slots[item.slot] = item;
    return old;
  }

  itemsOf(charId: string): EquipItem[] {
    return Object.values(this.equipment[charId] ?? {}).filter((i): i is EquipItem => !!i);
  }

  allItems(): { charId: string; item: EquipItem }[] {
    return this.team.flatMap((m) => this.itemsOf(m.id).map((item) => ({ charId: m.id, item })));
  }

  /** 팀이 가진 장비 중 해당 장비 스킬의 가장 높은 희귀도 (없으면 0). "팀 공통" 장비 스킬에 쓴다 */
  teamSkillRarity(skillId: string): number {
    let best = 0;
    for (const { item } of this.allItems()) if (item.skill === skillId) best = Math.max(best, item.rarity);
    return best;
  }

  toJSON(): RunData {
    return JSON.parse(
      JSON.stringify({
        season: this.season,
        team: this.team,
        petId: this.petId,
        upgrades: this.upgrades,
        equipment: this.equipment,
        relics: this.relics,
        bag: this.bag,
        curses: this.curses,
        shards: this.shards,
        sector: this.sector,
        route: this.route,
        routeReward: this.routeReward,
        routeHidden: this.routeHidden,
        bonus: this.bonus,
        bossWeak: this.bossWeak,
        cleared: this.cleared,
        routeScore: this.routeScore,
        bossKilled: this.bossKilled,
        kills: this.kills,
        time: this.time,
        seed: this.seed,
      }),
    ) as RunData;
  }

  /** 저장된 런을 되살린다. 테이블에서 사라진 캐릭터·펫·성장·장비 스킬이 들어 있으면 버린다 */
  static fromJSON(data: RunData | null | undefined): RunState | null {
    if (!data?.team?.length || !db.pets.has(data.petId)) return null;
    if (data.team.some((m) => !db.chars.has(m.id))) return null;
    if (Object.keys(data.upgrades ?? {}).some((id) => !db.upgrades.has(id))) return null;
    const run = new RunState({
      ...RunState.create(
        data.team.map((m) => m.id),
        data.petId,
        undefined,
        data.season ?? 1,
      ).toJSON(),
      ...data,
      season: data.season ?? 1,
    });
    if (run.allItems().some(({ item }) => !db.equipSkills.has(item.skill))) return null;
    // 표에서 사라진 귀중품·저주는 버린다 (이전 저장에는 가방이 없을 수도 있다)
    run.bag = (run.bag ?? []).filter((it) => db.valuables.has(it.id)).map((it) => ({ id: it.id, taint: it.taint && db.curses.has(it.taint) ? it.taint : null }));
    run.curses = (run.curses ?? []).filter((id) => db.curses.has(id));
    return run;
  }
}
