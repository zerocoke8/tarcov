// 스프라이트 제작 도구의 픽셀 계산. 파일·프로세스를 다루지 않는 순수 함수만 둔다 (tests/art.test.ts에서 검사).
// 영상 프레임(RGBA)에서 배경색을 빼고, 반복 구간·동작 구간을 찾고, 시트에 프레임을 배치한다.

export interface Img {
  w: number;
  h: number;
  /** RGBA, 한 픽셀 4바이트 */
  data: Uint8Array | Uint8ClampedArray;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Rgb = [number, number, number];

const median = (v: number[]): number => {
  v.sort((a, b) => a - b);
  return v[v.length >> 1] ?? 0;
};

/** 가장자리 픽셀의 중앙값으로 배경(크로마키)색을 추정한다. 캐릭터 일부가 가장자리에 닿아도 흔들리지 않는다 */
export function borderKey(img: Img, step = 4): Rgb {
  const { w, h, data } = img;
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const take = (x: number, y: number): void => {
    const i = (y * w + x) * 4;
    rs.push(data[i]);
    gs.push(data[i + 1]);
    bs.push(data[i + 2]);
  };
  for (let x = 0; x < w; x += step) {
    take(x, 1);
    take(x, h - 2);
  }
  for (let y = 0; y < h; y += step) {
    take(1, y);
    take(w - 2, y);
  }
  return [median(rs), median(gs), median(bs)];
}

const cb = (r: number, g: number, b: number): number => -0.168736 * r - 0.331264 * g + 0.5 * b;
const cr = (r: number, g: number, b: number): number => 0.5 * r - 0.418688 * g - 0.081312 * b;

export interface KeyOptions {
  /** 배경색 성분이 이 비율 이하면 완전 불투명 */
  lo?: number;
  /** 배경색 성분이 이 비율 이상이면 완전 투명 */
  hi?: number;
  /** 배경색과 색상(색조)이 이만큼 이상 다르면 배경으로 보지 않는다. 0~1 */
  hue?: number;
}

/**
 * 배경색을 투명하게 만든다 (제자리 수정).
 * 밝기는 무시하고 색 성분만 비교하므로, 배경의 명암(압축 얼룩, 옅은 그림자)도 함께 빠진다.
 * 경계 픽셀은 섞인 배경색을 걷어 내 색 번짐이 남지 않게 한다.
 */
export function chromaKey(img: Img, key: Rgb, opts: KeyOptions = {}): void {
  const lo = opts.lo ?? 0.15;
  const hi = opts.hi ?? 0.7;
  const hue = opts.hue ?? 0.38;
  const { data } = img;
  const kb = cb(key[0], key[1], key[2]);
  const kr = cr(key[0], key[1], key[2]);
  const kk = kb * kb + kr * kr;
  if (kk < 400) throw new Error(`배경색 (${key.join(',')})의 채도가 너무 낮아 캐릭터와 구분할 수 없습니다. 초록·파랑·자홍처럼 선명한 단색 배경을 쓰세요`);
  const klen = Math.sqrt(kk);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const pb = cb(r, g, b);
    const pr = cr(r, g, b);
    // p: 배경색 방향의 색 성분 비율 (1이면 배경색과 같은 채도)
    const p = (pb * kb + pr * kr) / kk;
    if (p <= 0.02) continue;
    const perp = Math.sqrt(Math.max(0, pb * pb + pr * pr - p * p * kk)) / klen;
    // 색조가 배경과 다르면(노랑·청록 등) 배경으로 보지 않는다
    const sameHue = 1 - Math.min(1, Math.max(0, (perp - hue * 0.5) / (hue * 0.5)));
    if (sameHue <= 0) continue;
    const bg = Math.min(1, Math.max(0, (p - lo) / (hi - lo))) * sameHue;
    const alpha = 1 - bg;
    if (alpha <= 0.04) {
      data[i + 3] = 0;
      continue;
    }
    // 섞여 들어온 배경색을 걷어 낸다: 원래색 = (보이는색 - m * 배경색) / (1 - m)
    const m = Math.min(0.92, Math.max(0, p) * sameHue);
    const inv = 1 / (1 - m);
    data[i] = Math.min(255, Math.max(0, (r - m * key[0]) * inv));
    data[i + 1] = Math.min(255, Math.max(0, (g - m * key[1]) * inv));
    data[i + 2] = Math.min(255, Math.max(0, (b - m * key[2]) * inv));
    data[i + 3] = Math.round(data[i + 3] * alpha);
  }
}

