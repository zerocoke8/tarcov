// 사운드 제작 도구의 공통 부분: 표 읽기, 경로, ElevenLabs 호출, ffmpeg 로 소리 읽고 쓰기.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { csvRecords } from '../../../src/core/csv.ts';
import { deinterleave, interleave } from './pcm.ts';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
/** 생성한 원본 소리와 그 기록. 후처리를 고치면 요금 없이 여기서 다시 만든다 */
export const RAW_DIR = join(ROOT, 'art', 'sound', 'raw');
/** 게임이 읽는 결과물 */
export const OUT_DIR = join(ROOT, 'public', 'sound');
const DATA_DIR = join(ROOT, 'data', 'sound');

export class SoundError extends Error {}
export const fail = (msg) => {
  throw new SoundError(msg);
};

export const KINDS = ['sfx', 'jingle', 'loop', 'music'];

// ---- 표 ---------------------------------------------------------------------

/** data/sound/ 의 표를 읽는다. 줄마다 열 이름으로 값을 꺼낼 수 있고, line 은 파일에서의 줄 번호다 */
export function csv(name) {
  const path = join(DATA_DIR, name);
  if (!existsSync(path)) fail(`data/sound/${name} 이 없습니다`);
  return csvRecords(readFileSync(path, 'utf8')).rows.map((r) => ({ ...r.cells, line: r.line }));
}

let cache = null;
export function tables() {
  if (cache) return cache;
  const settings = Object.fromEntries(csv('settings.csv').map((r) => [r.key, r.value]));
  const problems = [];
  const seen = new Set();
  const sounds = csv('sounds.csv').map((r) => {
    const at = `data/sound/sounds.csv ${r.line}번째 줄`;
    if (!/^[a-z0-9_.]+$/.test(r.id)) problems.push(`${at}: id "${r.id}" 는 영문 소문자·숫자·점·밑줄만 쓸 수 있습니다`);
    if (seen.has(r.id)) problems.push(`${at}: id "${r.id}" 가 두 번 나옵니다`);
    seen.add(r.id);
    if (!KINDS.includes(r.kind)) problems.push(`${at}: kind "${r.kind}" 는 ${KINDS.join(' / ')} 가운데 하나여야 합니다`);
    const seconds = Number(r.seconds);
    if (!(seconds > 0)) problems.push(`${at}: seconds 가 숫자가 아닙니다`);
    if ((r.kind === 'sfx' || r.kind === 'jingle' || r.kind === 'loop') && (seconds < 0.5 || seconds > 30)) problems.push(`${at}: 효과음 모델은 0.5~30초만 만들 수 있습니다`);
    if (!r.prompt) problems.push(`${at}: prompt 가 비어 있습니다`);
    return {
      id: r.id,
      kind: r.kind,
      seconds,
      influence: r.influence === '' ? null : Number(r.influence),
      gain: r.gain === '' ? 0 : Number(r.gain),
      prompt: r.prompt,
    };
  });
  if (problems.length) fail(problems.join('\n'));
  cache = { settings, sounds };
  return cache;
}

export const setting = (key) => {
  const v = tables().settings[key];
  if (v === undefined) fail(`data/sound/settings.csv 에 ${key} 가 없습니다`);
  return v;
};
export const num = (key) => {
  const v = Number(setting(key));
  if (Number.isNaN(v)) fail(`data/sound/settings.csv 의 ${key} 가 숫자가 아닙니다`);
  return v;
};

export function sound(id) {
  return tables().sounds.find((s) => s.id === id) ?? fail(`data/sound/sounds.csv 에 "${id}" 가 없습니다`);
}

// ---- 경로와 기록 ------------------------------------------------------------

export const paths = (id) => ({
  raw: join(RAW_DIR, `${id}.mp3`),
  rawInfo: join(RAW_DIR, `${id}.json`),
  out: join(OUT_DIR, `${id}.mp3`),
});

export const ensureDir = (dir) => mkdirSync(dir, { recursive: true });
export const readJson = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null);
export const writeJson = (path, data) => writeFileSync(path, JSON.stringify(data, null, 1) + '\n');
export const hash = (text) => createHash('sha1').update(text).digest('hex').slice(0, 10);

