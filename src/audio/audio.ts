// 소리 재생: 효과음(이름으로 부르는 cue), 배경 음악과 환경음(끊김 없는 반복), 음량 설정.
//
// - 무슨 일에 어떤 소리가 나는지는 data/sound/cues.csv, 어디서 어떤 배경음이 나는지는 data/sound/bgm.csv 에 있다.
// - 소리 파일과 그 목록(public/sound/index.json)은 제작 도구(npm run sound)가 만든다. 목록에 없는 소리는 나지 않을 뿐 오류가 아니다.
// - 브라우저는 사용자가 화면을 한 번 누르기 전에는 소리를 내지 못한다. 그 전에 요청된 배경음은 기억해 두었다가 누르는 순간 시작한다.
import { db } from '../data/tables';
import { falloff, loopSlot, panOf, pickOther, unit, volumeCurve } from './mix';
import { bgmFor, findCue, type CueDef } from './tables';

interface SoundInfo {
  /** 파일 지문 (캐시를 피하는 데 쓴다) */
  v: string;
  /** 길이(초) */
  d: number;
  /** 반복 주기(초). 있으면 끊김 없이 반복되는 소리다 (길이는 주기 + 겹침) */
  loop?: number;
}

export interface AudioSettings {
  /** 전체 / 배경음 / 효과음 음량 (0~1) */
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
}

export interface CueOpts {
  /** 소리가 난 곳 (월드 좌표). 주면 듣는 곳에서 멀수록 작아지고 좌우로 치우친다 */
  x?: number;
  y?: number;
  /** 종류. "이름.종류" 줄이 표에 있으면 그것을 쓴다 */
  style?: string;
}

const BASE = `${import.meta.env.BASE_URL}sound/`;
const SETTINGS_KEY = 'tarcov.audio.v1';

interface Track {
  id: string;
  gain: GainNode;
  buffer: AudioBuffer;
  period: number;
  cross: number;
  startAt: number;
  /** 다음에 예약할 반복 번호 */
  next: number;
  sources: AudioBufferSourceNode[];
}

/** 끊김 없이 반복되는 소리 한 줄 (배경 음악, 환경음). 다른 소리로 바꾸면 서서히 넘어간다 */
class LoopChannel {
  /** 틀려는 소리 ('' = 없음) */
  id = '';
  private volume = 1;
  private track: Track | null = null;

  constructor(
    private eng: AudioEngine,
    private out: () => AudioNode | null,
  ) {}

  set(id: string, volume: number, fade: number): void {
    this.volume = volume;
    if (id === this.id) {
      const ctx = this.eng.ctx;
      if (this.track && ctx) this.ramp(this.track.gain, volume, 0.4);
      return;
    }
    this.id = id;
    this.stop(fade);
    this.begin(fade);
  }

  /** 틀려는 소리가 있는데 아직 나고 있지 않으면 시작한다 (화면을 처음 눌렀을 때, 파일이 도착했을 때) */
  begin(fade = db.P('sound.musicFade')): void {
    const id = this.id;
    if (!id || this.track || !this.eng.ctx) return;
    void this.eng.buffer(id).then((buffer) => {
      const ctx = this.eng.ctx;
      const out = this.out();
      if (!buffer || !ctx || !out || this.id !== id || this.track) return;
      const info = this.eng.info(id);
      const period = info?.loop ?? buffer.duration;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(out);
      this.track = { id, gain, buffer, period, cross: Math.max(0, (info?.d ?? buffer.duration) - period), startAt: ctx.currentTime + 0.05, next: 0, sources: [] };
      this.ramp(gain, this.volume, fade);
      this.update();
    });
  }