/** 투명도를 n픽셀 깎아 가장자리에 남은 배경색 테두리를 없앤다 (제자리 수정) */
export function shrinkAlpha(img: Img, n = 1): void {
  const { w, h, data } = img;
  for (let pass = 0; pass < n; pass++) {
    const src = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) src[i] = data[i * 4 + 3];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let a = src[i];
        if (a === 0) continue;
        if (x > 0) a = Math.min(a, src[i - 1]);
        if (x < w - 1) a = Math.min(a, src[i + 1]);
        if (y > 0) a = Math.min(a, src[i - w]);
        if (y < h - 1) a = Math.min(a, src[i + w]);
        data[i * 4 + 3] = a;
      }
    }
  }
}

/** 넓이가 minArea보다 작은 외딴 점(압축 잡티)을 지운다 (제자리 수정). 지운 덩어리 수를 돌려준다 */
export function removeSpecks(img: Img, minArea = 24, threshold = 24): number {
  const { w, h, data } = img;
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  const blob: number[] = [];
  let removed = 0;
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || data[start * 4 + 3] <= threshold) continue;
    stack.length = 0;
    blob.length = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      blob.push(i);
      const x = i % w;
      const y = (i - x) / w;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (seen[j] || data[j * 4 + 3] <= threshold) continue;
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
    if (blob.length < minArea) {
      for (const i of blob) data[i * 4 + 3] = 0;
      removed++;
    }
  }
  return removed;
}

/** 불투명한 부분을 감싸는 상자. 전부 투명하면 null */
export function alphaBox(img: Img, threshold = 12): Box | null {
  const { w, h, data } = img;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] <= threshold) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** 발 위치: 몸 상자 맨 아래 띠(높이의 band 비율)에서 불투명 픽셀의 가로 중심과 바닥선 */
export function footAnchor(img: Img, box: Box, band = 0.1): { x: number; y: number } {
  const { w, data } = img;
  const top = Math.floor(box.y + box.h * (1 - band));
  let sum = 0;
  let n = 0;
  for (let y = top; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a <= 12) continue;
      sum += x * a;
      n += a;
    }
  }
  return { x: n ? sum / n + 0.5 : box.x + box.w / 2, y: box.y + box.h };
}

/**
 * 서 있는 기본 자세에서 발 위치와 키를 잰다.
 * 무기를 내려 들면 무기 끝이 발보다 아래로 내려갈 수 있어, 상자 맨 아래를 그대로 발로 보지 않는다.
 * 머리·몸통(상자 위쪽 60%)의 가로 중심을 몸의 축으로 잡고, 그 축 주변에서 가장 아래 픽셀을 발로 본다.
 */
export function bodyMetrics(img: Img, box: Box): { footX: number; footY: number; height: number } {
  const { w, data } = img;
  const opaque = (x: number, y: number): number => data[(y * w + x) * 4 + 3];
  let sum = 0;
  let n = 0;
  const upper = box.y + Math.floor(box.h * 0.6);
  for (let y = box.y; y < upper; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      const a = opaque(x, y);
      if (a <= 12) continue;
      sum += x * a;
      n += a;
    }
  }
  const axis = n ? sum / n : box.x + box.w / 2;
  const half = box.h * 0.14;
  const x0 = Math.max(box.x, Math.floor(axis - half));
  const x1 = Math.min(box.x + box.w - 1, Math.ceil(axis + half));
  let footY = box.y;
  for (let x = x0; x <= x1; x++) {
    for (let y = box.y + box.h - 1; y > footY; y--) {
      if (opaque(x, y) > 12) {
        footY = y;
        break;
      }
    }
  }
  footY += 1;
  sum = 0;
  n = 0;
  for (let y = Math.max(box.y, Math.floor(footY - box.h * 0.06)); y < footY; y++) {
    for (let x = x0; x <= x1; x++) {
      const a = opaque(x, y);
      if (a <= 12) continue;
      sum += x * a;
      n += a;
    }
  }
  return { footX: n ? sum / n + 0.5 : axis, footY, height: footY - box.y };
}

