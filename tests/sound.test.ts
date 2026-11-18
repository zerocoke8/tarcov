// 소리 검사: 제작 도구의 소리 계산, 게임 쪽 섞기 계산, 표끼리의 연결(일 → 소리 → 파일),
// 그리고 규칙 코드가 알리는 일마다 낼 소리가 정해져 있는지.
import { describe, expect, it } from 'vitest';
import { falloff, loopSlot, panOf, pickOther, volumeCurve } from '../src/audio/mix';
import { BGM, CUES, bgmFor, findCue } from '../src/audio/tables';
import { csvRecords } from '../src/core/csv';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import { WEAPON_TYPES } from '../src/data/types';
import { nullFx, type FxApi } from '../src/game/entities';
import { emptyInput, type InputAction } from '../src/game/input';
import { KITS } from '../src/game/player/kits';
import { RunState } from '../src/game/run/RunState';
import { buildSector } from '../src/game/run/sector';
import { World } from '../src/game/world/World';
import {
  appendHead,
  crossfadeLoop,
  edgeLevel,
  estimateBpm,
  fade,
  lengthOf,
  loudest,
  normalize,
  peak,
  seamJump,
  secondsOf,
  toDb,
  trimSilence,
  type Pcm,
} from '../tools/sound/lib/pcm';

const RATE = 8000;
const pcm = (seconds: number, fn: (t: number) => number): Pcm => ({
  rate: RATE,
  ch: [Float32Array.from({ length: Math.round(seconds * RATE) }, (_, i) => fn(i / RATE))],
});
const tone = (hz: number, amp = 0.5) => (t: number): number => amp * Math.sin(2 * Math.PI * hz * t);

// 파일 내용을 글자로 읽는다 (Vite 의 ?raw)
const raw = (pattern: Record<string, string>): string[] => Object.values(pattern);
const gameFiles = raw(import.meta.glob<string>('/src/game/**/*.ts', { eager: true, query: '?raw', import: 'default' }));
const viewFiles = raw(import.meta.glob<string>(['/src/ui/**/*.ts', '/src/render/**/*.ts', '/src/Game.ts'], { eager: true, query: '?raw', import: 'default' }));
const soundsCsv = raw(import.meta.glob<string>('/data/sound/sounds.csv', { eager: true, query: '?raw', import: 'default' }))[0];
interface Index {
  sounds: Record<string, { v: string; d: number; loop?: number; ch?: number }>;
}
const index = Object.values(import.meta.glob<Index>('/public/sound/index.json', { eager: true, import: 'default' }))[0];
const mp3 = new Set(Object.keys(import.meta.glob('/public/sound/*.mp3')).map((p) => p.slice('/public/sound/'.length, -'.mp3'.length)));

const SOUNDS = new Map(csvRecords(soundsCsv).rows.map((r) => [r.cells.id, r.cells]));
const all = (texts: string[], re: RegExp): string[] => [...new Set(texts.flatMap((t) => [...t.matchAll(re)].map((m) => m[1])))];

