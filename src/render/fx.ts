// 일회성 이펙트 (베기 궤적, 폭발, 번개, 피해 숫자). 규칙 코드의 FxApi 요청을 화면에 그린다.
//
// 그리는 재료는 두 가지다 (render/fxArt.ts).
//  - 조각: 그림 한 장. piece() 가 크기·회전·투명도·색을 시간에 따라 움직인다.
//  - 플립북: 영상에서 뽑은 여러 장. flip() 이 차례로 넘긴다.
// 이름으로 부르는 이펙트(play)가 이 재료를 어떻게 엮는지는 render/fxRecipes.ts 에 있다.
// 이펙트 그림을 읽지 못했으면 예전처럼 도형으로 그린다.
//
// 좌표 약속: (x, y)는 언제나 바닥의 한 점(월드 좌표)이고, 바닥에서 띄울 높이는 h 로 따로 준다.
// 화면을 어느 각도로 그리는지(render/proj.ts)는 여기서 풀어 준다:
//  - 세워 그리는 조각(불기둥, 섬광, 숫자)은 그 점의 화면 위치에서 h 만큼 위에 놓는다.
//  - 눕혀 그리는 조각(ground, flat: 퍼지는 고리, 휘두른 궤적)은 바닥처럼 기운 층에 놓는다.
import { BitmapText, Container, Graphics, Sprite } from 'pixi.js';
import type { FxApi, FxOpts, NumKind } from '../game/entities';
import { fxArt } from './fxArt';
import { audio } from '../audio/audio';
import { FALLBACK_QUIET, RECIPES, vivid } from './fxRecipes';
import { proj } from './proj';
import type { Stage } from './Stage';

interface FxItem {
  obj: Container;
  t: number;
  dur: number;
  step: (k: number, obj: Container, dt: number) => void;
  pooled?: BitmapText[];
}

/** 조각을 어디에 어떻게 놓을지 */
interface SpotOpts {
  /** 바닥 층에 그린다 (캐릭터 아래) */
  ground?: boolean;
  /**
   * 바닥과 나란한 면에 눕혀 그린다 (퍼지는 고리, 휘두른 궤적, 뻗는 빛줄기).
   * 마름모 화면에서는 바닥처럼 납작하게 기운다. 기존 화면에서는 차이가 없다. ground 면 언제나 눕는다
   */
  flat?: boolean;
  /** 바닥에서의 높이 (px) */
  h?: number;
  /** 회전 (rad, 화면 기준) */
  rot?: number;
  /** 바닥 위의 방향 (rad). 주면 rot 대신 이 방향을 화면에 맞게 돌려 쓴다 (조준 방향으로 뻗는 섬광 등) */
  dir?: number;
  /** (x, y)가 이미 화면(월드 층) 좌표다. 두 점 사이를 화면에서 잇는 번개 등 */
  screen?: boolean;
}

/** 조각 하나를 어떻게 움직일지 */
export interface PieceOpts extends SpotOpts {
  /** 긴 변의 길이 (월드 px) */
  size: number;
  /** 보이는 시간 (초) */
  dur: number;
  /** 이만큼 기다렸다가 나타난다 (초) */
  delay?: number;
  /** 시작·끝 크기 배율 (기본 1 → 1). 빠르게 커졌다가 느려진다 */
  from?: number;
  to?: number;
  /** 가로·세로만 따로 늘이는 배율 */
  sx?: number;
  sy?: number;
  /** 초당 회전 */
  spin?: number;
  /** 입힐 색. 색이 들어 있는 조각에는 쓰지 않는다 */
  color?: number;
  /** 가장 진할 때의 불투명도 (기본 1) */
  alpha?: number;
  /** 흰 심지의 불투명도 (기본 0.7, 넓은 조각은 기본 0. 0이면 그리지 않는다) */
  core?: number;
  /** 합성 방식. 빛은 더하기(add), 연기·물체는 보통(normal). 기본은 조각 종류에 따른다 */
  blend?: 'add' | 'normal';
  /** 기준점 (0~1, 기본 가운데) */
  ax?: number;
  ay?: number;
  /** 이동 속도(px/초)와 아래로 당기는 힘(px/초²). 화면 기준 (눕힌 조각은 바닥 기준) */
  vx?: number;
  vy?: number;
  gy?: number;
  /** 전체 시간 중 나타나는 데 쓰는 비율 (기본 0: 바로 나타난다) */
  fadeIn?: number;
  /** 전체 시간 중 이 비율까지는 흐려지지 않는다 (기본 0.25) */
  hold?: number;
}

