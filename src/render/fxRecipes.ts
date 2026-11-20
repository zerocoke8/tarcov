// 이름으로 부르는 이펙트가 어떻게 보이는지 정한다.
// 규칙 코드(src/game)는 w.fx.play('raon.slam', x, y, { size }) 처럼 "무슨 일이 일어났는지"만 알리고,
// 여기서 그 이름을 조각(그림 한 장)과 플립북(영상 프레임)의 조합으로 풀어 그린다.
//
// 좌표 약속: (x, y)는 언제나 바닥의 한 점(대상의 발밑)이다. 바닥에서 띄워 그릴 것은 y 에서 빼지 않고 높이 h 로 준다
// (몸 가운데는 h: 24 쯤). 화면을 기존처럼 그리든 마름모로 그리든 같은 지시가 제자리에 놓인다 (render/fx.ts).
//  - 조준 방향처럼 "바닥 위의 방향"은 rot 이 아니라 dir 로 준다.
//  - 바닥과 나란히 퍼지거나 뻗는 것(고리, 휘두른 궤적, 빛줄기)은 flat: true 로 눕힌다.
//  - 세워 그리는 조각을 바닥 위의 방향으로 움직일 때는 fx.vec / fx.gv 로 화면 속도를 구한다.
// 새 이펙트를 넣을 때: 여기에 이름을 추가하고, 규칙 코드에서 같은 이름으로 play 를 부른다 (tests/fx.test.ts 가 이름이 맞는지 검사한다).
import type { FxOpts } from '../game/entities';
import type { Fx } from './fx';

export type Recipe = (fx: Fx, x: number, y: number, o: FxOpts) => void;

const TAU = Math.PI * 2;
const WHITE = 0xffffff;
/** 흙먼지 색 */
const DUST = 0xb9ad9c;
/** 몸 가운데 높이 */
const BODY = 24;
/** 불과 독 포자의 색 */
const FIRE = 0xff8a3c;
const SPORE = 0x9be36a;

const rnd = (a: number, b: number): number => a + Math.random() * (b - a);

/** 두 색을 섞는다 (t = 0이면 a, 1이면 b) */
export function mix(a: number, b: number, t: number): number {
  const ch = (s: number): number => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/**
 * 이펙트에 입힐 색을 만든다. 캐릭터 색은 옅은 파스텔이라 그대로 더하기 합성하면 하얗게 날아가므로,
 * 색상은 그대로 두고 채도를 올리고 밝기를 낮춘다. 회색·흰색은 그대로 둔다.
 */
export function vivid(color: number, sat = 0.95, light = 0.6): number {
  const r = ((color >> 16) & 255) / 255;
  const g = ((color >> 8) & 255) / 255;
  const b = (color & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d < 0.06) return color;
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  if (h < 0) h += 6;
  const l = Math.min(light, (max + min) / 2);
  const c = (1 - Math.abs(2 * l - 1)) * sat;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];
  const ch = (v: number): number => Math.round((v + m) * 255);
  return (ch(r1) << 16) | (ch(g1) << 8) | ch(b1);
}

/** 위로 떠오르는 반짝이 */
function sparkles(fx: Fx, x: number, y: number, color: number, count: number, spread = 40): void {
  for (let i = 0; i < count; i++) {
    // 화면에서 좌우로 흩뿌린다
    const s = fx.side(rnd(-spread, spread));
    fx.piece('sparkle', x + s.x, y + s.y, {
      h: rnd(8, 70),
      size: rnd(16, 32),
      dur: rnd(0.4, 0.7),
      delay: rnd(0, 0.18),
      vy: -rnd(50, 130),
      color,
      fadeIn: 0.2,
      hold: 0.5,
    });
  }
}

/** 둘레로 퍼지는 흙먼지 */
function dustRing(fx: Fx, x: number, y: number, r: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + rnd(-0.3, 0.3);
    const v = fx.vec(a, 55);
    fx.piece('puff', x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, {
      size: Math.max(28, r * rnd(0.5, 0.75)),
      dur: rnd(0.4, 0.55),
      from: 0.5,
      to: 1.25,
      color: DUST,
      blend: 'normal',
      alpha: 0.5,
      vx: v.x,
      vy: v.y - 14,
      rot: rnd(0, TAU),
    });
  }
}