  /** 다음 반복을 미리 예약한다. 매 프레임 부른다 */
  update(): void {
    const t = this.track;
    const ctx = this.eng.ctx;
    if (!t || !ctx) return;
    while (loopSlot(t.startAt, t.period, t.cross, t.next).at < ctx.currentTime + 1) {
      const s = loopSlot(t.startAt, t.period, t.cross, t.next);
      // 예약이 늦었으면(화면이 멈췄다 돌아온 경우) 박자를 잃지 않게 그만큼 건너뛴 곳부터 튼다
      const late = Math.max(0, ctx.currentTime - s.at);
      if (late < t.period) {
        const src = ctx.createBufferSource();
        src.buffer = t.buffer;
        const g = ctx.createGain();
        if (t.next === 0 || t.cross <= 0) g.gain.setValueAtTime(1, s.at);
        else {
          g.gain.setValueAtTime(0, s.at);
          g.gain.linearRampToValueAtTime(1, s.fadeInEnd);
        }
        if (t.cross > 0) {
          g.gain.setValueAtTime(1, s.fadeOutAt);
          g.gain.linearRampToValueAtTime(0, s.end);
        }
        src.connect(g).connect(t.gain);
        src.start(s.at + late, late);
        src.stop(s.end + 0.05);
        t.sources.push(src);
        src.onended = () => {
          g.disconnect();
          const i = t.sources.indexOf(src);
          if (i >= 0) t.sources.splice(i, 1);
        };
      }
      t.next++;
    }
  }

  private stop(fade: number): void {
    const t = this.track;
    const ctx = this.eng.ctx;
    this.track = null;
    if (!t || !ctx) return;
    this.ramp(t.gain, 0, fade);
    setTimeout(
      () => {
        for (const src of t.sources.splice(0)) {
          src.onended = null;
          try {
            src.stop();
          } catch {
            // 아직 시작하지 않은 예약은 멈출 것이 없다
          }
          src.disconnect();
        }
        t.gain.disconnect();
      },
      fade * 1000 + 80,
    );
  }

  private ramp(gain: GainNode, to: number, time: number): void {
    const ctx = this.eng.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(to, now + Math.max(0.01, time));
  }
}

export class AudioEngine {
  ctx: AudioContext | null = null;
  settings: AudioSettings;
  /** 듣는 곳 (필드 캐릭터의 위치). 전투 밖에서는 null */
  listener: { x: number; y: number } | null = null;
  /** 검사용: cue 이름마다 소리를 낸(내려 한) 횟수 */
  readonly counts: Record<string, number> = {};

  private index = new Map<string, SoundInfo>();
  private ready: Promise<void> | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private loading = new Map<string, Promise<AudioBuffer | null>>();
  private decoder: BaseAudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  /** 징글이 나는 동안 배경음을 줄이는 단 */
  private duck: GainNode | null = null;
  private lastAt = new Map<string, number>();
  private lastPick = new Map<string, number>();
  private voices = 0;
  private music = new LoopChannel(this, () => this.duck);
  private ambience = new LoopChannel(this, () => this.duck);
  /** 최근에 쓴 배경음 (오래된 것부터 메모리에서 내린다) */
  private recentLoops: string[] = [];

  constructor() {
    this.settings = this.loadSettings();
  }

  // ---- 준비 ---------------------------------------------------------------