/** 프레임끼리 비교하기 위한 작은 요약: size x size 칸마다 (투명도, 투명도를 곱한 밝기) */
export function thumb(img: Img, size = 40): Float32Array {
  const { w, h, data } = img;
  const out = new Float32Array(size * size * 2);
  const cnt = new Float32Array(size * size);
  for (let y = 0; y < h; y++) {
    const ty = Math.min(size - 1, Math.floor((y * size) / h));
    for (let x = 0; x < w; x++) {
      const tx = Math.min(size - 1, Math.floor((x * size) / w));
      const i = (y * w + x) * 4;
      const a = data[i + 3] / 255;
      const l = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      const t = ty * size + tx;
      out[t * 2] += a;
      out[t * 2 + 1] += a * l;
      cnt[t]++;
    }
  }
  for (let t = 0; t < size * size; t++) {
    const c = cnt[t] || 1;
    out[t * 2] /= c;
    out[t * 2 + 1] /= c;
  }
  return out;
}

/** 두 요약의 차이 (0 = 같음) */
export function thumbDist(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}

export interface Range {
  /** 시작 프레임 (포함) */
  start: number;
  /** 끝 프레임. 반복 구간에서는 start와 같은 모습인 프레임(포함하지 않음), 단발 동작에서는 마지막 프레임(포함) */
  end: number;
}

/**
 * 반복 동작(달리기 등)에서 한 주기를 찾는다.
 * 간격 L만큼 떨어진 프레임끼리의 평균 차이가 가장 작은 L을 주기로 보고, 그 주기로 가장 매끄럽게 이어지는 시작점을 고른다.
 */
export function findCycle(thumbs: Float32Array[], minLen: number, maxLen: number): Range & { score: number } {
  const n = thumbs.length;
  maxLen = Math.min(maxLen, n - 2);
  minLen = Math.max(2, Math.min(minLen, maxLen));
  const lagCost: number[] = [];
  let best = Infinity;
  for (let lag = minLen; lag <= maxLen; lag++) {
    let s = 0;
    let c = 0;
    for (let i = 0; i + lag < n; i++) {
      s += thumbDist(thumbs[i], thumbs[i + lag]);
      c++;
    }
    const v = s / c;
    lagCost[lag] = v;
    if (v < best) best = v;
  }
  // 가장 좋은 값에 가까운 것 중 가장 짧은 주기를 쓴다 (2주기, 3주기를 고르지 않도록)
  let period = minLen;
  for (let lag = minLen; lag <= maxLen; lag++) {
    if (lagCost[lag] <= best * 1.15 + 1e-6) {
      period = lag;
      break;
    }
  }
  let start = 0;
  let score = Infinity;
  for (let s = 0; s + period + 1 < n; s++) {
    const v = thumbDist(thumbs[s], thumbs[s + period]) + thumbDist(thumbs[s + 1], thumbs[s + period + 1]);
    if (v < score) {
      score = v;
      start = s;
    }
  }
  return { start, end: start + period, score: score / 2 };
}

/**
 * 단발 동작(공격 등)에서 실제로 움직이는 구간을 찾는다.
 * 첫 프레임(대기 자세)과의 차이가 최대 차이의 threshold 비율을 넘는 처음과 마지막을 잡고, 앞뒤로 pad 프레임을 더한다.
 */
export function findAction(thumbs: Float32Array[], pad = 1, threshold = 0.12): Range {
  const n = thumbs.length;
  const d = thumbs.map((t) => thumbDist(thumbs[0], t));
  const max = Math.max(...d);
  if (max < 1e-4) return { start: 0, end: n - 1 };
  const cut = max * threshold;
  let first = d.findIndex((v) => v > cut);
  let last = n - 1;
  while (last > first && d[last] <= cut) last--;
  first = Math.max(0, first - pad);
  last = Math.min(n - 1, last + pad);
  return { start: first, end: last };
}