describe('소리 다듬기 (제작 도구)', () => {
  it('앞뒤의 무음을 자르고, 소리의 처음과 꼬리는 조금 남긴다', () => {
    // 0.3초 무음 + 0.2초 소리 + 0.5초 무음
    const p = pcm(1, (t) => (t >= 0.3 && t < 0.5 ? tone(440)(t) : 0));
    const out = trimSilence(p, -40, 0.005, 0.05);
    expect(secondsOf(out)).toBeGreaterThan(0.2);
    expect(secondsOf(out)).toBeLessThan(0.3);
    // 잘라 낸 것의 맨 앞은 소리가 시작되기 직전이다
    expect(edgeLevel(out, 0.03).head).toBeGreaterThan(0.5);
  });

  it('소리가 없으면 빈 결과를 돌려준다', () => {
    expect(lengthOf(trimSilence(pcm(0.5, () => 0), -40))).toBe(0);
  });

  it('앞과 끝을 부드럽게 올리고 내린다', () => {
    const out = fade(pcm(0.5, () => 0.5), 0.01, 0.05);
    const c = out.ch[0];
    expect(c[0]).toBe(0);
    expect(c[c.length - 1]).toBeCloseTo(0, 5);
    expect(c[Math.round(c.length / 2)]).toBeCloseTo(0.5, 5);
  });

  it('크기를 맞춘다: 들리는 크기를 목표에 맞추되 가장 큰 샘플이 한계를 넘지 않는다', () => {
    // 고른 소리는 들리는 크기로 맞는다
    const steady = normalize(pcm(1, tone(200, 0.05)), -15, -1).pcm;
    expect(toDb(loudest(steady))).toBeCloseTo(-15, 0);
    // 순간만 큰 소리는 한계에 걸린다 (더 키우면 깨진다)
    const click = normalize(pcm(1, (t) => (t < 0.002 ? 0.5 : 0.001)), -15, -1).pcm;
    expect(toDb(peak(click))).toBeCloseTo(-1, 1);
    expect(toDb(loudest(click))).toBeLessThan(-15);
  });

  it('반복음: 맨 앞부분을 끝에 덧붙인다 (게임이 겹쳐 틀 구간)', () => {
    const p = pcm(2, tone(100));
    const out = appendHead(p, 0.5);
    expect(secondsOf(out)).toBeCloseTo(2.5, 5);
    const n = lengthOf(p);
    for (const i of [0, 100, 3999]) expect(out.ch[0][n + i]).toBe(p.ch[0][i]);
  });

  it('음악: 끝이 처음으로 그대로 이어지는 구간을 만든다', () => {
    // 높낮이가 계속 올라가는 소리는 그냥 자르면 이음매에서 튄다
    const sweep = pcm(6, (t) => 0.5 * Math.sin(2 * Math.PI * (80 + 15 * t) * t));
    const cut = crossfadeLoop(sweep, 1, 4, 0.0001);
    const smooth = crossfadeLoop(sweep, 1, 4, 0.5);
    expect(secondsOf(smooth)).toBeCloseTo(4, 3);
    expect(seamJump(smooth)).toBeLessThan(2);
    // 구간의 끝은 구간 직전의 소리(= 처음으로 이어지는 소리)다
    const s = sweep.ch[0];
    expect(smooth.ch[0][lengthOf(smooth) - 1]).toBeCloseTo(s[RATE - 1], 1);
    expect(secondsOf(cut)).toBeCloseTo(4, 3);
    expect(() => crossfadeLoop(sweep, 0.2, 4, 0.5)).toThrow();
  });

  it('박자의 빠르기를 어림한다', () => {
    // 0.5초마다 짧게 울리는 소리 = 120 BPM
    const beat = pcm(12, (t) => (t % 0.5 < 0.03 ? tone(300)(t) : 0));
    expect(estimateBpm(beat)).toBeCloseTo(120, 0);
    // 박자가 없는 고른 소리
    expect(estimateBpm(pcm(6, tone(200)))).toBe(0);
  });
});

describe('소리 섞기 (게임)', () => {
  it('멀리서 난 소리는 작아지고 아주 멀면 들리지 않는다', () => {
    expect(falloff(100, 300, 1000)).toBe(1);
    expect(falloff(650, 300, 1000)).toBeCloseTo(0.5, 5);
    expect(falloff(1200, 300, 1000)).toBe(0);
  });

  it('옆에서 난 소리는 그쪽으로 치우치되 한도를 넘지 않는다', () => {
    expect(panOf(0, 600, 0.6)).toBe(0);
    expect(panOf(300, 600, 0.6)).toBeCloseTo(0.3, 5);
    expect(panOf(-5000, 600, 0.6)).toBe(-0.6);
  });

  it('같은 소리를 연달아 고르지 않는다', () => {
    for (let i = 0; i < 50; i++) {
      const r = i / 50;
      expect(pickOther(2, 0, r)).toBe(1);
      expect(pickOther(3, 1, r)).not.toBe(1);
      expect(pickOther(1, 0, r)).toBe(0);
      expect(pickOther(3, -1, r)).toBeLessThan(3);
    }
  });

  it('음량 막대의 가운데는 절반보다 작은 배율이다 (귀에 절반쯤으로 들리게)', () => {
    expect(volumeCurve(0)).toBe(0);
    expect(volumeCurve(1)).toBe(1);
    expect(volumeCurve(0.5)).toBeLessThan(0.5);
  });

  it('반복 재생은 주기마다 겹쳐 시작하고, 겹치는 동안 앞의 것이 줄어든다', () => {
    const a = loopSlot(10, 30, 1, 0);
    const b = loopSlot(10, 30, 1, 1);
    // 첫 재생은 처음부터 다 켜져 있다
    expect(a.fadeInEnd).toBe(a.at);
    // 다음 재생이 시작될 때 앞의 것이 줄기 시작하고, 둘이 같은 시간에 끝난다
    expect(b.at).toBe(a.fadeOutAt);
    expect(b.fadeInEnd).toBe(a.end);
    expect(b.at).toBe(40);
  });
});

