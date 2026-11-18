// data/ 폴더의 CSV 수치 테이블을 읽어 검사한 뒤 게임에서 쓰는 형태로 바꾼다.
// 값이 빠졌거나 숫자가 아니면 DataError에 "어느 파일 몇 번째 줄"인지 모아서 던진다.
import { csvRecords, type CsvRow } from '../core/csv';
import { hexToNum } from '../core/math';
import {
  ATTRS,
  OPT_STATS,
  POSITIONS,
  SLOTS,
  WEAPON_TYPES,
  type Attr,
  type CharDef,
  type EquipOptionDef,
  type EquipSkillDef,
  type GradeDef,
  type HairStyle,
  type MonsterDef,
  type MonsterSize,
  type CurseDef,
  type ObjectDef,
  type ValuableDef,
  type OptStat,
  type PackDef,
  type PackMember,
  type PetDef,
  type Position,
  type RarityDef,
  type RouteDef,
  type SectorDef,
  type SectorType,
  type SkillDef,
  type SkillSlot,
  type Slot,
  type UpgradeCategory,
  type UpgradeDef,
  type WaveDef,
  type WeaponType,
} from './types';

const csvFiles = import.meta.glob('/data/*.csv', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;
const mapFiles = import.meta.glob('/data/maps/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;

export class DataError extends Error {
  constructor(public problems: string[]) {
    super('수치 테이블 오류\n' + problems.join('\n'));
    this.name = 'DataError';
  }
}

const problems: string[] = [];

class Row {
  constructor(
    private file: string,
    private row: CsvRow,
  ) {}

  private fail(col: string, msg: string): void {
    problems.push(`${this.file} ${this.row.line}번째 줄 [${col}]: ${msg}`);
  }

  str(col: string): string {
    const v = this.row.cells[col];
    if (v === undefined || v === '') {
      this.fail(col, '값이 비어 있습니다');
      return '';
    }
    return v;
  }

  opt(col: string, fallback = ''): string {
    const v = this.row.cells[col];
    return v === undefined || v === '' ? fallback : v;
  }

  num(col: string, fallback?: number): number {
    const v = this.row.cells[col];
    if (v === undefined || v === '') {
      if (fallback !== undefined) return fallback;
      this.fail(col, '값이 비어 있습니다');
      return 0;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) {
      this.fail(col, `숫자가 아닙니다 → "${v}"`);
      return 0;
    }
    return n;
  }

  oneOf<T extends string>(col: string, allowed: readonly T[]): T {
    const v = this.str(col);
    if (v && !allowed.includes(v as T)) {
      this.fail(col, `"${v}"는 쓸 수 없습니다. 가능한 값: ${allowed.join(', ')}`);
      return allowed[0];
    }
    return v as T;
  }

  color(col: string): number {
    return hexToNum(this.colorText(col));
  }

  colorText(col: string): string {
    const v = this.str(col);
    if (v && !/^#[0-9a-fA-F]{6}$/.test(v)) {
      this.fail(col, `색은 #rrggbb 형식이어야 합니다 → "${v}"`);
      return '#ffffff';
    }
    return v || '#ffffff';
  }

  /** "wisp:3|eye:1@1" 형식의 무리 구성 (몬스터id:수@등급) */
  members(col: string, allowEmpty = false): PackMember[] {
    const v = this.opt(col);
    if (!v) {
      if (!allowEmpty) this.fail(col, '값이 비어 있습니다');
      return [];
    }
    const out: PackMember[] = [];
    for (const part of v.split('|')) {
      const m = /^\s*(\w+)\s*(?::\s*(\d+))?\s*(?:@\s*(\d+))?\s*$/.exec(part);
      if (!m) {
        this.fail(col, `"몬스터id:수@등급" 형식이 아닙니다 → "${part}"`);
        continue;
      }
      out.push({ id: m[1], count: m[2] ? Number(m[2]) : 1, grade: m[3] ? Number(m[3]) : 0 });
    }
    return out;
  }

  error(col: string, msg: string): void {
    this.fail(col, msg);
  }
}

function table(name: string): Row[] {
  const file = `${name}.csv`;
  const text = csvFiles[`/data/${file}`];
  if (text === undefined) {
    problems.push(`${file}: 파일이 없습니다`);
    return [];
  }
  return csvRecords(text).rows.map((r) => new Row(file, r));
}

function keyValues(name: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of table(name)) {
    const key = r.str('key');
    if (out.has(key)) r.error('key', `"${key}"가 두 번 나옵니다`);
    out.set(key, r.num('value'));
  }
  return out;
}

/** id가 겹치지 않는지 보면서 Map에 담는다 */
function put<T extends { id: string }>(map: Map<string, T>, r: Row, def: T): void {
  if (map.has(def.id)) r.error('id', `"${def.id}"가 두 번 나옵니다`);
  map.set(def.id, def);
}

// ---- 읽기 ----------------------------------------------------------------

const params = keyValues('params');
const skillValues = keyValues('skill_values');

const chars = new Map<string, CharDef>();
for (const r of table('characters')) {
  put(chars, r, {
    id: r.str('id'),
    name: r.str('name'),
    grade: r.oneOf('grade', ['S', 'A'] as const),
    position: r.oneOf<Position>('position', POSITIONS),
    attr: r.oneOf<Attr>('attr', ATTRS),
    weapon: r.str('weapon'),
    weaponType: r.oneOf<WeaponType>('weaponType', WEAPON_TYPES),
    aim: r.oneOf<'dpad' | 'auto'>('aim', ['dpad', 'auto']),
    muzzle: { x: r.num('muzzleX', 20), y: r.num('muzzleY', 24) },
    hp: r.num('hp'),
    atk: r.num('atk'),
    speed: r.num('speed'),
    range: r.num('range'),
    hairStyle: r.oneOf<HairStyle>('hairStyle', ['bob', 'twintail', 'long', 'short', 'pony']),
    colors: {
      hair: r.color('hair'),
      hair2: r.color('hair2'),
      outfit: r.color('outfit'),
      accent: r.color('accent'),
      eye: r.color('eye'),
      skin: r.color('skin'),
    },
    desc: r.opt('desc'),
  });
}

const skills = new Map<string, SkillDef>();
for (const r of table('skills')) {
  const def: SkillDef = {
    char: r.str('char'),
    slot: r.oneOf<SkillSlot>('slot', ['basic', 'active', 'ult', 'passive']),
    name: r.str('name'),
    cooldown: r.num('cooldown', 0),
    charges: r.num('charges', 0),
    desc: r.opt('desc'),
  };
  if (def.char && !chars.has(def.char)) r.error('char', `characters.csv에 없는 캐릭터입니다 → "${def.char}"`);
  for (const m of def.desc.matchAll(/\{([\w.]+)\}/g)) {
    const key = `${def.char}.${def.slot}.${m[1]}`;
    if (!skillValues.has(key)) r.error('desc', `skill_values.csv에 "${key}"가 없습니다`);
  }
  skills.set(`${def.char}.${def.slot}`, def);
}
for (const c of chars.values()) {
  for (const slot of ['basic', 'active', 'ult', 'passive'] as const) {
    if (!skills.has(`${c.id}.${slot}`)) problems.push(`skills.csv: ${c.id}의 ${slot} 스킬이 없습니다`);
  }
}

const monsters = new Map<string, MonsterDef>();
const monsterRows = table('monsters');
for (const r of monsterRows) {
  put(monsters, r, {
    id: r.str('id'),
    name: r.str('name'),
    size: r.oneOf<MonsterSize>('size', ['S', 'M', 'L']),
    radius: r.num('radius'),
    hp: r.num('hp'),
    atk: r.num('atk'),
    speed: r.num('speed'),
    ai: r.str('ai'),
    weak: r.oneOf<Attr>('weak', ATTRS),
    range: r.num('range', 0),
    windup: r.num('windup', 0),
    cooldown: r.num('cooldown', 0),
    p1: r.num('p1', 0),
    p2: r.num('p2', 0),
    p3: r.num('p3', 0),
    p4: r.num('p4', 0),
    shards: r.num('shards', 0),
    color: r.color('color'),
    eye: r.color('eye'),
    summon: r.members('summon', true),
  });
}

function checkMembers(r: Row, col: string, list: PackMember[]): void {
  for (const m of list) {
    if (!monsters.has(m.id)) r.error(col, `monsters.csv에 없는 몬스터입니다 → "${m.id}"`);
  }
}
monsterRows.forEach((r, i) => checkMembers(r, 'summon', [...monsters.values()][i]?.summon ?? []));

const grades: GradeDef[] = table('grades').map((r) => ({
  grade: r.num('grade'),
  name: r.str('name'),
  hpMult: r.num('hpMult'),
  atkMult: r.num('atkMult'),
  scale: r.num('scale'),
  quality: r.num('quality'),
  shardMult: r.num('shardMult'),
}));

const packs: PackDef[] = table('packs').map((r) => {
  const def: PackDef = {
    id: r.str('id'),
    minSector: r.num('minSector', 1),
    maxSector: r.num('maxSector', 99),
    weight: r.num('weight', 1),
    members: r.members('members'),
  };
  checkMembers(r, 'members', def.members);
  return def;
});

const mapTexts = new Map<string, string>();
for (const [path, text] of Object.entries(mapFiles)) {
  const name = path.split('/').pop()!.replace(/\.txt$/, '');
  mapTexts.set(name, text);
}

const sectors: SectorDef[] = table('sectors').map((r) => {
  const def: SectorDef = {
    index: r.num('index'),
    name: r.str('name'),
    map: r.str('map'),
    type: r.oneOf<SectorType>('type', ['normal', 'boss', 'bonus']),
    packs: r.num('packs', 0),
    gate: r.members('gate', true),
    loot: r.num('loot', 0),
    npcChance: r.num('npcChance', 0),
    density: r.num('density', 0),
    camp: r.num('camp', 0) === 1,
  };
  checkMembers(r, 'gate', def.gate);
  if (def.map && !mapTexts.has(def.map)) r.error('map', `data/maps/${def.map}.txt 파일이 없습니다`);
  return def;
});

const pets = new Map<string, PetDef>();
for (const r of table('pets')) {
  put(pets, r, {
    id: r.str('id'),
    name: r.str('name'),
    cooldown: r.num('cooldown'),
    duration: r.num('duration', 0),
    radius: r.num('radius', 0),
    v1: r.num('v1', 0),
    v2: r.num('v2', 0),
    color: r.color('color'),
    desc: r.opt('desc'),
  });
}

const upgrades = new Map<string, UpgradeDef>();
for (const r of table('upgrades')) {
  const def: UpgradeDef = {
    id: r.str('id'),
    category: r.oneOf<UpgradeCategory>('category', ['unique', 'season', 'pet']),
    owner: r.str('owner'),
    plan: r.opt('plan'),
    name: r.str('name'),
    max: r.num('max'),
    tier: r.num('tier'),
    v1: r.num('v1', 0),
    v2: r.num('v2', 0),
    v3: r.num('v3', 0),
    desc: r.opt('desc'),
  };
  if (def.category === 'unique' && !chars.has(def.owner)) {
    r.error('owner', `characters.csv에 없는 캐릭터입니다 → "${def.owner}"`);
  }
  if (def.category === 'season' && def.owner !== 'team' && !POSITIONS.includes(def.owner as Position)) {
    r.error('owner', `team 또는 포지션(${POSITIONS.join(', ')})이어야 합니다 → "${def.owner}"`);
  }
  if (def.tier < 1 || def.tier > 3) r.error('tier', '1~3이어야 합니다');
  put(upgrades, r, def);
}

const equipSkills = new Map<string, EquipSkillDef>();
for (const r of table('equipment_skills')) {
  put(equipSkills, r, {
    id: r.str('id'),
    slot: r.oneOf<Slot>('slot', SLOTS),
    name: r.str('name'),
    v1: r.num('v1', 0),
    v2: r.num('v2', 0),
    cooldown: r.num('cooldown', 0),
    chance: r.num('chance', 0),
    team: r.num('team', 0) === 1,
    desc: r.opt('desc'),
  });
}

const equipOptions: EquipOptionDef[] = table('equipment_options').map((r) => ({
  slot: r.oneOf<Slot>('slot', SLOTS),
  stat: r.oneOf<OptStat>('stat', OPT_STATS),
  main: r.oneOf('role', ['main', 'sub'] as const) === 'main',
  min: r.num('min'),
  max: r.num('max'),
  label: r.str('label'),
}));
for (const slot of SLOTS) {
  if (!equipOptions.some((o) => o.slot === slot && o.main)) {
    problems.push(`equipment_options.csv: ${slot} 슬롯의 주 옵션(main)이 없습니다`);
  }
}

const rarities: RarityDef[] = table('rarity')
  .map((r) => ({
    rarity: r.num('rarity'),
    name: r.str('name'),
    skillMult: r.num('skillMult'),
    options: r.num('options'),
    optMult: r.num('optMult'),
    refund: r.num('refund'),
    score: r.num('score'),
    color: r.colorText('color'),
    weights: [r.num('w1'), r.num('w2'), r.num('w3')] as [number, number, number],
  }))
  .sort((a, b) => a.rarity - b.rarity);

const valuables = new Map<string, ValuableDef>();
for (const r of table('valuables')) {
  put(valuables, r, { id: r.str('id'), name: r.str('name'), tier: r.num('tier'), value: r.num('value'), weight: r.num('weight'), desc: r.opt('desc') });
}

const curses = new Map<string, CurseDef>();
for (const r of table('curses')) {
  put(curses, r, {
    id: r.str('id'),
    name: r.str('name'),
    stat: r.oneOf<CurseDef['stat']>('stat', ['dmgTaken', 'atk', 'speed', 'maxHp', 'critRate']),
    value: r.num('value'),
    desc: r.opt('desc'),
  });
}

const objects = new Map<string, ObjectDef>();
for (const r of table('objects')) {
  put(objects, r, {
    id: r.str('id'),
    name: r.str('name'),
    weight: r.num('weight'),
    v1: r.num('v1', 0),
    v2: r.num('v2', 0),
    desc: r.opt('desc'),
  });
}

const routes = new Map<string, RouteDef>();
for (const r of table('routes')) {
  put(routes, r, {
    id: r.str('id'),
    name: r.str('name'),
    grade: r.num('grade'),
    packBonus: r.num('packBonus', 0),
    eliteChance: r.num('eliteChance', 0),
    special: r.num('special', 0),
    statMult: r.num('statMult', 1),
    shardMult: r.num('shardMult', 1),
    quality: r.num('quality', 1),
    score: r.num('score', 0),
    desc: r.opt('desc'),
  });
}
if (!routes.has('normal')) problems.push('routes.csv: id가 normal인 기본 경로가 없습니다');

const waves: WaveDef[] = table('waves').map((r) => {
  const def: WaveDef = { stage: r.num('stage'), weight: r.num('weight', 1), members: r.members('members') };
  checkMembers(r, 'members', def.members);
  return def;
});
if (!waves.some((w) => w.stage === 0)) problems.push('waves.csv: stage가 0인 무리가 하나 이상 있어야 합니다');

if (problems.length) throw new DataError(problems);

// ---- 조회 ----------------------------------------------------------------

function need<T>(map: Map<string, T>, key: string, what: string): T {
  const v = map.get(key);
  if (v === undefined) throw new Error(`${what}에 "${key}"가 없습니다`);
  return v;
}

/** 설명문의 {이름}을 값으로 바꾼다 */
function fill(text: string, values: Record<string, unknown>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? '?'));
}