/** 튀어 오르는 돌 조각 */
function rocks(fx: Fx, x: number, y: number, r: number, count: number): void {
  for (let i = 0; i < count; i++) {
    fx.piece('rock', x + rnd(-r, r) * 0.5, y + rnd(-r, r) * 0.3, {
      size: rnd(9, 17),
      dur: rnd(0.45, 0.6),
      vx: rnd(-150, 150),
      vy: rnd(-380, -220),
      gy: 1100,
      spin: rnd(-12, 12),
      hold: 0.8,
    });
  }
}

/** 발밑에서 솟는 빛기둥 */
function pillar(fx: Fx, x: number, y: number, size: number, color: number, dur = 0.45, wide = 1.2): void {
  fx.piece('pillar', x, y, { h: -6, size, dur, ay: 0.97, from: 0.75, to: 1.08, sx: wide, color, hold: 0.35 });
}

export const RECIPES: Record<string, Recipe> = {
  // ---- 공통 ---------------------------------------------------------------

  /** 적이 맞았다. (x, y)는 적의 발밑, h 는 맞은 곳의 높이(몸 가운데), angle 은 공격이 날아온 방향, style 은 무기 종류, power 1이면 치명타 */
  hit(fx, x, y, o) {
    if (!fx.allow('hit', 5, 0.07)) return;
    const color = o.color ?? WHITE;
    const a = o.angle ?? 0;
    const big = o.power ? 1.35 : 1;
    const jx = x + rnd(-6, 6);
    const jy = y + rnd(-6, 6);
    const h = o.h ?? 0;
    switch (o.style) {
      case 'greatsword':
      case 'daggers':
        // 벤 자국: 공격 방향을 가로지르는 짧은 궤적
        fx.piece('thrust', jx, jy, { h, size: 120 * big, dur: 0.14, dir: a + rnd(-0.8, 0.8), from: 0.5, to: 1.15, sy: 1.5, color });
        fx.piece('star', jx, jy, { h, size: 44 * big, dur: 0.12, rot: rnd(0, TAU) });
        break;
      case 'hammer':
        fx.piece('hit', jx, jy, { h, size: 88 * big, dur: 0.16, from: 0.5, to: 1.1, rot: rnd(0, TAU), color });
        fx.piece('ring', jx, jy, { h, size: 74 * big, dur: 0.2, from: 0.3, to: 1, color, alpha: 0.8 });
        break;
      case 'bow':
      case 'lance':
        // 꿰뚫은 자국: 공격 방향으로 길게 늘인 섬광
        fx.piece('star', jx, jy, { h, size: 84 * big, dur: 0.14, dir: a, sx: 1.5, sy: 0.7, color });
        fx.sparks(jx, jy, color, 2, h, a, 0.5);
        break;
      case 'shotgun':
      case 'smg':
        fx.piece('hit', jx, jy, { h, size: 44 * big, dur: 0.1, rot: rnd(0, TAU), color });
        if (fx.allow('hitSpark', 3, 0.1)) fx.sparks(jx, jy, 0xffe0a8, 1, h, a + Math.PI, 0.9);
        break;
      case 'gauntlet':
      case 'talisman':
        fx.piece('ring_energy', jx, jy, { h, size: 60 * big, dur: 0.18, from: 0.4, to: 1, rot: rnd(0, TAU), color });
        fx.piece('star', jx, jy, { h, size: 40 * big, dur: 0.12, rot: rnd(0, TAU) });
        break;
      default:
        fx.piece('hit', jx, jy, { h, size: 58 * big, dur: 0.12, rot: rnd(0, TAU), color });
    }
    // 치명타: 큰 십자 섬광을 한 번 더
    if (o.power) fx.piece('star', jx, jy, { h, size: 130, dur: 0.2, rot: Math.PI / 4, from: 0.6, to: 1.1 });
  },

  /** 적이 쓰러졌다. size 는 적의 반경 */
  die(fx, x, y, o) {
    if (!fx.allow('die', 4, 0.1)) return;
    const r = o.size ?? 20;
    const h = r * 0.7;
    fx.piece('star', x, y, { h, size: r * 4.2, dur: 0.16, from: 0.5, to: 1, rot: Math.PI / 4 });
    for (let i = 0; i < 3; i++) {
      const s = fx.side(rnd(-r, r) * 0.6);
      fx.piece('puff', x + s.x, y + s.y, {
        h: h - rnd(-r, r) * 0.4,
        size: r * rnd(1.6, 2.4),
        dur: rnd(0.4, 0.6),
        from: 0.6,
        to: 1.25,
        color: 0x3a3350,
        blend: 'normal',
        alpha: 0.75,
        vy: -30,
        rot: rnd(0, TAU),
      });
    }
    for (let i = 0; i < 3; i++) {
      fx.piece('shard', x, y, { h, size: rnd(11, 19), dur: 0.5, vx: rnd(-150, 150), vy: rnd(-260, -120), gy: 700, spin: rnd(-10, 10), hold: 0.7 });
    }
  },

  /** 궁극기를 쓰기 시작했다 */
  'cast.ult'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    fx.piece('ring_energy', x, y, { size: 270, dur: 0.3, from: 1.3, to: 0.25, color, ground: true, spin: 4, fadeIn: 0.3, hold: 0.8 });
    pillar(fx, x, y, 250, color, 0.5, 1.3);
    fx.glow(x, y, 120, color, 0.45, 0.7, false, 30);
    sparkles(fx, x, y, color, 6);
  },

  /** 회피로 몸을 날렸다. angle 은 나아가는 방향 */
  dash(fx, x, y, o) {
    const a = o.angle ?? 0;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const back = fx.vec(a, -40);
    for (let i = 0; i < 3; i++) {
      const s = fx.side(rnd(-4, 4));
      fx.piece('puff', x - cos * i * 12 + s.x, y - sin * i * 12 + s.y, {
        h: 4,
        size: 32 + i * 7,
        dur: 0.32,
        delay: i * 0.04,
        from: 0.6,
        to: 1.3,
        color: 0xc9cfdd,
        blend: 'normal',
        alpha: 0.42,
        rot: rnd(0, TAU),
        vx: back.x,
        vy: back.y - 10,
      });
    }
    // 뒤로 남는 빠른 선
    fx.piece('thrust', x, y, { h: BODY, size: 120, dur: 0.18, dir: a, flat: true, ax: 1, sy: 1.4, alpha: 0.55 });
  },

  /** 교체로 새 캐릭터가 나왔다 */
  swap(fx, x, y, o) {
    const color = o.color ?? WHITE;
    pillar(fx, x, y, 170, color, 0.35, 1);
    sparkles(fx, x, y, color, 3, 26);
  },

  /** 상자·잔재 등을 열었다 */
  pickup(fx, x, y, o) {
    const color = o.color ?? 0xffe9a8;
    fx.piece('ring', x, y, { size: 90, dur: 0.35, from: 0.3, to: 1, color, ground: true });
    pillar(fx, x, y, 130, color, 0.4, 0.9);
    sparkles(fx, x, y, color, 5, 24);
  },

  /** 총구 섬광. (x, y)는 쏘는 자리(발밑 기준), angle 은 쏘는 방향. at: 'weapon' 이면 필드 캐릭터의 무기 끝에서 */
  muzzle(fx, x, y, o) {
    if (!fx.allow('muzzle', 4, 0.05)) return;
    const m = fx.origin(o, x, y, (o.h ?? 0) + BODY);
    fx.piece('flash', m.x, m.y, {
      h: m.h,
      size: o.size ?? 44,
      dur: 0.075,
      dir: o.angle ?? 0,
      ax: 0.08,
      from: 0.8,
      to: 1.1,
      color: mix(o.color ?? WHITE, 0xfff0c0, 0.5),
      hold: 0.5,
    });
  },

  // ---- 에트나 --------------------------------------------------------------

  /** 검기 사출: 크게 휘두르며 앞으로 빛줄기가 뻗는다 */
  'serin.wave'(fx, x, y, o) {
    const a = o.angle ?? 0;
    const color = o.color ?? WHITE;
    fx.slash(x, y, a, 100, 2.4, color, true);
    fx.piece('thrust', x + Math.cos(a) * 30, y + Math.sin(a) * 30, { h: BODY, size: 210, dur: 0.2, dir: a, flat: true, ax: 0, sy: 1.3, color, alpha: 0.85 });
  },

  /** 붕괴 일섬: (x, y)에서 (x2, y2)까지 균열이 달리고, 그 위로 차례로 불기둥이 솟는다. size 는 균열의 반폭 */
  'serin.ult'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    const x2 = o.x2 ?? x;
    const y2 = o.y2 ?? y;
    const half = o.size ?? 60;
    const len = Math.hypot(x2 - x, y2 - y);
    const a = Math.atan2(y2 - y, x2 - x);
    fx.piece('hit', x, y, { h: 10, size: 150, dur: 0.2, rot: rnd(0, TAU), color, core: 0.5 });
    fx.piece('thrust', x, y, { h: 8, size: len * 1.08, dur: 0.3, dir: a, flat: true, ax: 0, sy: 1.1, color, core: 0.4, alpha: 0.8, hold: 0.3 });
    // 불기둥이 서로 많이 겹치면 같은 자리를 여러 번 칠하게 되므로, 간격을 두고 세운다
    const n = Math.max(3, Math.round(len / 84));
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n;
      const px = x + (x2 - x) * k;
      const py = y + (y2 - y) * k;
      const delay = i * 0.03;
      const big = i % 2 === 0;
      if (big && fx.flip('fb_erupt', px, py, { size: half * 4.6, delay, ay: 0.88, dur: 0.5 })) {
        // 영상으로 만든 분출
      } else if (big) {
        fx.piece('k_erupt', px, py, { h: -6, size: half * 4.4, dur: 0.42, delay, ay: 0.94, from: 0.35, to: 1.1, sx: rnd(0.85, 1.05), hold: 0.35 });
      } else {
        fx.piece('flame', px, py, { h: -4, size: half * rnd(2.6, 3.4), dur: rnd(0.32, 0.44), delay, ay: 0.95, from: 0.35, to: 1.1, sx: rnd(0.8, 1.1), color, hold: 0.3 });
      }
      if (big) fx.piece('crack', px, py, { size: half * 2.4, dur: 0.5, delay, rot: rnd(0, TAU), color, ground: true, alpha: 0.6, core: 0 });
    }
  },

  // ---- 라이 ----------------------------------------------------------------

  /** 에너지 방출: 몸에서 사방으로 전격이 퍼진다. size 는 범위 반경 */
  'mido.nova'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    const r = o.size ?? 120;
    fx.glow(x, y, r * 1.1, color, 0.3, 0.6, false, 20);
    fx.piece('ring_energy', x, y, { size: r * 2.2, dur: 0.34, from: 0.2, to: 1, color, spin: 2, hold: 0.3, flat: true });
    fx.piece('nova', x, y, { size: r * 1.8, dur: 0.24, from: 0.4, to: 1, color, alpha: 0.8, rot: rnd(0, TAU), flat: true });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + rnd(-0.3, 0.3);
      fx.bolt(x, y, x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95, color, 20, 20);
    }
  },

  /** 뇌운의 낙뢰 한 발. (x, y)는 떨어지는 자리, size 는 범위 반경 */
  'mido.ult.strike'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    const r = o.size ?? 70;
    if (!fx.flip('fb_strike', x, y, { size: 360, ay: 0.9, dur: 0.42 })) {
      // 한 번 뒤집어 깜빡이게 한다
      for (let i = 0; i < 2; i++) fx.piece('k_strike', x, y, { h: -8, size: 310, dur: 0.16, delay: i * 0.07, ay: 0.95, sx: i ? -1 : 1, from: 0.92, to: 1.04, hold: 0.5 });
    }
    fx.glow(x, y, 80, color, 0.25, 0.7);
    fx.piece('nova', x, y, { size: r * 2, dur: 0.22, from: 0.4, to: 1, color, ground: true, rot: rnd(0, TAU) });
    fx.piece('ring', x, y, { size: r * 2.1, dur: 0.28, from: 0.3, to: 1, color, alpha: 0.8, ground: true });
    fx.sparks(x, y, color, 4, 10);
  },

  // ---- 키온 ----------------------------------------------------------------

  /** 만월의 화살을 쏘는 순간 */
  'sia.ult.cast'(fx, x, y, o) {
    const a = o.angle ?? 0;
    const color = o.color ?? WHITE;
    const m = fx.origin(o, x + Math.cos(a) * 26, y + Math.sin(a) * 26, BODY);
    fx.piece('star', m.x, m.y, { h: m.h, size: 180, dur: 0.22, dir: a, sx: 1.4, color });
    fx.piece('ring', m.x, m.y, { h: m.h, size: 130, dur: 0.28, from: 0.3, to: 1, dir: a, sx: 0.45, color });
    fx.piece('thrust', m.x, m.y, { h: m.h, size: 340, dur: 0.26, dir: a, flat: true, ax: 0, sy: 1.6, color });
  },

  // ---- 카렌 ----------------------------------------------------------------

  /** 근접 산탄: 총구에서 부채꼴로 터진다. size 는 닿는 거리, arc 는 부채꼴 각 */
  'karen.blast'(fx, x, y, o) {
    const a = o.angle ?? 0;
    const reach = o.size ?? 120;
    const arc = o.arc ?? 1;
    const warm = mix(o.color ?? WHITE, 0xffd9a0, 0.45);
    const m = fx.origin(o, x + Math.cos(a) * 16, y + Math.sin(a) * 16, BODY);
    // 그림의 부채꼴은 양쪽 25도쯤이라, 스킬의 각에 맞춰 세로로 늘인다
    const sy = Math.max(0.8, Math.min(2.2, Math.tan(Math.min(arc, 2.4) / 2) / Math.tan(0.44)));
    fx.piece('cone', m.x, m.y, { h: m.h, size: reach * 1.12, dur: 0.16, dir: a, flat: true, ax: 0.03, from: 0.5, to: 1.05, sy, color: warm, core: 0.5, alpha: 0.9, hold: 0.35 });
    fx.piece('flash', m.x, m.y, { h: m.h, size: 84, dur: 0.09, dir: a, ax: 0.08, color: warm });
    fx.glow(m.x + Math.cos(a) * reach * 0.4, m.y + Math.sin(a) * reach * 0.4, reach * 0.6, warm, 0.16, 0.5, false, m.h);
    fx.sparks(m.x, m.y, 0xffe0a8, 5, m.h, a, arc / 2);
  },

  // ---- 라온 ----------------------------------------------------------------

  /** 기본 공격 3타의 충격파. size 는 범위 반경 */
  'raon.shock'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    const r = o.size ?? 80;
    fx.piece('crack', x, y, { size: r * 2, dur: 0.55, rot: rnd(0, TAU), color, ground: true, alpha: 0.85, hold: 0.4 });
    fx.piece('ring', x, y, { size: r * 2.1, dur: 0.26, from: 0.3, to: 1, flat: true });
    fx.piece('nova', x, y, { size: r * 1.7, dur: 0.2, from: 0.4, to: 1, color, alpha: 0.7, rot: rnd(0, TAU), flat: true });
    fx.glow(x, y, r, color, 0.25, 0.5);
    dustRing(fx, x, y, r, 4);
  },

  /** 지면 강타: 땅이 갈라지고 돌이 튄다. size 는 범위 반경 */
  'raon.slam'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    const r = o.size ?? 140;
    fx.piece('crack', x, y, { size: r * 2.1, dur: 0.9, rot: rnd(0, TAU), color, ground: true, hold: 0.5 });
    fx.piece('ring', x, y, { size: r * 2.1, dur: 0.3, from: 0.25, to: 1, flat: true });
    fx.piece('ring', x, y, { size: r * 2.1, dur: 0.38, delay: 0.07, from: 0.25, to: 1, color, alpha: 0.8, flat: true });
    fx.piece('nova', x, y, { size: r * 1.9, dur: 0.24, from: 0.4, to: 1, color, alpha: 0.85, rot: rnd(0, TAU), flat: true });
    fx.glow(x, y, r * 1.1, color, 0.3, 0.6);
    dustRing(fx, x, y, r, 6);
    rocks(fx, x, y, r, 6);
  },

  /** 유성 낙하: 떨어진 자리에 큰 폭발과 그을린 자국. size 는 범위 반경 */
  'raon.ult'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    const r = o.size ?? 240;
    // 범위가 화면의 큰 부분을 덮으므로 겹치는 장수를 아낀다: 폭발 그림 한 장 + 고리 하나 + 바닥의 갈라짐 한 장
    fx.piece('crater', x, y, { size: r * 0.95, dur: 2.2, ground: true, hold: 0.6, alpha: 0.8 });
    if (!fx.flip('fb_boom', x, y, { h: 10, size: r * 2.5, dur: 0.6 })) {
      fx.piece('k_boom', x, y, { h: 10, size: r * 2.4, dur: 0.45, from: 0.35, to: 1.05, rot: rnd(-0.3, 0.3), hold: 0.35 });
    }
    fx.glow(x, y, r * 0.6, color, 0.3, 0.6);
    fx.piece('ring', x, y, { size: r * 2.1, dur: 0.36, from: 0.2, to: 1, color, flat: true });
    fx.piece('crack', x, y, { size: r * 1.6, dur: 0.6, rot: rnd(0, TAU), color, ground: true, hold: 0.4, alpha: 0.75 });
    dustRing(fx, x, y, r, 6);
    rocks(fx, x, y, r, 8);
  },

  // ---- 유나 ----------------------------------------------------------------

  /** 집중 포화를 켰다 */
  'yuna.ult'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    fx.piece('ring_energy', x, y, { size: 250, dur: 0.4, from: 0.2, to: 1, color, spin: -3, ground: true });
    pillar(fx, x, y, 230, color, 0.5, 1.2);
    fx.glow(x, y, 110, color, 0.4, 0.6, false, 30);
    sparkles(fx, x, y, color, 6);
  },

  // ---- 하루 ----------------------------------------------------------------

  /** 그림자 베기: (x, y)에서 (x2, y2)까지 지나간 자리에 빛줄기, 멈춘 곳에 십자 베기 */
  'haru.dash'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    const x2 = o.x2 ?? x;
    const y2 = o.y2 ?? y;
    const len = Math.hypot(x2 - x, y2 - y);
    const a = Math.atan2(y2 - y, x2 - x);
    fx.piece('thrust', x, y, { h: BODY, size: Math.max(80, len * 1.15), dur: 0.26, dir: a, flat: true, ax: 0, sy: 1.7, color, hold: 0.4 });
    fx.piece('cross', x2, y2, { h: BODY, size: 130, dur: 0.22, dir: a, from: 0.6, to: 1.1, color });
    fx.piece('star', x2, y2, { h: BODY, size: 90, dur: 0.16, rot: rnd(0, TAU) });
  },

  /** 난무의 한 번. (x, y)는 베인 적의 발밑, h 는 몸 가운데 높이, angle 은 벤 방향 */
  'haru.ult.cut'(fx, x, y, o) {
    if (!fx.allow('haruCut', 3, 0.05)) return;
    const a = o.angle ?? 0;
    const color = o.color ?? WHITE;
    const h = o.h ?? 0;
    fx.piece('cross', x, y, { h, size: rnd(110, 150), dur: 0.18, rot: rnd(0, TAU), from: 0.7, to: 1.15, color });
    fx.piece('thrust', x - Math.cos(a) * 80, y - Math.sin(a) * 80, { h, size: 180, dur: 0.14, dir: a, flat: true, ax: 0, sy: 1.5, color });
    fx.piece('star', x, y, { h, size: 70, dur: 0.12, rot: rnd(0, TAU) });
  },

  // ---- 로아 ----------------------------------------------------------------

  /** 백귀 진혼을 펼쳤다. size 는 표식이 붙는 거리 */
  'roa.ult.cast'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    fx.piece('circle', x, y, { size: 300, dur: 1, from: 0.5, to: 1, color, ground: true, spin: 1.2, fadeIn: 0.15, hold: 0.6, alpha: 0.9 });
    fx.piece('ring', x, y, { size: Math.min(900, (o.size ?? 300) * 2), dur: 0.5, from: 0.1, to: 1, color, alpha: 0.6, ground: true });
    pillar(fx, x, y, 240, color, 0.6, 1.2);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      fx.piece('wisp', x + Math.cos(a) * 70, y + Math.sin(a) * 40, { h: 10, size: 46, dur: 0.8, delay: i * 0.04, vy: -70, color, fadeIn: 0.2, hold: 0.6 });
    }
  },

  /** 적에게 붙은 혼령 표식. dur 초 뒤에 터진다. size 는 적의 반경 */
  'roa.ult.mark'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    const r = o.size ?? 20;
    const dur = o.dur ?? 1;
    fx.piece('wisp', x, y, { h: r * 2 + 26, size: 44, dur, from: 0.8, to: 1.15, color, fadeIn: 0.15, hold: 0.85 });
    fx.piece('ring_energy', x, y, { size: (r + 26) * 2, dur, from: 1.3, to: 0.7, color, ground: true, spin: 2, fadeIn: 0.2, hold: 0.9, alpha: 0.8 });
  },

  /** 혼령 표식이 터졌다. size 는 적의 반경 */
  'roa.ult.boom'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    const r = (o.size ?? 20) + 30;
    const h = r * 0.5;
    if (!fx.flip('fb_spirit', x, y, { h, size: r * 3.6, dur: 0.6 })) {
      fx.piece('k_spirit', x, y, { h, size: r * 3.2, dur: 0.5, from: 0.3, to: 1.1, rot: rnd(0, TAU), spin: 3, hold: 0.3 });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + rnd(-0.4, 0.4);
        fx.piece('wisp', x, y, { h, size: 40, dur: 0.5, vx: Math.cos(a) * 90, vy: Math.sin(a) * 60 - 90, color, hold: 0.4 });
      }
    }
    fx.piece('ring', x, y, { size: r * 2.2, dur: 0.3, from: 0.3, to: 1, color, ground: true });
    pillar(fx, x, y, 200, color, 0.35, 1);
  },

  // ---- 이브 ----------------------------------------------------------------

  /** 전투 깃발을 꽂았다. size 는 범위 반경 */
  'eve.flag'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    fx.piece('ring', x, y, { size: (o.size ?? 160) * 2, dur: 0.45, from: 0.1, to: 1, color, ground: true });
    pillar(fx, x, y, 200, color, 0.4, 1);
    sparkles(fx, x, y, color, 4, 30);
  },

  /** 진군 나팔: 함성이 겹겹이 퍼져 나간다 */
  'eve.ult'(fx, x, y, o) {
    const color = o.color ?? WHITE;
    for (let i = 0; i < 3; i++) {
      fx.piece('ring', x, y, { size: 440 + i * 200, dur: 0.5, delay: i * 0.1, from: 0.1, to: 1, color: i === 1 ? WHITE : color, alpha: 0.85 - i * 0.15, flat: true });
    }
    pillar(fx, x, y, 280, color, 0.6, 1.4);
    fx.piece('nova', x, y, { h: 30, size: 200, dur: 0.25, from: 0.4, to: 1, color, alpha: 0.7, rot: rnd(0, TAU) });
    fx.glow(x, y, 140, color, 0.45, 0.6, false, 30);
    sparkles(fx, x, y, color, 8, 60);
  },

  // ---- 시즌 2: 불, 포자, 몬스터의 타격 --------------------------------------

  /** 불이 터진다 (보스의 회전·불기둥·필살기, 잿불 망토). size 는 범위 반경 */
  'fire.burst'(fx, x, y, o) {
    const color = o.color ?? FIRE;
    const r = o.size ?? 100;
    fx.piece('nova', x, y, { size: r * 1.9, dur: 0.24, from: 0.4, to: 1, color, alpha: 0.8, rot: rnd(0, TAU), flat: true });
    fx.piece('ring', x, y, { size: r * 2.1, dur: 0.3, from: 0.3, to: 1, color, ground: true });
    fx.glow(x, y, r, color, 0.3, 0.55);
    if (!fx.allow('fireBurst', 3, 0.1)) return;
    const n = Math.max(3, Math.min(7, Math.round(r / 28)));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rnd(-0.3, 0.3);
      const d = r * rnd(0.25, 0.7);
      fx.piece('flame', x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, { size: rnd(54, 84), dur: rnd(0.4, 0.6), delay: rnd(0, 0.08), ay: 0.92, from: 0.6, to: 1.15, color, vy: -30, hold: 0.4 });
    }
  },

  /** 불의 파도가 (x, y)에서 (x2, y2)까지 휩쓴다. size 는 반폭 */
  'fire.wave'(fx, x, y, o) {
    const color = o.color ?? FIRE;
    const x2 = o.x2 ?? x;
    const y2 = o.y2 ?? y;
    const half = o.size ?? 80;
    const len = Math.hypot(x2 - x, y2 - y);
    const a = Math.atan2(y2 - y, x2 - x);
    fx.piece('thrust', x, y, { size: len * 1.1, dur: 0.4, dir: a, flat: true, ax: 0, sy: Math.max(1.5, half / 28), color, alpha: 0.8, hold: 0.4 });
    const n = Math.max(4, Math.round(len / 70));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const side = rnd(-half, half) * 0.7;
      fx.piece('flame', x + Math.cos(a) * len * t - Math.sin(a) * side, y + Math.sin(a) * len * t + Math.cos(a) * side, {
        size: rnd(70, 110),
        dur: rnd(0.45, 0.65),
        delay: t * 0.22,
        ay: 0.92,
        from: 0.6,
        to: 1.15,
        color,
        vy: -30,
        hold: 0.4,
      });
    }
    fx.glow(x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5, half * 1.6, color, 0.35, 0.5);
  },

  /** 포자가 터져 퍼진다. size 는 구름의 반경 */
  'spore.burst'(fx, x, y, o) {
    const r = o.size ?? 120;
    fx.piece('ring', x, y, { size: r * 2, dur: 0.4, from: 0.15, to: 1, color: SPORE, alpha: 0.7, ground: true });
    const n = Math.max(5, Math.min(9, Math.round(r / 18)));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rnd(-0.3, 0.3);
      const v = fx.gv(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.6);
      fx.piece('puff', x + Math.cos(a) * 12, y + Math.sin(a) * 8, {
        h: 14,
        size: rnd(60, 96),
        dur: rnd(0.7, 1),
        from: 0.4,
        to: 1.3,
        color: SPORE,
        blend: 'normal',
        alpha: 0.55,
        vx: v.x,
        vy: v.y,
        rot: rnd(0, TAU),
        hold: 0.35,
      });
    }
  },

  /** 장비 "나무꾼의 도끼날": 앞을 내려찍는다. size 는 범위 반경 */
  'equip.axe'(fx, x, y, o) {
    const r = o.size ?? 80;
    fx.piece('arc_heavy', x, y, { h: BODY, size: r * 1.9, dur: 0.2, dir: (o.angle ?? 0) + Math.PI / 2, flat: true, from: 0.7, to: 1.05, color: 0xdfe6ee });
    fx.piece('crack', x, y, { size: r * 1.7, dur: 0.5, rot: rnd(0, TAU), ground: true, alpha: 0.7, hold: 0.4 });
    dustRing(fx, x, y, r * 0.8, 3);
  },

  /** 몬스터가 빙글 돌며 둘레를 친다. size 는 범위 반경 */
  'enemy.spin'(fx, x, y, o) {
    const r = o.size ?? 80;
    const color = mix(o.color ?? WHITE, 0xff5a5a, 0.5);
    fx.piece('ring', x, y, { size: r * 2.05, dur: 0.22, from: 0.5, to: 1, color, alpha: 0.85, ground: true });
    fx.piece('arc', x, y, { h: BODY, size: r * 1.9, dur: 0.18, rot: rnd(0, TAU), spin: 14, color, alpha: 0.9, flat: true });
  },

  /** 몬스터가 크게 내려찍었다. size 는 범위 반경 */
  'enemy.slam'(fx, x, y, o) {
    const r = o.size ?? 100;
    const color = mix(o.color ?? WHITE, 0xff7a4a, 0.55);
    fx.piece('crack', x, y, { size: r * 1.9, dur: 0.7, rot: rnd(0, TAU), color, ground: true, alpha: 0.8, hold: 0.45 });
    fx.piece('ring', x, y, { size: r * 2.1, dur: 0.28, from: 0.3, to: 1, color, flat: true });
    fx.glow(x, y, r * 0.9, color, 0.22, 0.45);
    dustRing(fx, x, y, r, 5);
    rocks(fx, x, y, r, 4);
  },
};

/**
 * 이펙트 그림을 읽지 못했을 때 도형으로 대신하지 않는 이름.
 * 다른 기본 이펙트(고리·불꽃 등)에 덧붙는 장식이라, 없어도 무슨 일인지 알 수 있는 것들이다.
 */
export const FALLBACK_QUIET = new Set(['hit', 'die', 'cast.ult', 'dash', 'swap', 'pickup', 'muzzle', 'haru.ult.cut', 'roa.ult.mark']);
