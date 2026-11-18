// 스프라이트 제작 도구가 함께 쓰는 것: 경로, 표 읽기, API 키 읽기, 이미지 입출력.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { csvRecords } from '../../../src/core/csv.ts';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const REF_DIR = join(ROOT, 'art', 'ref');
export const WORK_DIR = join(ROOT, 'art', 'work');
export const OUT_DIR = join(ROOT, 'public', 'sprites');

export const DIRS = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

/** 배경(크로마키)색. 캐릭터에 없는 색을 고른다 */
export const KEYS = {
  green: { rgb: [0, 255, 0], text: 'pure green (#00FF00)' },
  magenta: { rgb: [255, 0, 255], text: 'pure magenta (#FF00FF)' },
  blue: { rgb: [0, 0, 255], text: 'pure blue (#0000FF)' },
};

export class ArtError extends Error {}

export const fail = (msg) => {
  throw new ArtError(msg);
};

export const ensureDir = (dir) => {
  mkdirSync(dir, { recursive: true });
  return dir;
};

export const readJson = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null);
export const writeJson = (path, data) => {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(data, null, 2));
};

// ---- 표 ---------------------------------------------------------------------

/** 표의 각 줄을 { 열 이름: 값, line: 줄 번호 } 로 읽는다 */
const table = (name) => csvRecords(readFileSync(join(ROOT, 'data', 'art', name), 'utf8')).rows.map((r) => ({ ...r.cells, line: r.line }));

let cache = null;
export function tables() {
  if (cache) return cache;
  const settings = Object.fromEntries(table('settings.csv').map((r) => [r.key, r.value]));
  const subjects = table('subjects.csv').map((r) => {
    const where = `data/art/subjects.csv ${r.line}번째 줄`;
    if (!/^[a-z0-9_]+$/.test(r.id)) fail(`${where}: id "${r.id}" 는 영문 소문자·숫자·밑줄만 쓸 수 있습니다`);
    if (r.kind !== 'char' && r.kind !== 'monster' && r.kind !== 'pet') fail(`${where}: kind 는 char / monster / pet 중 하나여야 합니다`);
    if (!KEYS[r.key]) fail(`${where}: key 는 ${Object.keys(KEYS).join(' / ')} 중 하나여야 합니다`);
    const dirs = r.dirs.split(/\s+/).filter(Boolean);
    for (const d of dirs) if (!DIRS.includes(d)) fail(`${where}: dirs 의 "${d}" 는 ${DIRS.join(' ')} 중 하나여야 합니다`);
    if (!dirs.length) fail(`${where}: dirs 가 비어 있습니다`);
    const height = Number(r.height);
    if (!(height > 0)) fail(`${where}: height 는 0보다 큰 숫자여야 합니다`);
    const anchor = r.anchor ? r.anchor.split(/[\s,]+/).map(Number) : null;
    if (anchor && (anchor.length !== 3 || anchor.some((v) => !(v > 0 && v < 1)))) fail(`${where}: anchor 는 "발 x, 발 y, 키"를 0~1 비율로 적습니다 (예: 0.5 0.8 0.55)`);
    return { ...r, dirs, height, anchor };
  });
  const clips = table('clips.csv').map((r) => {
    const where = `data/art/clips.csv ${r.line}번째 줄`;
    if (r.play !== 'loop' && r.play !== 'once') fail(`${where}: play 는 loop 또는 once 여야 합니다`);
    // range 뒤에 "!시작-끝"(초)을 붙이면 그 구간의 프레임은 쓰지 않는다 (영상에 들어간 총구 화염처럼 빼고 싶은 부분)
    const [rangeText, cutText] = r.range.split('!');
    if (!/^(full|cycle|action|none|[\d.]+-[\d.]+|=\w+)$/.test(rangeText) || (cutText !== undefined && !/^[\d.]+-[\d.]+$/.test(cutText))) {
      fail(`${where}: range 는 full / cycle / action / none / "시작-끝"(초) / "=다른 동작 이름" 중 하나여야 하고, 뺄 구간은 뒤에 "!시작-끝"(초)으로 붙입니다`);
    }
    const num = (k, min) => {
      const v = Number(r[k]);
      if (!(v >= min)) fail(`${where}: ${k} 는 ${min} 이상의 숫자여야 합니다`);
      return v;
    };
    return {
      ...r,
      range: rangeText,
      cut: cutText ? cutText.split('-').map(Number) : null,
      // range 가 "=BasicAttack1" 이면 영상을 따로 만들지 않고 그 동작의 프레임을 그대로 쓴다
      alias: r.range.startsWith('=') ? r.range.slice(1) : null,
      loop: r.play === 'loop',
      frames: num('frames', 1),
      fps: num('fps', 1),
      seconds: num('seconds', 4),
      // 타격 지점: 숫자(0~1), auto(가장 빠르게 움직이는 순간을 자동으로), 빈칸(맞추지 않음)
      impact: r.impact === 'auto' ? 'auto' : r.impact ? Number(r.impact) : 0,
      // 영상 속 이펙트: trail(무기를 따라가는 흰 검기만 허용), none(이펙트 없음)
      fx: r.fx === 'trail' || r.fx === 'flash' ? r.fx : 'none',
      last: r.last === 'free' ? 'free' : 'same',
      // 발 높이: keep(영상 그대로) / snap(가장 낮게 디딘 발을 발밑 기준선에) / land(몸이 처음보다 아래로 내려가면 그만큼 올려 기준선에 붙인다)
      ground: r.ground === 'snap' || r.ground === 'land' ? r.ground : 'keep',
    };
  });
  cache = { settings, subjects, clips };
  return cache;
}

