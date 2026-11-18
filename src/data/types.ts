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
  /** 조준 방식. dpad = D패드 방향으로 공격(근거리), auto = 항상 추천 타겟을 자동 조준(원거리) */
  aim: 'dpad' | 'auto';
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
  p3: number;
  p4: number;
  shards: number;
  color: number;
  eye: number;
  /** 보스가 페이즈 전환 때 부르는 몬스터 */
  summon: PackMember[];
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
  /** 0 일반, 1 정예, 2 특급 */
  grade: number;
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
  /** 클리어 후 체크포인트 캠프에 들르는지 */
  camp: boolean;
}

export type UpgradeCategory = 'unique' | 'season' | 'pet';

/** 스킬 성장: 캐릭터 고유 / 시즌 스킬(팀·포지션) / 펫 */
export interface UpgradeDef {
  id: string;
  category: UpgradeCategory;
  /** 고유: 캐릭터 id · 시즌: team 또는 포지션 · 펫: pet */
  owner: string;
  plan: string;
  name: string;
  max: number;
  /** 1 일반, 2 희귀, 3 영웅 */
  tier: number;
  v1: number;
  v2: number;
  v3: number;
  desc: string;
}

export type Slot = 'weapon' | 'armor' | 'acc';
export const SLOTS: readonly Slot[] = ['weapon', 'armor', 'acc'];
export const SLOT_LABEL: Record<Slot, string> = { weapon: '무기', armor: '방어구', acc: '악세서리' };

/** 장비 스킬: 캐릭터 스킬과 무관하게 장비 자체로 작동한다 */
export interface EquipSkillDef {
  id: string;
  slot: Slot;
  name: string;
  /** 희귀도 배율이 곱해지는 대표 수치 */
  v1: number;
  v2: number;
  cooldown: number;
  chance: number;
  /** 착용 캐릭터가 오프 필드여도 적용되는지 */
  team: boolean;
  desc: string;
}

export type OptStat =
  | 'atk'
  | 'hp'
  | 'critRate'
  | 'critDmg'
  | 'aspd'
  | 'basicDmg'
  | 'activeDmg'
  | 'ultDmg'
  | 'guard'
  | 'speed'
  | 'cdr'
  | 'ultGain';
export const OPT_STATS: readonly OptStat[] = [
  'atk',
  'hp',
  'critRate',
  'critDmg',
  'aspd',
  'basicDmg',
  'activeDmg',
  'ultDmg',
  'guard',
  'speed',
  'cdr',
  'ultGain',
];

export interface EquipOptionDef {
  slot: Slot;
  stat: OptStat;
  main: boolean;
  min: number;
  max: number;
  label: string;
}

export interface RarityDef {
  rarity: number;
  name: string;
  skillMult: number;
  options: number;
  optMult: number;
  refund: number;
  score: number;
  color: string;
  /** 보상 품질 1~3에서의 등장 가중치 */
  weights: [number, number, number];
}

export interface ObjectDef {
  id: string;
  name: string;
  weight: number;
  v1: number;
  v2: number;
  desc: string;
}

/** 귀중품: 던전에서 주워 가방에 담고, 런을 끝내고 나가면 은화로 바뀐다 */
export interface ValuableDef {
  id: string;
  name: string;
  /** 1 평범 / 2 희귀 / 3 진귀 / 4 전설 */
  tier: number;
  /** 은화로 바꿀 때의 가치 */
  value: number;
  weight: number;
  desc: string;
}

/** 저주: 귀중품을 무리해서 챙길 때 걸리는 불이익 */
export interface CurseDef {
  id: string;
  name: string;
  stat: 'dmgTaken' | 'atk' | 'speed' | 'maxHp' | 'critRate';
  /** 변화량(%). 치명타 확률은 %p */
  value: number;
  desc: string;
}

/** 괴이 범람에서 한 번에 나타나는 무리 */
export interface WaveDef {
  /** 이 무리가 나오기 시작하는 웨이브 단계 (0부터) */
  stage: number;
  weight: number;
  members: PackMember[];
}

export interface RouteDef {
  id: string;
  name: string;
  grade: number;
  packBonus: number;
  eliteChance: number;
  special: number;
  statMult: number;
  shardMult: number;
  quality: number;
  score: number;
  desc: string;
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
