// 사운드 제작 도구의 소리 계산. 파일·프로세스를 다루지 않는 순수 함수만 둔다 (tests/sound.test.ts에서 검사).
// 생성된 소리(PCM)에서 앞뒤 무음을 자르고, 크기를 맞추고, 끊김 없이 반복되는 구간을 만든다.

/** 채널별 실수 샘플(-1 ~ 1) */
export interface Pcm {
  rate: number;
  ch: Float32Array[];
}

export const lengthOf = (p: Pcm): number => p.ch[0]?.length ?? 0;
export const secondsOf = (p: Pcm): number => lengthOf(p) / p.rate;
export const toDb = (v: number): number => (v > 0 ? 20 * Math.log10(v) : -120);
export const fromDb = (db: number): number => Math.pow(10, db / 20);

/** 한 줄로 늘어선(인터리브) 샘플을 채널별로 나눈다 */
export function deinterleave(data: Float32Array, channels: number, rate: number): Pcm {
  const n = Math.floor(data.length / channels);
  const ch = Array.from({ length: channels }, () => new Float32Array(n));
  for (let i = 0; i < n; i++) for (let c = 0; c < channels; c++) ch[c][i] = data[i * channels + c];
  return { rate, ch };
}

export function interleave(p: Pcm): Float32Array {
  const n = lengthOf(p);
  const k = p.ch.length;
  const out = new Float32Array(n * k);
  for (let i = 0; i < n; i++) for (let c = 0; c < k; c++) out[i * k + c] = p.ch[c][i];
  return out;
}

export function slice(p: Pcm, from: number, to: number): Pcm {
  const a = Math.max(0, Math.min(lengthOf(p), Math.round(from)));
  const b = Math.max(a, Math.min(lengthOf(p), Math.round(to)));
  return { rate: p.rate, ch: p.ch.map((c) => c.slice(a, b)) };
}

export function toMono(p: Pcm): Pcm {
  if (p.ch.length === 1) return p;
  const n = lengthOf(p);
  const out = new Float32Array(n);
  for (const c of p.ch) for (let i = 0; i < n; i++) out[i] += c[i] / p.ch.length;
  return { rate: p.rate, ch: [out] };
}

/** 가장 큰 샘플의 절댓값 */
export function peak(p: Pcm): number {
  let m = 0;
  for (const c of p.ch) for (let i = 0; i < c.length; i++) m = Math.max(m, Math.abs(c[i]));
  return m;
}

/** 모든 채널을 합친 구간 [from, to) 의 실효값(RMS) */
export function rms(p: Pcm, from = 0, to = lengthOf(p)): number {
  const a = Math.max(0, Math.round(from));
  const b = Math.min(lengthOf(p), Math.round(to));
  if (b <= a) return 0;
  let s = 0;
  for (const c of p.ch) for (let i = a; i < b; i++) s += c[i] * c[i];
  return Math.sqrt(s / ((b - a) * p.ch.length));
}

/** win초 길이의 창을 옮겨 가며 잰 실효값들 (창을 절반씩 겹친다) */
export function envelope(p: Pcm, win: number): number[] {
  const w = Math.max(1, Math.round(win * p.rate));
  const hop = Math.max(1, Math.floor(w / 2));
  const out: number[] = [];
  for (let i = 0; i < lengthOf(p); i += hop) out.push(rms(p, i, i + w));
  return out;
}

/**
 * 소리의 "들리는 크기": 가장 큰 구간(win초)의 실효값. 짧은 효과음은 전체 평균보다 이 값이 체감에 가깝다.
 * 소리가 창보다 짧으면 전체의 실효값이다.
 */
export function loudest(p: Pcm, win = 0.2): number {
  const env = envelope(p, Math.min(win, secondsOf(p)));
  return env.reduce((m, v) => Math.max(m, v), 0);
}

