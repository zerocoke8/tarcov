// data/ 폴더의 CSV 수치 테이블을 읽어 검사한 뒤 게임에서 쓰는 형태로 바꾼다.
// 값이 빠졌거나 숫자가 아니면 DataError에 "어느 파일 몇 번째 줄"인지 모아서 던진다.
import { csvRecords, type CsvRow } from '../core/csv';
import { hexToNum } from '../core/math';
import {
  ATTRS,
  POSITIONS,
  WEAPON_TYPES,
  type WeaponType,
  type Attr,
  type CharDef,
  type GradeDef,
  type HairStyle,
  type MonsterDef,
  type MonsterSize,
  type PackDef,
  type PackMember,
  type PetDef,
  type Position,
  type SectorDef,
  type SectorType,
  type SkillDef,
  type SkillSlot,
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

  has(col: string): boolean {
    return (this.row.cells[col] ?? '') !== '';
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
    const v = this.str(col);
    if (v && !/^#[0-9a-fA-F]{6}$/.test(v)) {
      this.fail(col, `색은 #rrggbb 형식이어야 합니다 → "${v}"`);
      return 0xffffff;
    }
    return v ? hexToNum(v) : 0xffffff;
  }

  /** "wisp:3|eye:1" 형식의 무리 구성 */
  members(col: string, allowEmpty = false): PackMember[] {
    const v = this.opt(col);
    if (!v) {
      if (!allowEmpty) this.fail(col, '값이 비어 있습니다');
      return [];
    }
    const out: PackMember[] = [];
    for (const part of v.split('|')) {
      const [id, n] = part.split(':').map((s) => s.trim());
      const count = n === undefined ? 1 : Number(n);
      if (!id || !Number.isInteger(count) || count <= 0) {
        this.fail(col, `"몬스터id:수" 형식이 아닙니다 → "${part}"`);
        continue;
      }
      out.push({ id, count });
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

// ---- 읽기 ----------------------------------------------------------------

const params = keyValues('params');
const skillValues = keyValues('skill_values');

const chars = new Map<string, CharDef>();
for (const r of table('characters')) {
  const def: CharDef = {
    id: r.str('id'),
    name: r.str('name'),
    grade: r.oneOf('grade', ['S', 'A'] as const),
    position: r.oneOf<Position>('position', POSITIONS),
    attr: r.oneOf<Attr>('attr', ATTRS),
    weapon: r.str('weapon'),
    weaponType: r.oneOf<WeaponType>('weaponType', WEAPON_TYPES),
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
  };
  if (chars.has(def.id)) r.error('id', `"${def.id}"가 두 번 나옵니다`);
  chars.set(def.id, def);
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
for (const r of table('monsters')) {
  const def: MonsterDef = {
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
    shards: r.num('shards', 0),
    color: r.color('color'),
    eye: r.color('eye'),
  };
  monsters.set(def.id, def);
}

const grades: GradeDef[] = table('grades').map((r) => ({
  grade: r.num('grade'),
  name: r.str('name'),
  hpMult: r.num('hpMult'),
  atkMult: r.num('atkMult'),
  scale: r.num('scale'),
  quality: r.num('quality'),
  shardMult: r.num('shardMult'),
}));

function checkMembers(r: Row, col: string, list: PackMember[]): void {
  for (const m of list) {
    if (!monsters.has(m.id)) r.error(col, `monsters.csv에 없는 몬스터입니다 → "${m.id}"`);
  }
}

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
  };
  checkMembers(r, 'gate', def.gate);
  if (def.map && !mapTexts.has(def.map)) r.error('map', `data/maps/${def.map}.txt 파일이 없습니다`);
  return def;
});

const pets = new Map<string, PetDef>();
for (const r of table('pets')) {
  const def: PetDef = {
    id: r.str('id'),
    name: r.str('name'),
    cooldown: r.num('cooldown'),
    duration: r.num('duration', 0),
    radius: r.num('radius', 0),
    v1: r.num('v1', 0),
    v2: r.num('v2', 0),
    color: r.color('color'),
    desc: r.opt('desc'),
  };
  pets.set(def.id, def);
}

if (problems.length) throw new DataError(problems);

// ---- 조회 ----------------------------------------------------------------

function need<T>(map: Map<string, T>, key: string, what: string): T {
  const v = map.get(key);
  if (v === undefined) throw new Error(`${what}에 "${key}"가 없습니다`);
  return v;
}

export const db = {
  /** params.csv의 공통 수치 */
  P: (key: string): number => need(params, key, 'params.csv'),
  /** params.csv의 % 수치를 배율(0~1)로 */
  pct: (key: string): number => need(params, key, 'params.csv') / 100,
  /** skill_values.csv의 스킬 수치 */
  sv: (key: string): number => need(skillValues, key, 'skill_values.csv'),
  hasSv: (key: string): boolean => skillValues.has(key),

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
  pets,
  petList: [...pets.values()],
  pet: (id: string): PetDef => need(pets, id, 'pets.csv'),
  petDesc(id: string): string {
    const p = this.pet(id) as unknown as Record<string, unknown>;
    return this.pet(id).desc.replace(/\{(\w+)\}/g, (_, k: string) => String(p[k] ?? '?'));
  },

  mapText: (name: string): string => need(mapTexts, name, 'data/maps'),
  mapNames: [...mapTexts.keys()],
};
