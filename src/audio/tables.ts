// 소리 표를 읽는다 (data/sound/).
//   cues.csv — 게임에서 일어난 일(cue) → 낼 효과음, 크기, 높낮이 변화, 다시 낼 수 있는 간격
//   bgm.csv  — 장소 → 배경 음악과 환경음
// 어떤 소리 파일이 있는지는 표가 아니라 제작 도구가 만든 목록(public/sound/index.json)에서 읽는다.
import { csvRecords } from '../core/csv';
import { DataError } from '../data/tables';

const files = import.meta.glob('/data/sound/*.csv', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface CueDef {
  cue: string;
  /** 낼 수 있는 소리들. 여러 개면 낼 때마다 하나를 고른다 (같은 것을 연달아 고르지 않는다) */
  sounds: string[];
  /** 크기 (0~1) */
  volume: number;
  /** 높낮이를 흩는 폭. 0.06 이면 낼 때마다 ±6% 안에서 달라진다 */
  pitch: number;
  /** 같은 cue 를 다시 낼 수 있을 때까지의 시간(초). 한꺼번에 여러 번 불려도 한 번만 난다 */
  cooldown: number;
}

export interface BgmDef {
  where: string;
  /** 배경 음악 (없으면 빈 글자) */
  music: string;
  /** 환경음 (없으면 빈 글자) */
  ambience: string;
  /** 음악 크기 (0~1) */
  volume: number;
  /** 환경음 크기 (0~1). 음악 밑에 깔리도록 음악보다 훨씬 작게 둔다 */
  ambVolume: number;
}

const problems: string[] = [];

function rows(name: string): { line: number; cells: Record<string, string> }[] {
  const text = files[`/data/sound/${name}`];
  if (text === undefined) {
    problems.push(`sound/${name}: 파일이 없습니다`);
    return [];
  }
  return csvRecords(text).rows;
}

function number(file: string, line: number, col: string, v: string, lo: number, hi: number): number {
  const n = Number(v);
  if (v === '' || !Number.isFinite(n) || n < lo || n > hi) {
    problems.push(`sound/${file} ${line}번째 줄 [${col}]: ${lo}~${hi} 사이의 숫자여야 합니다 → "${v}"`);
    return lo;
  }
  return n;
}

export const CUES = new Map<string, CueDef>();
for (const r of rows('cues.csv')) {
  const c = r.cells;
  if (!c.cue) problems.push(`sound/cues.csv ${r.line}번째 줄 [cue]: 값이 비어 있습니다`);
  if (CUES.has(c.cue)) problems.push(`sound/cues.csv ${r.line}번째 줄 [cue]: "${c.cue}"가 두 번 나옵니다`);
  const sounds = (c.sounds ?? '').split('|').map((s) => s.trim()).filter(Boolean);
  if (!sounds.length) problems.push(`sound/cues.csv ${r.line}번째 줄 [sounds]: 값이 비어 있습니다`);
  CUES.set(c.cue, {
    cue: c.cue,
    sounds,
    volume: number('cues.csv', r.line, 'volume', c.volume, 0, 1),
    pitch: number('cues.csv', r.line, 'pitch', c.pitch || '0', 0, 0.5),
    cooldown: number('cues.csv', r.line, 'cooldown', c.cooldown || '0', 0, 60),
  });
}

export const BGM = new Map<string, BgmDef>();
for (const r of rows('bgm.csv')) {
  const c = r.cells;
  if (!c.where) problems.push(`sound/bgm.csv ${r.line}번째 줄 [where]: 값이 비어 있습니다`);
  if (BGM.has(c.where)) problems.push(`sound/bgm.csv ${r.line}번째 줄 [where]: "${c.where}"가 두 번 나옵니다`);
  BGM.set(c.where, {
    where: c.where,
    music: c.music ?? '',
    ambience: c.ambience ?? '',
    volume: number('bgm.csv', r.line, 'volume', c.volume || '1', 0, 1),
    // 환경음을 적은 줄은 그 크기도 적어야 한다
    ambVolume: c.ambience ? number('bgm.csv', r.line, 'ambVolume', c.ambVolume ?? '', 0, 1) : 0,
  });
}

if (problems.length) throw new DataError(problems);

/**
 * 일어난 일의 이름으로 낼 소리를 찾는다. 종류(style)가 있으면 "이름.종류" 줄을 먼저 보고, 없으면 "이름" 줄을 쓴다.
 * (예: hit + greatsword → "hit.greatsword" 줄이 없으면 "hit" 줄)
 */
export function findCue(name: string, style?: string): CueDef | undefined {
  return (style ? CUES.get(`${name}.${style}`) : undefined) ?? CUES.get(name);
}

/** 섹터에서 틀 배경음을 찾는다: 보스 섹터는 "boss.시즌", 그 밖은 "scene.맵 그림 세트". 없으면 뒤의 것으로 내려간다 */
export function bgmFor(keys: string[]): BgmDef | undefined {
  for (const k of keys) {
    const def = BGM.get(k);
    if (def) return def;
  }
  return undefined;
}