/**
 * 앞뒤의 무음을 잘라 낸다. 가장 큰 구간에 견주어 thresholdDb 만큼 작은 곳까지를 무음으로 본다.
 * @param keepHead 소리가 시작되기 전에 남겨 둘 시간(초). 타격음의 첫 순간이 잘리지 않게
 * @param keepTail 소리가 끝난 뒤에 남겨 둘 시간(초). 울림의 꼬리가 뚝 끊기지 않게
 */
export function trimSilence(p: Pcm, thresholdDb: number, keepHead = 0.005, keepTail = 0.05, win = 0.01): Pcm {
  const w = Math.max(1, Math.round(win * p.rate));
  const hop = Math.max(1, Math.floor(w / 2));
  const env = envelope(p, win);
  const top = env.reduce((m, v) => Math.max(m, v), 0);
  if (top <= 0) return slice(p, 0, 0);
  const thr = top * fromDb(thresholdDb);
  let first = 0;
  while (first < env.length && env[first] < thr) first++;
  let last = env.length - 1;
  while (last > first && env[last] < thr) last--;
  const from = first * hop - keepHead * p.rate;
  const to = last * hop + w + keepTail * p.rate;
  return slice(p, from, to);
}

/** 앞과 끝을 부드럽게 올리고 내린다 (뚝 끊기는 "딱" 소리를 막는다) */
export function fade(p: Pcm, inSec: number, outSec: number): Pcm {
  const n = lengthOf(p);
  const a = Math.min(n, Math.round(inSec * p.rate));
  const b = Math.min(n, Math.round(outSec * p.rate));
  const ch = p.ch.map((c) => {
    const out = c.slice();
    for (let i = 0; i < a; i++) out[i] *= i / a;
    // 끝은 코사인 곡선으로 내린다 (직선보다 꼬리가 자연스럽다)
    for (let i = 0; i < b; i++) out[n - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / b);
    return out;
  });
  return { rate: p.rate, ch };
}

export function gain(p: Pcm, k: number): Pcm {
  return { rate: p.rate, ch: p.ch.map((c) => c.map((v) => v * k)) };
}

/**
 * 크기를 맞춘다: 들리는 크기(loudest)를 loudDb 로 맞추되, 가장 큰 샘플이 peakDb 를 넘지 않게 한다.
 * 얼마나 키웠는지(배율)도 함께 돌려준다.
 */
export function normalize(p: Pcm, loudDb: number, peakDb: number, win = 0.2): { pcm: Pcm; gain: number } {
  const pk = peak(p);
  const ld = loudest(p, win);
  if (pk <= 0 || ld <= 0) return { pcm: p, gain: 1 };
  const k = Math.min(fromDb(loudDb) / ld, fromDb(peakDb) / pk);
  return { pcm: gain(p, k), gain: k };
}

/**
 * 끊김 없이 반복되게 만들어진 소리(길이 = 반복 주기)의 끝에 맨 앞부분을 cross 초만큼 덧붙인다.
 * 게임은 주기마다 다음 재생을 겹쳐 시작하고 겹치는 동안 앞의 것을 줄이므로(둘은 같은 소리라 크기가 변하지 않는다),
 * 파일 앞뒤에 인코더가 넣는 짧은 무음이 있어도 이음매가 들리지 않는다.
 */
export function appendHead(p: Pcm, cross: number): Pcm {
  const n = lengthOf(p);
  const x = Math.min(n, Math.round(cross * p.rate));
  const ch = p.ch.map((c) => {
    const out = new Float32Array(n + x);
    out.set(c);
    out.set(c.subarray(0, x), n);
    return out;
  });
  return { rate: p.rate, ch };
}

/**
 * 반복용으로 만들어지지 않은 소리에서 끊김 없이 도는 구간을 만든다.
 * start 초부터 period 초를 쓰되, 마지막 cross 초는 start 직전의 cross 초와 서서히 바꿔 섞는다.
 * 그러면 구간의 끝이 구간의 처음으로 그대로 이어진다. (start 는 cross 이상이어야 한다)
 */