/** 소수 둘째 자리까지만 남긴 표시용 숫자 */
export function trim(n: number): number {
  return Math.round(n * 100) / 100;
}

export const db = {
  /** params.csv의 공통 수치 */
  P: (key: string): number => need(params, key, 'params.csv'),
  /** params.csv의 % 수치를 배율(0~1)로 */
  pct: (key: string): number => need(params, key, 'params.csv') / 100,
  /** skill_values.csv의 스킬 수치 */
  sv: (key: string): number => need(skillValues, key, 'skill_values.csv'),

  chars,
  charList: [...chars.values()],
  char: (id: string): CharDef => need(chars, id, 'characters.csv'),

  skill: (charId: string, slot: SkillSlot): SkillDef => need(skills, `${charId}.${slot}`, 'skills.csv'),
  /** 설명문의 {키}를 실제 수치로 바꾼 문장 */
  skillDesc(charId: string, slot: SkillSlot): string {
    const def = this.skill(charId, slot);
    return def.desc.replace(/\{([\w.]+)\}/g, (_, k: string) => String(skillValues.get(`${charId}.${slot}.${k}`) ?? '?'));
  },

  monsters,
  monster: (id: string): MonsterDef => need(monsters, id, 'monsters.csv'),
  grades,
  grade: (g: number): GradeDef => grades.find((x) => x.grade === g) ?? grades[0],
  packs,
  sectors,
  sector: (index: number): SectorDef => {
    const s = sectors.find((x) => x.index === index);
    if (!s) throw new Error(`sectors.csv에 ${index}번 섹터가 없습니다`);
    return s;
  },
  /** 본편 섹터(보너스 제외)의 마지막 번호 */
  lastSector: Math.max(...sectors.filter((s) => s.type !== 'bonus').map((s) => s.index)),
  bonusSector: sectors.find((s) => s.type === 'bonus') ?? null,

  pets,
  petList: [...pets.values()],
  pet: (id: string): PetDef => need(pets, id, 'pets.csv'),
  petDesc(id: string): string {
    return fill(this.pet(id).desc, this.pet(id) as unknown as Record<string, unknown>);
  },

  upgrades,
  upgradeList: [...upgrades.values()],
  upgrade: (id: string): UpgradeDef => need(upgrades, id, 'upgrades.csv'),
  upgradeDesc(id: string): string {
    return fill(this.upgrade(id).desc, this.upgrade(id) as unknown as Record<string, unknown>);
  },

  equipSkills,
  equipSkillList: [...equipSkills.values()],
  equipSkill: (id: string): EquipSkillDef => need(equipSkills, id, 'equipment_skills.csv'),
  equipOptions,
  rarities,
  rarity: (r: number): RarityDef => rarities.find((x) => x.rarity === r) ?? rarities[0],
  /** 희귀도가 반영된 장비 스킬 설명 */
  equipSkillDesc(id: string, rarity: number): string {
    const def = this.equipSkill(id);
    return fill(def.desc, { ...def, v1: trim(def.v1 * this.rarity(rarity).skillMult) });
  },

  valuables,
  valuableList: [...valuables.values()],
  valuable: (id: string): ValuableDef => need(valuables, id, 'valuables.csv'),
  curses,
  curseList: [...curses.values()],
  curse: (id: string): CurseDef => need(curses, id, 'curses.csv'),
  /** 저주의 설명. {value}를 부호가 붙은 수치로 바꾼다 */
  curseDesc: (id: string): string => {
    const c = need(curses, id, 'curses.csv');
    return c.desc.replace('{value}', String(c.value));
  },
  objects,
  objectList: [...objects.values()],
  object: (id: string): ObjectDef => need(objects, id, 'objects.csv'),
  routes,
  routeList: [...routes.values()],
  route: (id: string): RouteDef => routes.get(id) ?? need(routes, 'normal', 'routes.csv'),
  waves,

  mapText: (name: string): string => need(mapTexts, name, 'data/maps'),
  mapNames: [...mapTexts.keys()],
};
