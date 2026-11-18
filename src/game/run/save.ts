// 기기 저장 (localStorage): 파티덱, 진행 중인 런, 덱 컨텐츠 기록
import { db } from '../../data/tables';
import type { Slot } from '../../data/types';
import { RunState, type EquipItem, type Relics, type RunData } from './RunState';
import { teamScore } from './score';

const KEY = 'tarcov.save.v1';

export type DeckOutcome = 'boss' | 'extract';

/** 조사 팀 저장 결과물. 덱 컨텐츠에서는 이 빌드 그대로 싸운다 */
export interface Deck {
  id: string;
  savedAt: number;
  team: string[];
  petId: string;
  upgrades: Record<string, number>;
  equipment: Record<string, Partial<Record<Slot, EquipItem>>>;
  relics: Relics;
  score: number;
  outcome: DeckOutcome;
  /** 클리어한 섹터 수 */
  cleared: number;
}

export interface SaveData {
  decks: Deck[];
  /** 진행 중인 런 (섹터 사이에서 자동 저장) */
  run: RunData | null;
  /** 덱 컨텐츠 최고 기록: "덱id:컨텐츠:난이도" → 값 */
  records: Record<string, number>;
  /** 던전 밖 재화 (은화). 귀중품을 들고 나오면 쌓인다 */
  wallet: number;
}

function empty(): SaveData {
  return { decks: [], run: null, records: {}, wallet: 0 };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw) as Partial<SaveData>;
    const decks = (data.decks ?? []).filter(
      (d) => d.team?.every((id) => db.chars.has(id)) && db.pets.has(d.petId),
    );
    return { decks, run: data.run ?? null, records: data.records ?? {}, wallet: Number(data.wallet) || 0 };
  } catch {
    return empty();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 저장 공간을 쓸 수 없는 환경(시크릿 모드 등)에서는 저장 없이 진행한다
  }
}

export function makeDeck(run: RunState, outcome: DeckOutcome): Deck {
  const data = run.toJSON();
  return {
    id: `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`,
    savedAt: Date.now(),
    team: data.team.map((m) => m.id),
    petId: data.petId,
    upgrades: data.upgrades,
    equipment: data.equipment,
    relics: data.relics,
    score: teamScore(run).total,
    outcome,
    cleared: data.cleared,
  };
}

/** 저장된 덱을 전투·표시에 쓸 수 있는 런 상태로 되살린다 (체력은 가득 찬 상태) */
export function runFromDeck(deck: Deck): RunState {
  const run = RunState.create(deck.team, deck.petId);
  run.upgrades = { ...deck.upgrades };
  run.equipment = JSON.parse(JSON.stringify(deck.equipment));
  run.relics = { ...deck.relics };
  run.cleared = deck.cleared;
  return run;
}

/** 덱을 저장한다. 한도를 넘으면 점수가 가장 낮은 덱부터 지운다 */
export function addDeck(save: SaveData, deck: Deck): void {
  save.decks.unshift(deck);
  const max = db.P('deck.max');
  while (save.decks.length > max) {
    let worst = 0;
    for (let i = 1; i < save.decks.length; i++) if (save.decks[i].score < save.decks[worst].score) worst = i;
    save.decks.splice(worst, 1);
  }
}