export function crossfadeLoop(p: Pcm, start: number, period: number, cross: number): Pcm {
  const s = Math.round(start * p.rate);
  const n = Math.round(period * p.rate);
  const x = Math.round(cross * p.rate);
  if (s < x || s + n > lengthOf(p) || x > n) throw new Error('반복 구간이 소리의 길이를 벗어납니다');
  const ch = p.ch.map((c) => {
    const out = c.slice(s, s + n);
    for (let i = 0; i < x; i++) {
      const k = (i + 1) / (x + 1);
      // 서로 다른 소리를 섞으므로 크기가 꺼지지 않게 같은 세기(equal power)로 바꾼다
      const a = Math.cos((k * Math.PI) / 2);
      const b = Math.sin((k * Math.PI) / 2);
      out[n - x + i] = out[n - x + i] * a + c[s - x + i] * b;
    }
    return out;
  });
  return { rate: p.rate, ch };
}

/**
 * 반복 이음매가 얼마나 튀는지: 끝에서 처음으로 넘어갈 때의 샘플 차이를, 소리 안에서 이웃한 샘플 차이의 평균과 견준다.
 * 1 안팎이면 이음매가 다른 곳과 다르지 않고, 크게 넘으면 "딱" 소리가 난다.
 */
export function seamJump(p: Pcm, period = lengthOf(p)): number {
  let worst = 0;
  for (const c of p.ch) {
    const n = Math.min(period, c.length);
    if (n < 3) continue;
    let sum = 0;
    for (let i = 1; i < n; i++) sum += Math.abs(c[i] - c[i - 1]);
    const mean = sum / (n - 1);
    if (mean <= 0) continue;
    worst = Math.max(worst, Math.abs(c[0] - c[n - 1]) / mean);
  }
  return worst;
}

/** 소리의 앞 또는 끝 win초가 전체에 견주어 얼마나 조용한지 (0 = 무음, 1 = 전체와 같다). 반복음의 앞뒤에 무음이 끼었는지 볼 때 쓴다 */
export function edgeLevel(p: Pcm, win = 0.05): { head: number; tail: number } {
  const n = lengthOf(p);
  const w = Math.round(win * p.rate);
  const all = rms(p);
  if (all <= 0) return { head: 0, tail: 0 };
  return { head: rms(p, 0, w) / all, tail: rms(p, n - w, n) / all };
}

/**
 * 박자의 빠르기(BPM)를 어림한다. 소리 크기가 갑자기 커지는 곳(음의 시작)들이 얼마 간격으로 되풀이되는지 본다.
 * lo ~ hi 사이에서 가장 잘 맞는 값을 돌려준다. 박자가 뚜렷하지 않으면 0.
 */
export function estimateBpm(p: Pcm, lo = 60, hi = 180): number {
  const hopSec = 0.01;
  const env = envelope(toMono(p), hopSec * 2);
  // 커지는 변화만 남긴다
  const onset = env.map((v, i) => (i > 0 ? Math.max(0, v - env[i - 1]) : 0));
  const mean = onset.reduce((s, v) => s + v, 0) / (onset.length || 1);
  if (mean <= 0) return 0;
  const x = onset.map((v) => v - mean);
  let best = 0;
  let bestScore = 0;
  let energy = 0;
  for (const v of x) energy += v * v;
  for (let bpm = lo; bpm <= hi; bpm += 0.25) {
    const lag = 60 / bpm / hopSec;
    let s = 0;
    // 한 박자, 두 박자, 네 박자 뒤와 얼마나 닮았는지를 더한다 (보간해서 소수 간격도 잰다)
    for (const mult of [1, 2, 4]) {
      const L = lag * mult;
      const i0 = Math.floor(L);
      const f = L - i0;
      let acc = 0;
      for (let i = 0; i + i0 + 1 < x.length; i++) acc += x[i] * (x[i + i0] * (1 - f) + x[i + i0 + 1] * f);
      s += acc;
    }
    if (s > bestScore) {
      bestScore = s;
      best = bpm;
    }
  }
  return energy > 0 && bestScore / (energy * 3) > 0.05 ? best : 0;
}
