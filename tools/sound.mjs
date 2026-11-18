// 사운드 제작 도구. 표(data/sound/sounds.csv)의 지시문 → ElevenLabs 로 생성 → 다듬기(무음 자르기·크기 맞추기·반복 구간) → 게임.
//
//   npm run sound -- status                    무엇이 만들어져 있는지
//   npm run sound -- make                      아직 없는 소리의 계획과 예상 크레딧을 보여 준다 (--yes 를 붙여야 실제로 만든다)
//   npm run sound -- make --yes                없는 소리를 모두 만든다 (요금 발생)
//   npm run sound -- make ui.click hit.blade1 --yes        고른 소리만. 이미 있으면 건너뛴다
//   npm run sound -- make hit.blade1 --force --yes         이미 있어도 다시 만든다 (마음에 들지 않을 때)
//   npm run sound -- make --changed --yes      표의 지시문·길이가 바뀐 소리를 다시 만든다
//   npm run sound -- make --kind loop --yes    그 종류(sfx / jingle / loop / music)만
//   npm run sound -- process [id …]            원본에서 다시 다듬는다 (요금 없음. 설정을 고쳤을 때)
//   npm run sound -- check [id …]              결과물의 길이·크기·이음매를 잰다
//
// 소리 목록과 지시문은 data/sound/sounds.csv, 다듬는 설정은 data/sound/settings.csv 에서 고친다.
// 게임에서 언제 어떤 소리가 나는지는 data/sound/cues.csv (효과음), data/sound/bgm.csv (배경음) 에 있다.
// 원본은 art/sound/raw/, 게임이 읽는 결과물은 public/sound/ 에 놓인다.
import { existsSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { OUT_DIR, SoundError, csv, estimate, generate, hash, num, paths, readAudio, readJson, requestKey, sound, tables, writeAudio, writeJson } from './sound/lib/common.mjs';
import { appendHead, crossfadeLoop, edgeLevel, estimateBpm, fade, lengthOf, loudest, normalize, peak, rms, seamJump, secondsOf, slice, toDb, trimSilence } from './sound/lib/pcm.ts';

const [cmd, ...rest] = process.argv.slice(2);
const args = [];
const opts = {};
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (!a.startsWith('--')) args.push(a);
  else if (a.includes('=')) opts[a.slice(2, a.indexOf('='))] = a.slice(a.indexOf('=') + 1);
  else if (a === '--kind' && rest[i + 1] !== undefined) opts.kind = rest[++i];
  else opts[a.slice(2)] = true;
}

/** 원본의 상태: none 없음 / stale 표의 지시문·길이와 다르다 / ok */
function rawState(s) {
  const p = paths(s.id);
  if (!existsSync(p.raw)) return 'none';
  return readJson(p.rawInfo)?.key === requestKey(s) ? 'ok' : 'stale';
}

function picked() {
  let list = args.length ? args.map(sound) : tables().sounds;
  if (typeof opts.kind === 'string') list = list.filter((s) => s.kind === opts.kind);
  return list;
}

// ---- 다듬기 -----------------------------------------------------------------