export interface FlipOpts {
  /** 한 변의 길이 (월드 px). 없으면 표에 적힌 크기 */
  size?: number;
  dur?: number;
  delay?: number;
  rot?: number;
  ax?: number;
  ay?: number;
  color?: number;
  alpha?: number;
  ground?: boolean;
  /** 바닥에서의 높이 (px) */
  h?: number;
}

const NUM_STYLE: Record<NumKind, { color: number; size: number; prefix: string }> = {
  dmg: { color: 0xffffff, size: 20, prefix: '' },
  crit: { color: 0xffd84a, size: 28, prefix: '' },
  weak: { color: 0xff9d5c, size: 23, prefix: '' },
  heal: { color: 0x7dff9b, size: 20, prefix: '+' },
  hurt: { color: 0xff5a6a, size: 24, prefix: '-' },
  shard: { color: 0x9fd8ff, size: 17, prefix: '+' },
};

const FONT = 'Arial, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

/** 이보다 긴 조각(월드 px)은 "넓은 조각"으로 보고 한 겹으로만 그린다 */
const BIG_PIECE = 300;

/** 한꺼번에 떠 있을 수 있는 이펙트 수. 넘으면 새로 요청된 장식용 이펙트를 건너뛴다 (저사양 폰 보호) */
const MAX_ITEMS = 260;

export class Fx implements FxApi {
  private items: FxItem[] = [];
  private numPool: BitmapText[] = [];
  /** 이펙트가 시작된 뒤 흐른 시간 (초) */
  time = 0;
  /** 필드 캐릭터의 무기 끝: 그 바로 아래 바닥의 점과 높이. 월드 표시부가 매 프레임 알려 준다 */
  weapon: { x: number; y: number; h: number } | null = null;
  private budgets = new Map<string, { t: number; n: number }>();

  constructor(private stage: Stage) {}

  private add(obj: Container, dur: number, step: FxItem['step'], layer: Container = this.stage.fx, delay = 0): FxItem {
    layer.addChild(obj);
    const item: FxItem = { obj, t: -delay, dur, step };
    this.items.push(item);
    if (delay > 0) obj.visible = false;
    else step(0, obj, 0);
    return item;
  }

