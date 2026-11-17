// 한 번의 런(괴담 조사) 동안 유지되는 상태. 섹터 사이에 그대로 이어지고, 저장·불러오기의 대상이다.
import { db } from '../../data/tables';

export interface MemberState {
  id: string;
  hp: number;
  dead: boolean;
  ult: number;
}

export interface RunData {
  team: MemberState[];
  petId: string;
  /** 스킬 성장 id → 레벨 */
  upgrades: Record<string, number>;
  shards: number;
  /** 현재(또는 다음에 들어갈) 섹터 번호 */
  sector: number;
  seed: number;
}

export class RunState {
  team: MemberState[];
  petId: string;
  upgrades: Record<string, number>;
  shards: number;
  sector: number;
  seed: number;

  constructor(data: RunData) {
    this.team = data.team;
    this.petId = data.petId;
    this.upgrades = data.upgrades;
    this.shards = data.shards;
    this.sector = data.sector;
    this.seed = data.seed;
  }

  /** 새 런 시작 */
  static create(charIds: string[], petId: string): RunState {
    return new RunState({
      team: charIds.map((id) => ({ id, hp: -1, dead: false, ult: 0 })),
      petId,
      upgrades: {},
      shards: 0,
      sector: 1,
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

  toJSON(): RunData {
    return {
      team: this.team.map((m) => ({ ...m })),
      petId: this.petId,
      upgrades: { ...this.upgrades },
      shards: this.shards,
      sector: this.sector,
      seed: this.seed,
    };
  }

  static fromJSON(data: RunData): RunState | null {
    // 테이블에서 사라진 캐릭터·펫이 들어 있는 저장은 버린다
    if (!data?.team?.length || data.team.some((m) => !db.chars.has(m.id)) || !db.pets.has(data.petId)) return null;
    return new RunState(data);
  }
}