describe('소리 표', () => {
  it('효과음 표가 가리키는 소리는 모두 소리 목록에 있다', () => {
    expect(CUES.size).toBeGreaterThan(80);
    for (const def of CUES.values()) {
      for (const id of def.sounds) expect(SOUNDS.has(id), `cues.csv 의 "${def.cue}" 가 쓰는 소리 "${id}" 가 sounds.csv 에 없습니다`).toBe(true);
    }
  });

  it('배경음 표가 가리키는 소리는 모두 반복음이다', () => {
    for (const def of BGM.values()) {
      for (const id of [def.music, def.ambience].filter(Boolean)) {
        expect(['loop', 'music'], `bgm.csv 의 "${def.where}" 가 쓰는 "${id}"`).toContain(SOUNDS.get(id)?.kind);
      }
    }
  });

  it('만들어 놓고 쓰지 않는 소리가 없다', () => {
    const used = new Set([...[...CUES.values()].flatMap((c) => c.sounds), ...[...BGM.values()].flatMap((b) => [b.music, b.ambience])]);
    for (const id of SOUNDS.keys()) expect(used.has(id), `"${id}" 는 어디에서도 쓰이지 않습니다`).toBe(true);
  });

  it('표의 소리는 모두 만들어져 게임 폴더에 있다', () => {
    for (const [id, row] of SOUNDS) {
      const info = index.sounds[id];
      expect(info, `"${id}" 가 public/sound/index.json 에 없습니다 (npm run sound -- make)`).toBeTruthy();
      expect(mp3.has(id), `public/sound/${id}.mp3 가 없습니다`).toBe(true);
      expect(info.d).toBeGreaterThan(0.05);
      if (row.kind === 'loop' || row.kind === 'music') {
        // 반복음: 반복 주기가 있고, 그 뒤에 겹쳐 틀 구간이 붙어 있다
        expect(info.loop, `"${id}" 의 반복 주기`).toBeGreaterThan(5);
        expect(info.d).toBeGreaterThan(info.loop!);
      } else {
        expect(info.loop).toBeUndefined();
        expect(info.d).toBeLessThanOrEqual(Number(row.seconds) + 0.3);
      }
    }
  });

  it('화면과 표시부가 부르는 소리 이름은 모두 표에 있다', () => {
    const cues = all(viewFiles, /audio\.(?:cue|jingle)\(\s*'([^']+)'/g);
    expect(cues.length).toBeGreaterThan(10);
    for (const name of cues) expect(findCue(name), `"${name}" 가 cues.csv 에 없습니다`).toBeTruthy();
    // 버튼이 내는 소리 (data-snd 와 버튼 종류별 기본 소리)
    for (const name of ['ui.click', 'ui.confirm', 'ui.back', 'ui.pick', 'ui.equip', 'ui.open']) expect(findCue(name), name).toBeTruthy();
  });

  it('규칙 코드가 알리는 소리 이름은 모두 표에 있다 (종류가 붙는 것은 종류별 줄이 하나라도 있다)', () => {
    const names = all(gameFiles, /\.fx\.sound\(\s*'([^']+)'/g);
    expect(names.length).toBeGreaterThan(20);
    const keys = [...CUES.keys()];
    for (const name of names) {
      expect(keys.some((k) => k === name || k.startsWith(`${name}.`)), `fx.sound('${name}') 에 맞는 줄이 cues.csv 에 없습니다`).toBe(true);
    }
  });

  it('몬스터마다 공격을 예고하는 소리가 있고, 무기 종류마다 타격음이 있다', () => {
    for (const m of db.monsters.values()) expect(findCue('mon.windup', m.id)?.cue, m.id).toBe(`mon.windup.${m.id}`);
    for (const t of WEAPON_TYPES) expect(findCue('hit', t)?.cue, t).toBe(`hit.${t}`);
    for (const size of ['S', 'M', 'L']) expect(findCue('die', size), size).toBeTruthy();
  });

  it('종류별 줄이 없으면 이름만 있는 줄을 쓴다', () => {
    expect(findCue('hit', '없는무기')?.cue).toBe('hit');
    expect(findCue('hit')?.cue).toBe('hit');
    expect(findCue('없는이름')).toBeUndefined();
  });

  it('모든 섹터와 화면에 배경음이 정해져 있다', () => {
    for (const where of ['lobby', 'camp', 'challenge']) expect(BGM.get(where)?.music, where).toBeTruthy();
    for (const s of db.sectors) {
      const def = bgmFor(s.type === 'boss' ? [`boss.${s.season}`, `scene.${s.scene}`] : [`scene.${s.scene}`]);
      expect(def?.music, `시즌 ${s.season} 섹터 ${s.index} (${s.scene})`).toBeTruthy();
      // 보스 섹터는 보스 음악이다
      if (s.type === 'boss') expect(def?.where).toBe(`boss.${s.season}`);
    }
  });
});