/** 이 소리를 만들 때 쓰는 모델 */
export const modelOf = (s) => setting(s.kind === 'music' ? 'music.model' : 'sfx.model');

/** 생성 요청의 지문. 지시문·길이·모델이 바뀌면 달라진다 (원본이 표와 맞는지 볼 때 쓴다) */
export const requestKey = (s) => hash([s.kind, s.seconds, s.influence ?? setting('sfx.influence'), modelOf(s), s.prompt].join('|'));

/** 예상 크레딧 */
export const estimate = (s) => Math.ceil(s.seconds * num(s.kind === 'music' ? 'music.creditsPerSecond' : 'sfx.creditsPerSecond'));

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

// ---- ElevenLabs -------------------------------------------------------------

const API = 'https://api.elevenlabs.io';
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * 소리 한 개를 만들어 원본 폴더에 저장한다 (요금 발생). 쓴 크레딧을 돌려준다.
 * 효과음·징글·반복음은 효과음 모델(/v1/sound-generation), 음악은 음악 모델(/v1/music)로 만든다.
 */
export async function generate(s) {
  const key = envKey('ELEVENLABS_API_KEY');
  const format = setting('api.format');
  const model = modelOf(s);
  const request =
    s.kind === 'music'
      ? { url: `${API}/v1/music?output_format=${format}`, body: { prompt: s.prompt, music_length_ms: Math.round(s.seconds * 1000), model_id: model, force_instrumental: true } }
      : {
          url: `${API}/v1/sound-generation?output_format=${format}`,
          body: { text: s.prompt, duration_seconds: s.seconds, prompt_influence: s.influence ?? num('sfx.influence'), loop: s.kind === 'loop', model_id: model },
        };
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(request.url, { method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(request.body) });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      const cost = Number(res.headers.get('character-cost')) || 0;
      const p = paths(s.id);
      ensureDir(RAW_DIR);
      writeFileSync(p.raw, buf);
      writeJson(p.rawInfo, { id: s.id, kind: s.kind, key: requestKey(s), model, seconds: s.seconds, influence: request.body.prompt_influence ?? null, prompt: s.prompt, cost, madeAt: new Date().toISOString() });
      return cost;
    }
    const text = await res.text();
    let detail = text.slice(0, 300);
    try {
      const d = JSON.parse(text).detail;
      detail = `${d.code ?? d.status ?? ''} ${d.message ?? ''}`.trim() || detail;
    } catch {
      // JSON 이 아니면 받은 글자를 그대로 보여 준다
    }
    // 동시 요청 한도·일시 오류는 잠시 뒤 다시 시도한다. 그 밖(요금제, 크레딧 부족, 잘못된 값)은 바로 멈춘다
    if ((res.status === 429 || res.status >= 500) && attempt < 4 && !/quota/i.test(detail)) {
      await sleep(2500 * attempt);
      continue;
    }
    fail(`${s.id}: ElevenLabs 가 거절했습니다 (${res.status}) ${detail}`);
  }
}

// ---- 소리 읽고 쓰기 (ffmpeg) -----------------------------------------------

function ffmpeg(args, input) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { input, maxBuffer: 1 << 30 });
  if (r.error) fail('ffmpeg 를 실행할 수 없습니다. 설치돼 있는지 확인해 주세요');
  if (r.status !== 0) fail(`ffmpeg 오류: ${String(r.stderr).slice(0, 400)}`);
  return r.stdout;
}

/** 소리 파일을 실수 샘플로 읽는다 */
export function readAudio(path, channels) {
  const rate = num('out.rate');
  const out = ffmpeg(['-i', path, '-f', 'f32le', '-ac', String(channels), '-ar', String(rate), 'pipe:1']);
  const data = new Float32Array(out.buffer, out.byteOffset, Math.floor(out.length / 4));
  return deinterleave(data, channels, rate);
}

/** 실수 샘플을 MP3로 쓴다 */
export function writeAudio(path, pcm, kbps) {
  ensureDir(dirname(path));
  const data = interleave(pcm);
  const input = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  ffmpeg(['-f', 'f32le', '-ar', String(pcm.rate), '-ac', String(pcm.ch.length), '-i', 'pipe:0', '-c:a', 'libmp3lame', '-b:a', `${kbps}k`, '-map_metadata', '-1', path], input);
}