/** 구간에서 count장을 고르게 뽑는다. 반복 구간은 끝 프레임(=시작과 같은 모습)을 빼고 뽑는다 */
export function pickFrames(range: Range, count: number, loop: boolean): number[] {
  const { start, end } = range;
  const span = end - start;
  const out: number[] = [];
  if (loop) {
    const n = Math.max(1, Math.min(count, span));
    for (let i = 0; i < n; i++) out.push(start + Math.round((i * span) / n));
  } else {
    const n = Math.max(1, Math.min(count, span + 1));
    for (let i = 0; i < n; i++) out.push(n === 1 ? start : start + Math.round((i * span) / (n - 1)));
  }
  return out;
}

export interface Placed {
  page: number;
  x: number;
  y: number;
}

/**
 * 프레임들을 시트 여러 장에 줄 단위로 채운다. 높이가 비슷한 것끼리 같은 줄에 놓여 낭비가 적다.
 * sizes와 같은 순서로 위치를 돌려준다.
 */
export function packShelves(sizes: { w: number; h: number }[], maxSize: number, pad = 2): { placed: Placed[]; pages: { w: number; h: number }[] } {
  const order = sizes.map((_, i) => i).sort((a, b) => sizes[b].h - sizes[a].h || sizes[b].w - sizes[a].w);
  const placed: Placed[] = new Array(sizes.length);
  const pages: { w: number; h: number }[] = [];
  let page = -1;
  let x = pad;
  let y = pad;
  let rowH = 0;
  const newPage = (): void => {
    page++;
    pages.push({ w: 0, h: 0 });
    x = pad;
    y = pad;
    rowH = 0;
  };
  newPage();
  for (const i of order) {
    const { w, h } = sizes[i];
    if (w + pad * 2 > maxSize || h + pad * 2 > maxSize) throw new Error(`프레임(${w}x${h})이 시트 한 장(${maxSize})보다 큽니다`);
    if (x + w + pad > maxSize) {
      x = pad;
      y += rowH + pad;
      rowH = 0;
    }
    if (y + h + pad > maxSize) newPage();
    placed[i] = { page, x, y };
    x += w + pad;
    rowH = Math.max(rowH, h);
    const pg = pages[page];
    pg.w = Math.max(pg.w, x);
    pg.h = Math.max(pg.h, y + h + pad);
  }
  return { placed, pages };
}

/**
 * 단발 동작에서 프레임을 "움직임이 많은 곳에 촘촘하게" 고른다.
 * 시간 간격으로 고르면 빠른 휘두르기는 한두 장뿐이고 멈춰 있는 자세만 여러 장 뽑힌다.
 * mix가 1이면 움직임 양 기준, 0이면 시간 기준으로 고르게 뽑는다. 처음과 끝 프레임은 항상 포함한다.
 */
export function pickByMotion(thumbs: Float32Array[], range: Range, count: number, mix = 0.7): number[] {
  const { start, end } = range;
  const span = end - start;
  if (span <= 0) return [start];
  const n = Math.max(2, Math.min(count, span + 1));
  // 누적 진행도: 움직임 양과 시간을 섞는다 (둘 다 0~1로 맞춘 뒤)
  const move = [0];
  for (let i = start + 1; i <= end; i++) move.push(move[move.length - 1] + thumbDist(thumbs[i], thumbs[i - 1]));
  const total = move[span] || 1;
  const progress = move.map((m, k) => mix * (m / total) + (1 - mix) * (k / span));
  const out: number[] = [];
  let k = 0;
  for (let j = 0; j < n; j++) {
    const target = j / (n - 1);
    while (k < span && progress[k] < target - 1e-9) k++;
    // 앞에서 고른 프레임과 겹치지 않게 밀고, 남은 장수만큼은 뒤에 자리를 남긴다
    const min = out.length ? out[out.length - 1] + 1 : start;
    const max = end - (n - 1 - j);
    out.push(Math.min(Math.max(start + k, min), max));
  }
  return out;
}

/**
 * 구간 안에서 움직임이 가장 빠른 시점 (0~1). 공격 동작에서는 휘두르는 순간이므로 타격 지점으로 쓴다.
 */