// ---- 전투에서 실제로 알리는 일 ------------------------------------------------

interface Heard {
  name: string;
  style?: string;
}

/** 소리로 알린 일을 받아 적는 표시부 */
function listen(w: World): Heard[] {
  const heard: Heard[] = [];
  const fx: FxApi = {
    ...nullFx,
    play: (name, _x, _y, o) => heard.push({ name, style: o?.style }),
    sound: (name, _x, _y, style) => heard.push({ name, style }),
  };
  w.fx = fx;
  return heard;
}

function world(team: string[], season: number, sector: number, pet = 'A'): World {
  const run = RunState.create(team, pet, 'form', season);
  run.sector = sector;
  const rng = new Rng(7);
  const w = new World(run, buildSector(run, db.sector(sector), rng), rng);
  w.cheatInvuln = true;
  return w;
}

function run(w: World, seconds: number, attack: boolean, actions: InputAction[] = []): void {
  const input = emptyInput();
  input.attack = attack;
  input.actions.push(...actions);
  for (let t = 0; t < seconds && !w.over; t += 1 / 30) {
    w.update(1 / 30, input);
    input.attack = attack;
  }
}

/**
 * 일부러 소리를 두지 않은 것. 여기에 없는데 표에도 없는 일이 나오면 검사가 실패하므로,
 * 새 발사체·범위 효과를 넣을 때 소리를 정하거나(cues.csv) 여기에 이유와 함께 적게 된다.
 */
const SILENT = new Set([
  'zone.aim', // 라온의 조준 표시 (내려찍을 때 raon.slam 이 난다)
  'zone.fissure', // 에트나의 균열 (serin.ult 가 난다)
  'zone.flag', // 이브의 깃발 (eve.flag 가 난다)
  'zone.storm', // 이브의 진군 나팔 (eve.ult 가 난다)
  'zone.spore', // 포자 구름 (spore.burst 가 난다)
  'zone.burn', // 불기둥이 남긴 불 (fire.burst 가 난다)
  'zone.clone', // 마녀 인형의 잔상 (fire.burst 가 난다)
  'interact.exit', // 출구로 나감 (바로 클리어 징글이 난다)
  // 그림만 있는 이펙트 (소리는 발사체·타격 쪽에서 난다)
  'muzzle',
  'serin.wave',
  'sia.ult.cast',
]);