/** 원본 하나를 다듬어 게임 폴더에 쓴다. 목록 파일에 들어갈 정보를 돌려준다 */
function processOne(s) {
  const p = paths(s.id);
  if (!existsSync(p.raw)) throw new SoundError(`${s.id}: 원본이 없습니다. 먼저 make 로 만들어 주세요`);
  const info = { d: 0 };
  let pcm;
  let kbps;
  if (s.kind === 'sfx' || s.kind === 'jingle') {
    // 한 번 나는 소리: 앞뒤 무음을 자르고 크기를 맞춘다. 효과음은 한 채널(좌우 위치는 게임이 정한다), 징글은 두 채널
    const k = s.kind;
    pcm = readAudio(p.raw, k === 'sfx' ? 1 : 2);
    pcm = trimSilence(pcm, num('trim.threshold'), num('trim.keepHead'), num(`${k}.keepTail`));
    if (lengthOf(pcm) === 0) throw new SoundError(`${s.id}: 원본에 소리가 없습니다 (무음)`);
    pcm = fade(pcm, num('fade.in'), Math.min(num(`${k}.fadeOut`), secondsOf(pcm) / 2));
    pcm = normalize(pcm, num(`${k}.loud`) + s.gain, num('out.peak'), num(`${k}.loudWindow`)).pcm;
    kbps = num(k === 'sfx' ? 'out.sfxBitrate' : 'out.musicBitrate');
  } else {
    const cross = num('loop.cross');
    pcm = readAudio(p.raw, 2);
    let period;
    if (s.kind === 'loop') {
      // 끊김 없이 반복되게 만들어진 소리: 요청한 길이가 곧 반복 주기다. 디코더가 끝에 붙인 여분은 잘라 낸다
      period = Math.min(s.seconds, secondsOf(pcm));
      pcm = slice(pcm, 0, period * pcm.rate);
    } else {
      // 음악: 앞뒤 무음과 끝맺음을 버리고, 가운데에서 끊김 없이 도는 구간을 만든다 (마디 수에 맞춰 자른다)
      const body = trimSilence(pcm, num('trim.threshold'), 0, 0, 0.05);
      const lead = num('music.lead');
      const tail = num('music.tail');
      const bpm = estimateBpm(body);
      const room = secondsOf(body) - lead - tail - cross;
      if (room < 8) throw new SoundError(`${s.id}: 음악이 너무 짧아 반복 구간을 만들 수 없습니다`);
      const bar = bpm > 0 ? (60 / bpm) * 4 : 0;
      period = bar > 0 ? Math.max(1, Math.floor(room / bar)) * bar : room;
      pcm = crossfadeLoop(body, lead + cross, period, cross);
      info.bpm = bpm;
    }
    // 배경음은 전체의 평균 크기로 맞춘다
    const all = rms(pcm);
    const k = Math.min(Math.pow(10, (num('loop.loud') + s.gain) / 20) / (all || 1), Math.pow(10, num('out.peak') / 20) / (peak(pcm) || 1));
    pcm = { rate: pcm.rate, ch: pcm.ch.map((c) => c.map((v) => v * k)) };
    info.loop = Math.round(period * 1000) / 1000;
    info.seam = Math.round(seamJump(pcm) * 100) / 100;
    pcm = appendHead(pcm, cross);
    kbps = num('out.musicBitrate');
  }
  writeAudio(p.out, pcm, kbps);
  info.d = Math.round(secondsOf(pcm) * 1000) / 1000;
  if (pcm.ch.length > 1) info.ch = pcm.ch.length;
  return info;
}

/** 게임이 읽는 목록 파일을 쓴다: 표에 있고 결과물이 있는 소리만 (이름, 길이, 반복 주기, 파일 지문) */
function pack(infos = new Map()) {
  const old = readJson(join(OUT_DIR, 'index.json'))?.sounds ?? {};
  const sounds = {};
  for (const s of tables().sounds) {
    const out = paths(s.id).out;
    if (!existsSync(out)) continue;
    const info = infos.get(s.id) ?? old[s.id];
    if (!info) continue;
    const { v: _old, ...restInfo } = info;
    sounds[s.id] = { v: hash(readFileSync(out)), ...restInfo };
  }
  // 표에서 빠진 소리의 파일은 지운다
  if (existsSync(OUT_DIR)) {
    for (const name of readdirSync(OUT_DIR)) {
      if (name.endsWith('.mp3') && !sounds[name.slice(0, -4)]) unlinkSync(join(OUT_DIR, name));
    }
  }
  writeJson(join(OUT_DIR, 'index.json'), { sounds });
  // 들어 보는 페이지(public/sound/index.html)가 읽는 목록: 소리마다 종류, 지시문, 게임에서 쓰이는 곳
  const uses = new Map();
  const use = (id, text) => uses.set(id, [...(uses.get(id) ?? []), text]);
  let note = '';
  for (const r of csv('cues.csv')) {
    // 설명이 빈 줄은 바로 위 줄의 설명을 잇는다 (hit.greatsword 같은 종류별 줄)
    note = r['설명'] ? r['설명'].split('. cue =')[0] : note;
    for (const id of r.sounds.split('|')) use(id.trim(), `${r.cue} — ${note}`);
  }
  for (const r of csv('bgm.csv')) {
    for (const id of [r.music, r.ambience]) if (id) use(id, `${r.where} — ${r['설명'].split('. where =')[0]}`);
  }
  writeJson(join(OUT_DIR, 'listen.json'), {
    sounds: tables()
      .sounds.filter((s) => sounds[s.id])
      .map((s) => ({ id: s.id, kind: s.kind, prompt: s.prompt, uses: uses.get(s.id) ?? [] })),
  });
  return Object.keys(sounds).length;
}

function processMany(list) {
  const infos = new Map();
  for (const s of list) {
    const info = processOne(s);
    infos.set(s.id, info);
    console.log(`  다듬음 ${s.id.padEnd(22)} ${info.d.toFixed(2)}초${info.loop ? ` (반복 주기 ${info.loop}초, 이음매 ${info.seam})` : ''}`);
  }
  console.log(`목록: public/sound/index.json — 소리 ${pack(infos)}개`);
}

