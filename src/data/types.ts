export type Attr = 'substance' | 'form' | 'nature' | 'reverse';
export type Position = 'striker' | 'leader' | 'support';
export type CharGrade = 'S' | 'A';
export type SkillSlot = 'basic' | 'active' | 'ult' | 'passive';
export type HairStyle = 'bob' | 'twintail' | 'long' | 'short' | 'pony';
/** 플레이스홀더가 무기를 그리는 방식 */
export type WeaponType =
  | 'greatsword'
  | 'gauntlet'
  | 'bow'
  | 'shotgun'
  | 'hammer'
  | 'smg'
  | 'daggers'
  | 'talisman'
  | 'lance';
export const WEAPON_TYPES: readonly WeaponType[] = [
  'greatsword',
  'gauntlet',
  'bow',
  'shotgun',
  'hammer',
  'smg',
  'daggers',
  'talisman',
  'lance',
];
export type MonsterSize = 'S' | 'M' | 'L';
export type SectorType = 'normal' | 'boss' | 'bonus';

export const ATTRS: readonly Attr[] = ['substance', 'form', 'nature', 'reverse'];
export const POSITIONS: readonly Position[] = ['striker', 'leader', 'support'];

export const ATTR_LABEL: Record<Attr, string> = {
  substance: '실체',
  form: '형상',
  nature: '자연',
  reverse: '반전',
};
export const ATTR_COLOR: Record<Attr, number> = {
  substance: 0xf2b08c,
  form: 0x8fd0f5,
  nature: 0x9be08a,
  reverse: 0xff6b6b,
};
export const POS_LABEL: Record<Position, string> = {
  striker: '타격',
  leader: '리더',
  support: '지원',
};

export interface CharColors {
  hair: number;
  hair2: number;
  outfit: number;
  accent: number;
  eye: number;
  skin: number;
}

export interface CharDef {
  id: string;
  name: string;
  grade: CharGrade;
  position: Position;
  attr: Attr;
  weapon: string;
  weaponType: WeaponType;
  hp: number;
  atk: number;
  speed: number;
  /** 추천 타겟 탐색의 기준이 되는 사거리(px) */
  range: number;
  hairStyle: HairStyle;
  colors: CharColors;
  desc: string;
}

export interface SkillDef {
  char: string;
  slot: SkillSlot;
  name: string;
  cooldown: number;
  charges: number;
  /** {키} 자리에 skill_values.csv의 수치가 들어가는 설명 */
  desc: string;
}

export interface MonsterDef {
  id: string;
  name: string;
  size: MonsterSize;
  radius: number;
  hp: number;
  atk: number;
  speed: number;
  ai: string;
  weak: Attr;
  range: number;
  windup: number;
  cooldown: number;
  p1: number;
  p2: number;
  shards: number;
  color: number;
  eye: number;
}

export interface GradeDef {
  grade: number;
  name: string;
  hpMult: number;
  atkMult: number;
  scale: number;
  quality: number;
  shardMult: number;
}

export interface PackMember {
  id: string;
  count: number;
}

export interface PackDef {
  id: string;
  minSector: number;
  maxSector: number;
  weight: number;
  members: PackMember[];
}

export interface SectorDef {
  index: number;
  name: string;
  map: string;
  type: SectorType;
  /** 출구 수호 무리를 뺀 무리 수 */
  packs: number;
  gate: PackMember[];
  loot: number;
  npcChance: number;
  /** 바닥 칸 대비 엄폐 오브젝트 비율 (0~1) */
  density: number;
}

export interface PetDef {
  id: string;
  name: string;
  cooldown: number;
  duration: number;
  radius: number;
  v1: number;
  v2: number;
  color: number;
  desc: string;
}