export const setting = (key) => {
  const v = tables().settings[key];
  if (v === undefined) fail(`data/art/settings.csv 에 ${key} 가 없습니다`);
  return v;
};
export const num = (key) => {
  const v = Number(setting(key));
  if (Number.isNaN(v)) fail(`data/art/settings.csv 의 ${key} 가 숫자가 아닙니다`);
  return v;
};

/** 대상별로 따로 줄 수 있는 설정값: settings.csv 에 "key.hue@witch" 처럼 "@대상 id" 를 붙인 줄이 있으면 그 값을, 없으면 공용 값을 쓴다 */
export const numFor = (key, id) => (tables().settings[`${key}@${id}`] !== undefined ? num(`${key}@${id}`) : num(key));

export function subject(id) {
  return tables().subjects.find((s) => s.id === id) ?? fail(`data/art/subjects.csv 에 "${id}" 가 없습니다. 있는 것: ${tables().subjects.map((s) => s.id).join(', ')}`);
}

/** 대상에 적용되는 동작 목록. 같은 동작이 여러 줄이면 그 대상 id를 적은 줄이 * 줄보다 우선한다 */
export function clipsFor(sub) {
  const out = new Map();
  for (const c of tables().clips) {
    if (c.kind !== sub.kind) continue;
    if (c.who === sub.id || (c.who === '*' && !out.has(c.anim))) out.set(c.anim, c);
  }
  // 연속기 단계별 동작(BasicAttack1, 2 …)을 따로 적은 대상은 공용 BasicAttack 을 만들지 않는다
  if ([...out.keys()].some((a) => /^BasicAttack\d+$/.test(a))) out.delete('BasicAttack');
  // range 가 none 인 줄: 이 대상은 그 동작을 만들지 않는다 (공용(*) 줄을 대상별로 끄는 용도)
  for (const [anim, c] of out) if (c.range === 'none') out.delete(anim);
  return [...out.values()];
}

export function clipFor(sub, anim) {
  return clipsFor(sub).find((c) => c.anim === anim) ?? fail(`data/art/clips.csv 에 ${sub.kind} 의 "${anim}" 동작이 없습니다. 있는 것: ${clipsFor(sub).map((c) => c.anim).join(', ')}`);
}

// ---- 경로 -------------------------------------------------------------------

export const paths = (id) => {
  const work = join(WORK_DIR, id);
  return {
    work,
    base: (dir) => join(work, `base_${dir}.png`),
    baseInfo: (dir) => join(work, `base_${dir}.json`),
    video: (anim, dir) => join(work, 'video', `${anim}_${dir}.mp4`),
    videoInfo: (anim, dir) => join(work, 'video', `${anim}_${dir}.json`),
    clipDir: (anim, dir) => join(work, 'clips', `${anim}_${dir}`),
    out: join(OUT_DIR, id),
  };
};

// ---- API 키 -----------------------------------------------------------------

/** .env.local 에서 값을 읽는다. 키 값은 어디에도 출력하지 않는다 */
export function envKey(name) {
  if (process.env[name]) return process.env[name];
  for (const file of ['.env.local', '.env']) {
    const path = join(ROOT, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, '');
    }
  }
  fail(`${name} 가 없습니다. 프로젝트 폴더의 .env.local 에 "${name}=키" 한 줄을 넣어 주세요`);
}

// ---- 이미지 입출력 ----------------------------------------------------------

/** 이미지 파일을 RGBA 픽셀로 읽는다 */
export async function loadImage(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, data: new Uint8Array(data.buffer, data.byteOffset, data.length) };
}

export const toSharp = (img) => sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length), { raw: { width: img.w, height: img.h, channels: 4 } });

/** 실행 파일이 있는지 확인하고, 없으면 설치 방법을 알려 준다 */
export function needTool(cmd, hint) {
  const r = spawnSync(cmd, ['-version'], { encoding: 'utf8' });
  if (r.error || r.status !== 0) fail(`${cmd} 를 실행할 수 없습니다. ${hint}`);
}

export const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