export function peakMotion(thumbs: Float32Array[], range: Range): number {
  const { start, end } = range;
  const span = end - start;
  if (span < 2) return 0.5;
  let best = start + 1;
  let bestV = -1;
  for (let i = start + 1; i <= end; i++) {
    // 앞뒤 프레임까지 묶어 잡음에 흔들리지 않게 한다
    let v = 0;
    let c = 0;
    for (let j = Math.max(start + 1, i - 1); j <= Math.min(end, i + 1); j++) {
      v += thumbDist(thumbs[j], thumbs[j - 1]);
      c++;
    }
    v /= c;
    if (v > bestV) {
      bestV = v;
      best = i;
    }
  }
  return (best - start) / span;
}

/**
 * 여러 물체가 격자로 놓인 시트에서 칸마다 물체의 상자를 찾는다 (배경은 이미 투명해야 한다).
 * 붙어 있는 픽셀 덩어리를 구해 중심이 속한 칸에 넣으므로, 물체가 칸 경계를 조금 넘어도 잘리지 않는다.
 * 읽는 순서(왼쪽→오른쪽, 위→아래)대로 돌려준다. 비어 있는 칸은 null.
 */
export function cutGrid(img: Img, rows: number, cols: number, minArea = 40, threshold = 24): (Box | null)[] {
  const { w, h, data } = img;
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  const bounds: ([number, number, number, number] | null)[] = new Array(rows * cols).fill(null);
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || data[start * 4 + 3] <= threshold) continue;
    let x0 = w;
    let y0 = h;
    let x1 = -1;
    let y1 = -1;
    let area = 0;
    stack.length = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % w;
      const y = (i - x) / w;
      area++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (seen[j] || data[j * 4 + 3] <= threshold) continue;
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
    if (area < minArea) continue;
    const col = Math.min(cols - 1, Math.floor((((x0 + x1) / 2) * cols) / w));
    const row = Math.min(rows - 1, Math.floor((((y0 + y1) / 2) * rows) / h));
    const b = bounds[row * cols + col];
    if (!b) bounds[row * cols + col] = [x0, y0, x1, y1];
    else {
      b[0] = Math.min(b[0], x0);
      b[1] = Math.min(b[1], y0);
      b[2] = Math.max(b[2], x1);
      b[3] = Math.max(b[3], y1);
    }
  }
  return bounds.map((b) => (b ? { x: b[0], y: b[1], w: b[2] - b[0] + 1, h: b[3] - b[1] + 1 } : null));
}

/**
 * 질감 이미지를 이어 붙여도 경계가 보이지 않게 만든다.
 * 가장자리 띠(feather 비율)를 반대쪽 끝과 겹쳐 섞는다. 결과는 그 띠만큼 작아진다.
 * axes 가 'x' 면 가로로만 이어지게 한다 (벽처럼 옆으로만 반복하는 질감).
 */
export function makeSeamless(img: Img, feather = 0.2, axes: 'xy' | 'x' = 'xy'): Img {
  const { w, h, data } = img;
  const mx = Math.max(1, Math.round(w * feather));
  const my = axes === 'xy' ? Math.max(1, Math.round(h * feather)) : 0;
  const ow = w - mx;
  const oh = h - my;
  const out = new Uint8Array(ow * oh * 4);
  const ease = (t: number): number => t * t * (3 - 2 * t);
  for (let y = 0; y < oh; y++) {
    const wy = my > 0 && y < my ? ease(y / my) : 1;
    for (let x = 0; x < ow; x++) {
      const wx = x < mx ? ease(x / mx) : 1;
      const o = (y * ow + x) * 4;
      for (let c = 0; c < 4; c++) {
        const a = data[(y * w + x) * 4 + c];
        // 왼쪽 띠에는 원본의 오른쪽 끝을, 위쪽 띠에는 아래쪽 끝을 섞는다
        const bx = wx < 1 ? data[(y * w + x + ow) * 4 + c] : 0;
        let v = a * wx + bx * (1 - wx);
        if (wy < 1) {
          const a2 = data[((y + oh) * w + x) * 4 + c];
          const b2 = wx < 1 ? data[((y + oh) * w + x + ow) * 4 + c] : 0;
          v = v * wy + (a2 * wx + b2 * (1 - wx)) * (1 - wy);
        }
        out[o + c] = Math.round(v);
      }
    }
  }
  return { w: ow, h: oh, data: out };
}