describe('전투에서 나는 소리', () => {
  it('캐릭터 아홉 명이 싸우는 동안 알리는 일마다 낼 소리가 있다', () => {
    const missing = new Set<string>();
    const kinds = new Set<string>();
    const ids = db.charList.filter((c) => KITS[c.id]).map((c) => c.id);
    for (const [i, id] of ids.entries()) {
      const w = world([id, ids[(i + 1) % ids.length], ids[(i + 2) % ids.length]], 2, 3, 'ABCD'[i % 4]);
      const heard = listen(w);
      // 적을 곁에 세워 두고 기본 공격 → 액티브 → 궁극기 → 펫 → 회피 → 교체
      for (const e of w.enemies) w.kill(e, null, true);
      for (const [dx, dy] of [[70, 0], [110, 40], [150, -40]]) {
        const e = w.spawnEnemy('tinman', 0, w.party.x + dx, w.party.y + dy);
        e.maxHp = e.hp = 1e7;
      }
      w.party.active.ult = db.P('ult.max');
      run(w, 2.5, true);
      run(w, 2, false, [{ type: 'active' }]);
      run(w, 3, false, [{ type: 'ult' }]);
      run(w, 2, true, [{ type: 'pet' }]);
      run(w, 1, false, [{ type: 'dodge' }]);
      run(w, 1, true, [{ type: 'swap', index: 1 }]);
      for (const h of heard) {
        kinds.add(h.style ? `${h.name}.${h.style}` : h.name);
        if (!findCue(h.name, h.style) && !SILENT.has(h.style ? `${h.name}.${h.style}` : h.name) && !SILENT.has(h.name)) missing.add(h.style ? `${h.name}.${h.style}` : h.name);
      }
    }
    expect([...missing], '소리가 정해지지 않은 일').toEqual([]);
    // 기본 공격은 무기마다 다른 소리를 낸다
    for (const k of ['swing.greatsword', 'swing.daggers', 'swing.hammer', 'swing.lance', 'shot.bolt', 'shot.arrow', 'shot.pellet', 'shot.bullet', 'shot.talisman']) {
      expect(kinds.has(k), k).toBe(true);
    }
    for (const k of ['dash', 'swap', 'cast.ult', 'pet.use.A', 'pet.boom', 'zone.heal', 'zone.slow', 'barrier', 'mon.windup.tinman', 'enemy.slam.tinman']) expect(kinds.has(k), k).toBe(true);
  });

  it('두 시즌의 섹터를 자동으로 싸우는 동안에도 소리가 정해지지 않은 일이 없다', () => {
    const missing = new Set<string>();
    const kinds = new Set<string>();
    for (const [season, sectors] of [[1, [1, 3, 5, 9]], [2, [1, 2, 4, 6]]] as [number, number[]][]) {
      for (const sector of sectors) {
        const w = world(['serin', 'karen', 'roa'], season, sector, 'B');
        const heard = listen(w);
        // 모든 무리를 깨워 파티 곁으로 불러 모은다
        for (const e of w.enemies) {
          w.aggro(e);
          e.x = w.party.x + 120 + (e.id % 5) * 30;
          e.y = w.party.y + ((e.id % 7) - 3) * 30;
        }
        run(w, 14, true);
        for (const h of heard) {
          const k = h.style ? `${h.name}.${h.style}` : h.name;
          kinds.add(k);
          if (!findCue(h.name, h.style) && !SILENT.has(k) && !SILENT.has(h.name)) missing.add(k);
        }
      }
    }
    expect([...missing], '소리가 정해지지 않은 일').toEqual([]);
    // 맞고, 쓰러뜨리고, 조각을 얻는 소리가 난다
    for (const k of ['hit.greatsword', 'die.S', 'shard', 'mon.windup.wisp', 'mon.windup.witch', 'boss.intro']) expect(kinds.has(k), k).toBe(true);
  });

  it('파티가 맞으면 맞는 소리가, 쓰러지면 쓰러지는 소리가 난다', () => {
    const w = world(['serin', 'karen', 'roa'], 1, 1);
    w.cheatInvuln = false;
    const heard = listen(w);
    w.hurt(10);
    expect(heard.some((h) => h.name === 'hurt')).toBe(true);
    w.party.hitInvulnT = 0;
    w.hurt(1e9);
    expect(heard.some((h) => h.name === 'down')).toBe(true);
    // 다음 캐릭터가 들어오는 소리
    expect(heard.some((h) => h.name === 'swap')).toBe(true);
  });

  it('수색을 시작하면 뒤지는 소리가, 마치면 얻는 소리가 난다', () => {
    const w = world(['serin', 'karen', 'roa'], 1, 1);
    for (const e of w.enemies) w.kill(e, null, true);
    const heard = listen(w);
    const t = w.things.find((x) => x.kind === 'crate' || x.kind === 'medkit' || x.kind === 'relic');
    expect(t, '수색 오브젝트').toBeTruthy();
    w.party.x = t!.x;
    w.party.y = t!.y + 20;
    // 한 프레임이 지나야 가까운 오브젝트로 잡힌다
    run(w, 0.05, false);
    run(w, 0.1, false, [{ type: 'interact' }]);
    expect(heard.filter((h) => h.name === 'interact').length).toBe(1);
    run(w, db.P('search.time') + 0.5, false);
    expect(heard.some((h) => h.name === 'pickup')).toBe(true);
  });
});