  /** 소리 목록을 읽고 효과음을 미리 받아 둔다. 화면을 누를 때마다 소리가 막혀 있지 않은지 본다 */
  init(): void {
    if (this.ready || typeof window === 'undefined') return;
    this.ready = fetch(`${BASE}index.json`, { cache: 'no-cache' })
      .then((res) => (res.ok ? res.json() : { sounds: {} }))
      .then((data: { sounds?: Record<string, SoundInfo> }) => {
        for (const [id, info] of Object.entries(data.sounds ?? {})) this.index.set(id, info);
        void this.preload();
      })
      .catch(() => {
        // 목록을 읽지 못하면 소리 없이 진행한다
      });
    for (const type of ['pointerdown', 'touchend', 'keydown'] as const) window.addEventListener(type, () => this.unlock(), { capture: true, passive: true });
    document.addEventListener('visibilitychange', () => {
      // 화면이 꺼지거나 다른 탭으로 가면 소리를 멈춘다
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  /** 한 번 나고 끝나는 소리(효과음·징글)를 모두 미리 받아 풀어 둔다. 배경음은 쓸 때 받는다 */
  private async preload(): Promise<void> {
    const ids = [...this.index].filter(([, info]) => info.loop === undefined).map(([id]) => id);
    const worker = async (): Promise<void> => {
      for (let id = ids.shift(); id !== undefined; id = ids.shift()) await this.buffer(id);
    };
    await Promise.all([worker(), worker(), worker()]);
  }

  info(id: string): SoundInfo | undefined {
    return this.index.get(id);
  }

  /** 소리 파일을 받아 풀어 놓은 것. 목록에 없거나 받지 못하면 null */
  buffer(id: string): Promise<AudioBuffer | null> {
    const have = this.buffers.get(id);
    if (have) return Promise.resolve(have);
    let p = this.loading.get(id);
    if (!p) {
      p = (this.ready ?? Promise.resolve())
        .then(async () => {
          const info = this.index.get(id);
          if (!info) return null;
          const res = await fetch(`${BASE}${id}.mp3?v=${info.v}`);
          if (!res.ok) return null;
          const buffer = await this.decode(await res.arrayBuffer());
          this.buffers.set(id, buffer);
          return buffer;
        })
        .catch(() => null)
        .finally(() => this.loading.delete(id));
      this.loading.set(id, p);
    }
    return p;
  }

  /** 화면을 누르기 전에도 풀 수 있게, 소리를 내지 않는 풀이 전용 컨텍스트를 쓴다 */
  private decode(data: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.decoder) {
      const Offline = window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
      if (Offline) this.decoder = new Offline(1, 1, 44100);
    }
    // 풀이 전용 컨텍스트를 만들 수 없는 브라우저에서는 화면을 누른 뒤에 생기는 컨텍스트로 푼다
    const ctx = this.decoder ?? this.ctx;
    if (!ctx) return Promise.reject(new Error('아직 소리를 풀 수 없습니다'));
    return new Promise((resolve, reject) => void ctx.decodeAudioData(data, resolve, reject));
  }

  /** 사용자가 화면을 눌렀을 때: 소리를 낼 수 있게 열고, 기억해 둔 배경음을 시작한다 */
  private unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      this.ctx = ctx;
      // 여러 소리가 겹쳐 한계를 넘으려 할 때만 눌러 준다 (평소에는 손대지 않는다)
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -4;
      limiter.knee.value = 4;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.12;
      limiter.connect(ctx.destination);
      this.master = ctx.createGain();
      this.master.connect(limiter);
      this.sfxBus = ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus = ctx.createGain();
      this.musicBus.connect(this.master);
      this.duck = ctx.createGain();
      this.duck.connect(this.musicBus);
      this.applySettings();
    }
    if (this.ctx.state !== 'running' && !document.hidden) void this.ctx.resume();
    this.music.begin();
    this.ambience.begin();
  }

  /** 매 프레임: 배경음의 다음 반복을 예약한다 */
  update(): void {
    this.music.update();
    this.ambience.update();
  }

  // ---- 효과음 -------------------------------------------------------------

  /**
   * 일어난 일의 이름으로 효과음을 낸다. 표(cues.csv)에 없는 이름은 아무 소리도 내지 않는다.
   * 같은 cue 가 짧은 사이에 여러 번 불리면 한 번만 난다 (한 번 휘둘러 여럿을 맞혔을 때 등).
   */
  cue(name: string, o: CueOpts = {}): void {
    const def = findCue(name, o.style);
    if (!def) return;
    const now = performance.now() / 1000;
    if (now - (this.lastAt.get(def.cue) ?? -99) < def.cooldown) return;
    let volume = def.volume;
    let pan = 0;
    if (this.listener && o.x !== undefined && o.y !== undefined) {
      const dx = o.x - this.listener.x;
      volume *= falloff(Math.hypot(dx, o.y - this.listener.y), db.P('sound.hearNear'), db.P('sound.hearFar'));
      pan = panOf(dx, db.P('sound.panWidth'), db.pct('sound.panLimit'));
    }
    if (volume < 0.02) return;
    this.lastAt.set(def.cue, now);
    this.counts[def.cue] = (this.counts[def.cue] ?? 0) + 1;
    this.play(def, volume, pan);
  }

  private play(def: CueDef, volume: number, pan: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || ctx.state !== 'running' || this.voices >= db.P('sound.maxVoices')) return;
    const pick = pickOther(def.sounds.length, this.lastPick.get(def.cue) ?? -1, Math.random());
    this.lastPick.set(def.cue, pick);
    const buffer = this.buffers.get(def.sounds[pick]);
    if (!buffer) {
      // 아직 받지 못한 소리는 이번에는 넘어가고, 다음을 위해 받아 둔다
      void this.buffer(def.sounds[pick]);
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    if (def.pitch > 0) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * def.pitch;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    let tail: AudioNode = gain;
    if (pan !== 0 && typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      gain.connect(panner);
      tail = panner;
    }
    src.connect(gain);
    tail.connect(this.sfxBus);
    this.voices++;
    src.onended = () => {
      this.voices--;
      tail.disconnect();
    };
    src.start();
  }