  update(dt: number): void {
    this.time += dt;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      const before = it.t;
      it.t += dt;
      if (it.t < 0) continue;
      if (before < 0) it.obj.visible = true;
      const k = Math.min(1, it.t / it.dur);
      it.step(k, it.obj, before < 0 ? it.t : dt);
      if (k >= 1) {
        this.items.splice(i, 1);
        it.obj.removeFromParent();
        if (it.pooled) it.pooled.push(it.obj as BitmapText);
        else it.obj.destroy({ children: true });
      }
    }
  }

  clear(): void {
    for (const it of this.items) {
      it.obj.removeFromParent();
      if (it.pooled) it.pooled.push(it.obj as BitmapText);
      else it.obj.destroy({ children: true });
    }
    this.items.length = 0;
    this.budgets.clear();
  }

  /** 이펙트 그림이 준비됐는지 */
  get art(): boolean {
    return fxArt.get() !== null;
  }

  /** 같은 종류의 이펙트가 짧은 시간에 너무 많이 겹치지 않게 한다. window 초 동안 max 번까지만 true */
  allow(key: string, max: number, window: number): boolean {
    let b = this.budgets.get(key);
    if (!b || this.time - b.t > window) {
      b = { t: this.time, n: 0 };
      this.budgets.set(key, b);
    }
    return ++b.n <= max;
  }

  /** 이펙트를 그릴 자리(바닥의 점과 높이). at: 'weapon' 이면 필드 캐릭터의 무기 끝, 아니면 주어진 자리 */
  origin(o: FxOpts, x: number, y: number, h = 0): { x: number; y: number; h: number } {
    return o.at === 'weapon' && this.weapon ? this.weapon : { x, y, h };
  }

  /** 바닥 위의 방향 a 로 len 만큼 가는 것이 화면에서는 어느 쪽으로 얼마인지 (세워 그리는 조각의 이동 속도에 쓴다) */
  vec(a: number, len: number): { x: number; y: number } {
    return this.gv(Math.cos(a) * len, Math.sin(a) * len);
  }

  /** 바닥 위의 벡터 → 화면 벡터 */
  gv(dx: number, dy: number): { x: number; y: number } {
    return { x: proj.vx(dx, dy), y: proj.vy(dx, dy) };
  }

  /** 화면에서 가로로 d 만큼 떨어진 바닥의 점까지의 이동량 (좌우로 흩뿌릴 때) */
  side(d: number): { x: number; y: number } {
    return { x: proj.sideX(d), y: proj.sideY(d) };
  }

  /**
   * 조각이 놓일 층과, 그 층에서의 좌표·회전.
   * 눕히는 조각은 바닥처럼 기운 층에 월드 좌표 그대로, 세우는 조각은 화면 좌표로 바꿔 놓는다
   */
  private spot(x: number, y: number, o: SpotOpts): { layer: Container; x: number; y: number; rot: number } {
    const stage = this.stage;
    const h = o.h ?? 0;
    if (o.screen) return { layer: o.ground ? stage.decals : stage.fx, x, y: y - h, rot: o.rot ?? 0 };
    if (o.ground || (o.flat && proj.iso)) {
      return { layer: o.ground ? stage.decals : stage.fxFlat, x: x + proj.liftX(h), y: y + proj.liftY(h), rot: o.dir ?? o.rot ?? 0 };
    }
    return { layer: stage.fx, x: proj.x(x, y), y: proj.y(x, y) - h, rot: o.dir !== undefined ? proj.angle(o.dir) : (o.rot ?? 0) };
  }

  // ---- 재료 ---------------------------------------------------------------

  /** 조각 하나를 띄운다. 그림이 없으면 false */
  piece(id: string, x: number, y: number, o: PieceOpts): boolean {
    const p = fxArt.piece(id);
    if (!p || this.items.length >= MAX_ITEMS) return false;
    const at = this.spot(x, y, o);
    const c = new Container();
    c.position.set(at.x, at.y);
    c.rotation = at.rot;
    const blend = o.blend ?? (p.colored && !p.glow ? 'normal' : 'add');
    const main = new Sprite(p.tex);
    main.anchor.set(o.ax ?? 0.5, o.ay ?? 0.5);
    main.blendMode = blend;
    if (!p.colored && o.color !== undefined) main.tint = blend === 'add' ? vivid(o.color) : o.color;
    c.addChild(main);
    // 넓은 조각은 흰 심지를 겹치지 않는다. 화면의 큰 부분을 두 번 칠하게 되는데, 넓게 번진 빛에서는 심지가 거의 보이지 않는다
    const coreA = o.core ?? (o.size > BIG_PIECE ? 0 : 0.7);
    if (p.core && coreA > 0 && blend === 'add') {
      const core = new Sprite(p.core);
      core.anchor.set(o.ax ?? 0.5, o.ay ?? 0.5);
      core.blendMode = 'add';
      core.alpha = coreA;
      c.addChild(core);
    }
    const base = o.size / p.long;
    const from = o.from ?? 1;
    const to = o.to ?? 1;
    const sx = o.sx ?? 1;
    const sy = o.sy ?? 1;
    const peak = o.alpha ?? 1;
    const fadeIn = o.fadeIn ?? 0;
    const hold = Math.max(fadeIn, o.hold ?? 0.25);
    const spin = o.spin ?? 0;
    let vx = o.vx ?? 0;
    let vy = o.vy ?? 0;
    const gy = o.gy ?? 0;
    this.add(
      c,
      o.dur,
      (k, obj, dt) => {
        const e = 1 - (1 - k) * (1 - k);
        const s = base * (from + (to - from) * e);
        obj.scale.set(s * sx, s * sy);
        obj.alpha = peak * (k < fadeIn ? k / fadeIn : k <= hold ? 1 : Math.max(0, (1 - k) / (1 - hold)));
        if (spin) obj.rotation += spin * dt;
        if (vx || vy || gy) {
          vy += gy * dt;
          obj.x += vx * dt;
          obj.y += vy * dt;
        }
      },
      at.layer,
      o.delay,
    );
    return true;
  }

  /** 플립북 하나를 띄운다. 그림이 없으면 false */
  flip(id: string, x: number, y: number, o: FlipOpts = {}): boolean {
    const f = fxArt.flip(id);
    if (!f || this.items.length >= MAX_ITEMS) return false;
    const at = this.spot(x, y, o);
    const s = new Sprite(f.frames[0]);
    s.anchor.set(o.ax ?? 0.5, o.ay ?? 0.5);
    s.position.set(at.x, at.y);
    s.rotation = at.rot;
    s.blendMode = 'add';
    if (o.color !== undefined) s.tint = o.color;
    s.alpha = o.alpha ?? 1;
    s.scale.set((o.size ?? f.size) / f.frames[0].width);
    const n = f.frames.length;
    this.add(
      s,
      o.dur ?? f.play,
      (k, obj) => {
        (obj as Sprite).texture = f.frames[Math.min(n - 1, Math.floor(k * n))];
      },
      at.layer,
      o.delay,
    );
    return true;
  }

  /** 부드러운 빛 번짐 (그림 없이도 그릴 수 있다). h 는 바닥에서의 높이 */
  glow(x: number, y: number, r: number, color: number, dur: number, alpha = 0.6, ground = false, h = 0): void {
    const at = this.spot(x, y, { ground, h });
    const s = new Sprite(this.stage.tex.glow);
    s.anchor.set(0.5);
    s.tint = vivid(color);
    s.blendMode = 'add';
    s.position.set(at.x, at.y);
    this.add(
      s,
      dur,
      (k, o) => {
        o.alpha = alpha * (1 - k);
        o.scale.set(((0.7 + 0.3 * k) * r) / 64);
      },
      at.layer,
    );
  }

  // ---- 이름으로 부르는 이펙트 ---------------------------------------------

  play(name: string, x: number, y: number, o: FxOpts = {}): void {
    // 같은 이름의 소리를 함께 낸다 (data/sound/cues.csv 에 그 이름이 있을 때)
    audio.cue(name, { x, y, style: o.style });
    const recipe = RECIPES[name];
    if (!recipe) return;
    if (this.art) {
      recipe(this, x, y, o);
      return;
    }
    // 그림을 읽지 못했을 때: 스킬 이펙트만 간단한 도형으로 알린다
    if (FALLBACK_QUIET.has(name)) return;
    const color = o.color ?? 0xffffff;
    if (o.x2 !== undefined && o.y2 !== undefined) this.bolt(x, y, o.x2, o.y2, color, 24, 24);
    else if (o.arc !== undefined) this.slash(x, y, o.angle ?? 0, o.size ?? 80, o.arc, color, true);
    else {
      this.blast(x, y, o.size ?? 60, color, 0.3);
      this.ring(x, y, o.size ?? 60, 0xffffff, 0.3);
    }
  }

  /** 소리만 나는 일 */
  sound(name: string, x?: number, y?: number, style?: string): void {
    audio.cue(name, { x, y, style });
  }

  // ---- 기본 이펙트 ---------------------------------------------------------

  slash(x: number, y: number, angle: number, reach: number, arc: number, color: number, heavy = false): void {
    if (this.art) {
      // 넓게 휘두르는 베기는 앞뒤 두 장으로 나눠 그린다
      const halves = arc > Math.PI * 1.15 ? 2 : 1;
      const span = Math.min(arc / halves, Math.PI * 0.95);
      const chord = 2 * reach * Math.sin(span / 2);
      const id = heavy ? 'arc_heavy' : 'arc';
      const tex = fxArt.piece(id)!.tex;
      const size = Math.max(60, Math.min(chord * 1.05, reach * 1.7));
      // 그림을 높이(시위 길이)에 맞추면 두께가 너무 두꺼워질 수 있어, 두께는 닿는 거리의 일부로 따로 맞춘다
      const thick = (size * tex.width) / Math.max(tex.width, tex.height);
      const sx = Math.min(1, (reach * (heavy ? 0.95 : 0.5)) / thick);
      for (let i = 0; i < halves; i++) {
        const a = angle + i * Math.PI;
        // 몸 가운데 높이에서 바닥과 나란히 휘두른다
        this.piece(id, x + Math.cos(a) * reach * 1.04, y + Math.sin(a) * reach * 1.04, {
          size,
          dur: heavy ? 0.24 : 0.17,
          dir: a,
          flat: true,
          h: 24,
          ax: 1,
          sx,
          from: 0.86,
          to: 1.06,
          color,
          hold: 0.3,
        });
      }
      return;
    }
    const g = new Graphics();
    const inner = reach * (heavy ? 0.35 : 0.5);
    g.moveTo(Math.cos(-arc / 2) * inner, Math.sin(-arc / 2) * inner)
      .arc(0, 0, reach, -arc / 2, arc / 2)
      .arc(0, 0, inner, arc / 2, -arc / 2, true)
      .closePath()
      .fill({ color, alpha: heavy ? 0.75 : 0.55 });
    g.moveTo(Math.cos(-arc / 2) * reach, Math.sin(-arc / 2) * reach)
      .arc(0, 0, reach, -arc / 2, arc / 2)
      .stroke({ color: 0xffffff, width: heavy ? 5 : 3, alpha: 0.9 });
    const at = this.spot(x, y, { flat: true, h: 24, dir: angle });
    g.position.set(at.x, at.y);
    g.rotation = at.rot;
    this.add(
      g,
      heavy ? 0.26 : 0.18,
      (k, o) => {
        o.alpha = 1 - k * k;
        o.scale.set(0.85 + k * 0.2);
      },
      at.layer,
    );
  }

  ring(x: number, y: number, r: number, color: number, dur = 0.35): void {
    if (this.piece('ring', x, y, { size: r * 2.1, dur, from: 0.25, to: 1, color, rot: Math.random() * 6.28, hold: 0.1, flat: true })) return;
    const at = this.spot(x, y, { flat: true });
    const s = new Sprite(this.stage.tex.ring);
    s.anchor.set(0.5);
    s.tint = color;
    s.position.set(at.x, at.y);
    this.add(
      s,
      dur,
      (k, o) => {
        o.alpha = 1 - k;
        o.scale.set(((0.25 + 0.75 * (1 - (1 - k) * (1 - k))) * r) / 60);
      },
      at.layer,
    );
  }

  blast(x: number, y: number, r: number, color: number, dur = 0.3): void {
    if (this.art) {
      // 범위를 채우는 폭발: 번지는 빛 + 방사형 섬광 + 가장자리 고리
      this.glow(x, y, r * 1.15, color, dur, 0.5);
      this.piece('nova', x, y, { size: r * 2.1, dur: dur * 0.9, from: 0.45, to: 1, color, rot: Math.random() * 6.28, alpha: 0.9, hold: 0.2, flat: true });
      this.piece('ring', x, y, { size: r * 2.1, dur, from: 0.5, to: 1, color, alpha: 0.8, hold: 0.15, flat: true });
      return;
    }
    const at = this.spot(x, y, { flat: true });
    const s = new Sprite(this.stage.tex.disc);
    s.anchor.set(0.5);
    s.tint = color;
    s.position.set(at.x, at.y);
    s.blendMode = 'add';
    this.add(
      s,
      dur,
      (k, o) => {
        o.alpha = 0.55 * (1 - k);
        o.scale.set(((0.6 + 0.4 * k) * r) / 63);
      },
      at.layer,
    );
  }

  /**
   * @param h 바닥에서의 높이
   * @param angle 튀는 방향 (바닥 위의 방향, rad). 없으면 사방으로
   */
  sparks(x: number, y: number, color: number, count = 5, h = 0, angle?: number, spread = Math.PI): void {
    for (let i = 0; i < count; i++) {
      const a = angle === undefined ? Math.random() * Math.PI * 2 : angle + (Math.random() * 2 - 1) * spread;
      const v = 80 + Math.random() * 190;
      const g = this.vec(a, v);
      const vx = g.x;
      const vy = g.y - 30;
      const dur = 0.24 + Math.random() * 0.2;
      if (this.piece('spark', x, y, { size: 16 + Math.random() * 16, dur, rot: Math.atan2(vy, vx), ax: 0.8, color, vx, vy, gy: 220, to: 0.5, hold: 0.3, h })) continue;
      const s = new Sprite(this.stage.tex.dot);
      s.anchor.set(0.5);
      s.tint = color;
      s.position.set(proj.x(x, y), proj.y(x, y) - h);
      const size = 0.25 + Math.random() * 0.4;
      this.add(s, dur, (k, o, dt) => {
        o.x += vx * dt;
        o.y += vy * dt;
        o.alpha = 1 - k;
        o.scale.set(size * (1 - k * 0.6));
      });
    }
  }

  private jagged(g: Graphics, x1: number, y1: number, x2: number, y2: number, jitter: number): void {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(2, Math.round(len / 28));
    const nx = -(y2 - y1) / (len || 1);
    const ny = (x2 - x1) / (len || 1);
    g.moveTo(x1, y1);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const off = (Math.random() * 2 - 1) * jitter;
      g.lineTo(x1 + (x2 - x1) * t + nx * off, y1 + (y2 - y1) * t + ny * off);
    }
    g.lineTo(x2, y2);
  }

  /** 두 점을 잇는 번개. (wx, wy)는 바닥의 점, h1·h2 는 두 끝의 높이 */
  bolt(wx1: number, wy1: number, wx2: number, wy2: number, color: number, h1 = 0, h2 = 0): void {
    audio.cue('bolt', { x: wx2, y: wy2 });
    // 화면에서 두 점을 잇는다
    const x1 = proj.x(wx1, wy1);
    const y1 = proj.y(wx1, wy1) - h1;
    const x2 = proj.x(wx2, wy2);
    const y2 = proj.y(wx2, wy2) - h2;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const p = fxArt.piece('chain');
    if (p && len > 4) {
      // 번개 그림을 두 점 사이에 늘여 놓는다. 길이에 맞춰 가로만 늘이고, 굵기는 따로 정한다
      const rot = Math.atan2(y2 - y1, x2 - x1);
      const thick = Math.max(26, Math.min(64, len * 0.3));
      const size = (thick * p.long) / p.tex.height;
      const sx = len / ((p.tex.width * thick) / p.tex.height);
      for (let i = 0; i < 2; i++) {
        this.piece('chain', x1, y1, { size, dur: 0.16, delay: i * 0.05, rot, ax: 0, sx, sy: i ? -1 : 1, color, hold: 0.4, screen: true });
      }
      this.piece('hit', x2, y2, { size: 40, dur: 0.14, color, rot: Math.random() * 6.28, screen: true });
      return;
    }
    const g = new Graphics();
    this.jagged(g, x1, y1, x2, y2, 12);
    g.stroke({ color, width: 4, alpha: 0.9 });
    this.jagged(g, x1, y1, x2, y2, 6);
    g.stroke({ color: 0xffffff, width: 1.5 });
    this.add(g, 0.16, (k, o) => {
      o.alpha = 1 - k;
    });
  }

  strike(x: number, y: number, color: number): void {
    if (this.art) {
      // 위에서 내리꽂는 번개: 발밑을 기준으로 세우고, 한 번 뒤집어 깜빡이게 한다
      for (let i = 0; i < 2; i++) {
        this.piece('lightning', x, y, { size: 400, dur: 0.14, delay: i * 0.06, ay: 0.98, sx: (i ? -1 : 1) * 1.25, color, hold: 0.5 });
      }
      this.piece('nova', x, y, { size: 110, dur: 0.2, from: 0.5, to: 1, color, ground: true, alpha: 0.9 });
      this.glow(x, y, 70, color, 0.25, 0.7);
      return;
    }
    const g = new Graphics();
    const sx = proj.x(x, y);
    const sy = proj.y(x, y);
    this.jagged(g, sx + (Math.random() * 60 - 30), sy - 420, sx, sy, 16);
    g.stroke({ color, width: 6, alpha: 0.85 });
    this.jagged(g, sx, sy - 420, sx, sy, 8);
    g.stroke({ color: 0xffffff, width: 2 });
    this.add(g, 0.2, (k, o) => {
      o.alpha = 1 - k;
    });
  }

  /** 위에서 떨어지는 짧은 줄기 (화살비 등). 표시 전용 */
  streak(x: number, y: number, color: number): void {
    if (this.piece('arrow', x, y, { size: 54, dur: 0.15, rot: Math.PI / 2, ax: 0.9, color, vy: 600, hold: 0.8, h: 90 })) {
      // 땅에 닿는 자리에 작은 물결
      if (this.allow('rainHit', 2, 0.1)) this.piece('ring', x, y, { size: 30, dur: 0.22, delay: 0.15, from: 0.3, to: 1, color, alpha: 0.7, ground: true });
      return;
    }
    const g = new Graphics().moveTo(0, -46).lineTo(0, 0).stroke({ color, width: 2.5, alpha: 0.9 });
    const gx = proj.x(x, y);
    const gy = proj.y(x, y);
    g.position.set(gx, gy);
    this.add(g, 0.16, (k, o) => {
      o.y = gy - 70 * (1 - k);
      o.alpha = k < 0.8 ? 1 : (1 - k) * 5;
    });
  }

  private text(str: string, size: number, color: number): BitmapText {
    let t = this.numPool.pop();
    if (!t) {
      t = new BitmapText({
        text: str,
        style: { fontFamily: FONT, fontSize: 32, fontWeight: 'bold', fill: 0xffffff, stroke: { color: 0x15131f, width: 5 } },
      });
      t.anchor.set(0.5);
    }
    t.text = str;
    t.tint = color;
    t.scale.set(size / 32);
    t.alpha = 1;
    t.visible = true;
    return t;
  }

  /** (wx, wy)는 바닥의 점, h 는 그 위로 띄우는 높이 */
  number(wx: number, wy: number, value: number, kind: NumKind, h = 0): void {
    const st = NUM_STYLE[kind];
    const t = this.text(st.prefix + value, st.size, st.color);
    const ox = (Math.random() * 2 - 1) * 14;
    const base = st.size / 32;
    const x = proj.x(wx, wy);
    const y = proj.y(wx, wy) - h;
    const item = this.add(t, kind === 'crit' ? 0.75 : 0.6, (k, o) => {
      o.position.set(x + ox, y - 34 * (1 - (1 - k) * (1 - k)));
      o.alpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      o.scale.set(base * (k < 0.15 ? 1.5 - k * 3.3 : 1));
    });
    item.pooled = this.numPool;
  }

  label(wx: number, wy: number, str: string, color: number, h = 0): void {
    const t = this.text(str, 22, color);
    const x = proj.x(wx, wy);
    const y = proj.y(wx, wy) - h;
    const item = this.add(t, 1.1, (k, o) => {
      o.position.set(x, y - 26 * k);
      o.alpha = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
    });
    item.pooled = this.numPool;
  }

  shake(power: number): void {
    this.stage.cam.shake = Math.max(this.stage.cam.shake, power);
  }
}