// ---- 명령 -------------------------------------------------------------------

function status() {
  const index = readJson(join(OUT_DIR, 'index.json'))?.sounds ?? {};
  const count = { none: 0, stale: 0, ok: 0 };
  for (const s of tables().sounds) {
    const state = rawState(s);
    count[state]++;
    const made = index[s.id];
    const text = { none: '없음', stale: '표가 바뀜 (--changed 로 다시 만든다)', ok: '있음' }[state];
    console.log(`${s.id.padEnd(24)} ${s.kind.padEnd(6)} 원본 ${text}${made ? ` · 게임 ${made.d}초${made.loop ? ` (반복 ${made.loop}초)` : ''}` : ''}`);
  }
  console.log(`\n모두 ${tables().sounds.length}개 — 있음 ${count.ok}, 표가 바뀜 ${count.stale}, 없음 ${count.none}`);
}

async function make() {
  const todo = picked().filter((s) => {
    const state = rawState(s);
    return opts.force || state === 'none' || (opts.changed && state === 'stale');
  });
  if (!todo.length) {
    console.log('새로 만들 소리가 없습니다. (다시 만들려면 --force, 표가 바뀐 것만 다시 만들려면 --changed)');
    return;
  }
  const total = todo.reduce((sum, s) => sum + estimate(s), 0);
  console.log(`만들 소리 ${todo.length}개, 예상 ${total} 크레딧 (${todo.reduce((sum, s) => sum + s.seconds, 0).toFixed(1)}초 분량)`);
  if (!opts.yes) {
    for (const s of todo) console.log(`  ${s.id.padEnd(24)} ${s.kind.padEnd(6)} ${String(s.seconds).padStart(4)}초  ${s.prompt.slice(0, 90)}`);
    console.log('\n실제로 만들려면 같은 명령에 --yes 를 붙여 주세요 (요금 발생).');
    return;
  }
  // 동시 실행 한도 안에서 함께 만든다. 하나가 실패하면 나머지 대기 중인 것은 시작하지 않는다
  const queue = [...todo];
  const done = [];
  let spent = 0;
  let error = null;
  const worker = async () => {
    while (queue.length && !error) {
      const s = queue.shift();
      try {
        const cost = await generate(s);
        spent += cost;
        done.push(s);
        console.log(`  생성 ${s.id.padEnd(24)} ${cost} 크레딧`);
      } catch (e) {
        error = e;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, num('api.parallel')) }, worker));
  console.log(`생성 ${done.length}개, 쓴 크레딧 ${spent}`);
  if (done.length) processMany(done);
  if (error) throw error;
}

function check() {
  const index = readJson(join(OUT_DIR, 'index.json'))?.sounds ?? {};
  console.log('이름                      길이    최댓값  큰구간   앞/뒤 크기   비고');
  for (const s of picked()) {
    const out = paths(s.id).out;
    if (!existsSync(out)) {
      console.log(`${s.id.padEnd(24)} (없음)`);
      continue;
    }
    const pcm = readAudio(out, index[s.id]?.ch ?? 1);
    const edge = edgeLevel(pcm);
    const loop = index[s.id]?.loop;
    const notes = [];
    if (loop) {
      const bpm = estimateBpm(slice(pcm, 0, loop * pcm.rate));
      notes.push(`반복 ${loop}초, 이음매 ${index[s.id].seam}${bpm ? `, 약 ${bpm} BPM (${((loop * bpm) / 240).toFixed(2)}마디)` : ''}`);
    }
    if (peak(pcm) > 0.999) notes.push('최댓값이 한계에 닿음');
    console.log(
      `${s.id.padEnd(24)} ${secondsOf(pcm).toFixed(2).padStart(6)}초 ${toDb(peak(pcm)).toFixed(1).padStart(6)} ${toDb(loudest(pcm)).toFixed(1).padStart(6)}   ${edge.head.toFixed(2)} / ${edge.tail.toFixed(2)}   ${notes.join(' · ')}`,
    );
  }
}

try {
  if (cmd === 'status') status();
  else if (cmd === 'make') await make();
  else if (cmd === 'process') processMany(picked().filter((s) => existsSync(paths(s.id).raw)));
  else if (cmd === 'check') check();
  else {
    console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(0, 16).join('\n'));
    process.exitCode = cmd ? 1 : 0;
  }
} catch (e) {
  if (!(e instanceof SoundError)) throw e;
  console.error(`\n오류: ${e.message}`);
  process.exitCode = 1;
}