  /**
   * 징글(클리어·전멸 같은 짧은 음악)을 낸다. 효과음과 같은 표(cues.csv)에서 찾지만 배경음 쪽 음량을 따르고,
   * 나는 동안 배경음을 줄였다가 되돌린다
   */
  jingle(name: string): void {
    const def = findCue(name);
    if (!def) return;
    this.counts[def.cue] = (this.counts[def.cue] ?? 0) + 1;
    void this.buffer(def.sounds[0]).then((buffer) => {
      const ctx = this.ctx;
      if (!buffer || !ctx || !this.musicBus || !this.duck || ctx.state !== 'running') return;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = def.volume;
      src.connect(gain).connect(this.musicBus);
      src.onended = () => gain.disconnect();
      src.start();
      const now = ctx.currentTime;
      const g = this.duck.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(db.pct('sound.duck'), now + 0.15);
      g.setValueAtTime(db.pct('sound.duck'), now + Math.max(0.2, buffer.duration - 0.4));
      g.linearRampToValueAtTime(1, now + buffer.duration + 0.8);
    });
  }

  // ---- 배경음 -------------------------------------------------------------

  /**
   * 지금 있는 곳의 배경음으로 바꾼다. keys 는 bgm.csv 의 where 를 우선순위대로 적은 것이고, 처음 찾은 줄을 쓴다.
   * 같은 음악이 이미 나고 있으면 끊지 않고 이어 간다. null 이면 서서히 끈다.
   */
  scene(keys: string[] | null, fade = db.P('sound.musicFade')): void {
    const def = keys ? bgmFor(keys) : undefined;
    this.music.set(def?.music ?? '', def?.volume ?? 1, fade);
    this.ambience.set(def?.ambience ?? '', def?.ambVolume ?? 0, fade);
    // 쓰지 않게 된 배경음은 메모리에서 내린다 (한 곡이 10MB쯤 된다). 방금 쓰던 것 몇 개는 남긴다
    for (const id of [def?.music, def?.ambience]) {
      if (!id) continue;
      this.recentLoops = [id, ...this.recentLoops.filter((x) => x !== id)];
    }
    for (const id of this.recentLoops.splice(db.P('sound.keepLoops'))) this.buffers.delete(id);
  }

  /** 지금 틀려는 배경음 (검사·표시용) */
  now(): { music: string; ambience: string; unlocked: boolean; loaded: number } {
    return { music: this.music.id, ambience: this.ambience.id, unlocked: this.ctx?.state === 'running', loaded: this.buffers.size };
  }

  // ---- 설정 ---------------------------------------------------------------

  private loadSettings(): AudioSettings {
    const base: AudioSettings = { master: db.pct('sound.master'), music: db.pct('sound.music'), sfx: db.pct('sound.sfx'), muted: false };
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null') as Partial<AudioSettings> | null;
      if (!raw) return base;
      return { master: unit(raw.master, base.master), music: unit(raw.music, base.music), sfx: unit(raw.sfx, base.sfx), muted: raw.muted === true };
    } catch {
      return base;
    }
  }

  /** 음량 설정을 바꾸고 기기에 저장한다 */
  set(change: Partial<AudioSettings>): void {
    const s = this.settings;
    this.settings = { master: unit(change.master, s.master), music: unit(change.music, s.music), sfx: unit(change.sfx, s.sfx), muted: change.muted ?? s.muted };
    this.applySettings();
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // 저장 공간을 쓸 수 없는 환경에서는 이번 실행 동안만 유지된다
    }
  }

  private applySettings(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.sfxBus || !this.musicBus) return;
    const s = this.settings;
    const to = (gain: GainNode, v: number): void => void gain.gain.setTargetAtTime(v, ctx.currentTime, 0.03);
    to(this.master, s.muted ? 0 : volumeCurve(s.master));
    to(this.sfxBus, volumeCurve(s.sfx));
    to(this.musicBus, volumeCurve(s.music));
  }
}

/** 게임 전체가 함께 쓰는 소리 엔진 */
export const audio = new AudioEngine();
