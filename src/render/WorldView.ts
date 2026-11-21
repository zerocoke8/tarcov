// 전투 월드의 상태를 읽어 화면에 반영한다. 규칙은 다루지 않는다.
import { BitmapText, Container, Graphics, GraphicsContext, Sprite, Assets, type Texture } from 'pixi.js';
import { shade } from '../core/math';
import type { Enemy } from '../game/enemy/Enemy';
import type { Barrier, Mushroom, Projectile, Thing, Zone } from '../game/entities';
import type { EntryStyle } from '../game/player/kit';
import { TILE } from '../game/world/layout';
import { db } from '../data/tables';
import type { World } from '../game/world/World';
import { Fx } from './fx';
import { fxArt, type FxPiece } from './fxArt';
import { mix, vivid } from './fxRecipes';
import { buildIsoMapView, type IsoMapView } from './isoMapView';
import { buildMapView } from './mapView';
import { proj } from './proj';
import type { Stage } from './Stage';
import { asset } from '../ui/assets';
import { scenery } from './scenery';
import { SpriteBody } from './sprites/SpriteBody';
import { sprites } from './sprites/SpriteStore';
import { createCharView, createEnemyView } from './views/registry';
import type { CharPose, CharView, EnemyView } from './views/types';

const FONT = 'Arial, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

interface Disposable {
  destroy(): void;
}

// ---- 투사체 ----------------------------------------------------------------

const projContexts = new Map<string, GraphicsContext>();

/** 투사체 모양. 오른쪽(+x)을 향하게 그리고 흰색으로 채운 뒤 색을 입힌다 */
function projContext(look: string): GraphicsContext {
  let c = projContexts.get(look);
  if (c) return c;
  c = new GraphicsContext();
  switch (look) {
    case 'bolt':
      c.roundRect(-13, -3.5, 26, 7, 3.5).fill(0xffffff);
      break;
    case 'arrow':
      c.rect(-18, -1.3, 30, 2.6).fill(0xffffff).poly([10, -5.5, 22, 0, 10, 5.5]).fill(0xffffff);
      break;
    case 'bigarrow':
      c.rect(-90, -6, 120, 12).fill(0xffffff).poly([24, -22, 78, 0, 24, 22]).fill(0xffffff);
      break;
    case 'wave':
      // 반지름 1 기준의 초승달. 투사체 크기에 맞춰 확대한다
      c.arc(-0.75, 0, 1.35, -0.85, 0.85).stroke({ color: 0xffffff, width: 0.42 });
      break;
    case 'pellet':
      c.roundRect(-6, -2.5, 12, 5, 2.5).fill(0xffffff);
      break;
    case 'bullet':
      c.roundRect(-11, -2, 22, 4, 2).fill(0xffffff);
      break;
    case 'talisman':
      c.rect(-10, -6.5, 20, 13).fill(0xffffff).rect(-5, -3.5, 10, 7).fill(0xc8323c);
      break;
    default:
      c.circle(0, 0, 6).fill(0xffffff);
  }
  projContexts.set(look, c);
  return c;
}

/** 투사체 그림: 조각 이름, 긴 변의 길이(월드 px. byR 이면 판정 반경에 곱한 값), 기준점, 제자리 회전 */
const PROJ_ART: Record<string, { piece: string; size: number; byR?: boolean; min?: number; max?: number; ax: number; spin?: number }> = {
  bolt: { piece: 'orb', size: 40, ax: 0.5, spin: 9 },
  arrow: { piece: 'arrow', size: 66, ax: 0.85 },
  bigarrow: { piece: 'spear', size: 5, byR: true, min: 150, max: 300, ax: 0.85 },
  wave: { piece: 'wave', size: 3.4, byR: true, ax: 0.7 },
  pellet: { piece: 'bullet', size: 28, ax: 0.8 },
  bullet: { piece: 'bullet', size: 44, ax: 0.8 },
  talisman: { piece: 'talisman', size: 28, ax: 0.5 },
  feather: { piece: 'arrow', size: 46, ax: 0.85 },
  fire: { piece: 'orb', size: 46, ax: 0.5, spin: 9 },
};

/** 조각 그림으로 스프라이트를 만든다. 빛 조각은 색을 입혀 더하기로 그리고, 흰 심지를 겹친다 */
function pieceSprites(p: FxPiece, size: number, color: number, ax = 0.5, ay = 0.5, core = 0.75): Container {
  const c = new Container();
  const main = new Sprite(p.tex);
  main.anchor.set(ax, ay);
  if (!p.colored) main.tint = vivid(color);
  if (!p.colored || p.glow) main.blendMode = 'add';
  c.addChild(main);
  if (p.core && core > 0) {
    const s = new Sprite(p.core);
    s.anchor.set(ax, ay);
    s.blendMode = 'add';
    s.alpha = core;
    c.addChild(s);
  }
  c.scale.set(size / p.long);
  return c;
}

/** 투사체의 높이 (발밑에서 위로, px). 몬스터의 몸통 높이에 맞춘 값 */
const SHOT_HEIGHT = 22;
/** 무기 끝에서 출발한 투사체가 제 길(판정 위치)로 합류하는 데 걸리는 시간 (초) */
const LAUNCH_TIME = 0.16;

class ProjectileView implements Disposable {
  readonly root = new Container();
  private spinner: Container | null = null;
  private spin = 0;
  /** 무기 끝과 판정 위치의 차이. 쏜 직후에만 더해 주고 곧 0이 된다 */
  private ox = 0;
  private oy = 0;
  private age = 0;

  /** @param launch 무기 끝의 위치(바닥의 점과 높이). 주면 투사체가 거기서 출발하는 것처럼 그린다 (판정은 그대로) */
  constructor(p: Projectile, stage: Stage, launch: { x: number; y: number; h: number } | null = null) {
    if (launch) {
      this.ox = proj.x(launch.x, launch.y) - proj.x(p.x, p.y);
      this.oy = proj.y(launch.x, launch.y) - launch.h - (proj.y(p.x, p.y) - SHOT_HEIGHT);
    }
    const art = PROJ_ART[p.look];
    const piece = art ? fxArt.piece(art.piece) : null;
    if (art && piece) {
      let size = art.byR ? art.size * p.r : art.size;
      if (art.min) size = Math.max(art.min, size);
      if (art.max) size = Math.min(art.max, size);
      const body = pieceSprites(piece, size, p.color, art.ax);
      this.root.addChild(body);
      if (art.spin) {
        this.spinner = body;
        this.spin = art.spin;
      }
    } else if (p.look === 'enemyOrb') {
      const glow = new Sprite(stage.tex.glow);
      glow.anchor.set(0.5);
      glow.tint = p.color;
      glow.scale.set((p.r * 3.4) / 64);
      glow.blendMode = 'add';
      const core = new Sprite(stage.tex.disc);
      core.anchor.set(0.5);
      core.tint = 0xffe3e8;
      core.scale.set(p.r / 64);
      this.root.addChild(glow, core);
    } else {
      const g = new Graphics(projContext(p.look));
      g.tint = p.color;
      if (p.look === 'wave') g.scale.set(p.r);
      this.root.addChild(g);
    }
    stage.fx.addChild(this.root);
  }

  update(p: Projectile, dt: number): void {
    let k = 0;
    if (this.age < LAUNCH_TIME && (this.ox || this.oy)) {
      k = 1 - this.age / LAUNCH_TIME;
      this.age += dt;
    }
    this.root.position.set(proj.x(p.x, p.y) + this.ox * k, proj.y(p.x, p.y) - SHOT_HEIGHT + this.oy * k);
    // 날아가는 방향을 화면에서의 방향으로
    this.root.rotation = Math.atan2(proj.vy(p.vx, p.vy), proj.vx(p.vx, p.vy));
    if (this.spinner) this.spinner.rotation += this.spin * dt;
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }
}

// ---- 범위 효과 --------------------------------------------------------------

class ZoneView implements Disposable {
  readonly root = new Container();
  private marker: Container | null = null;
  private prog: Container | null = null;
  private progBase = 1;
  private streakT = 0;
  /** 천천히 도는 바닥 문양 (결계, 진군) */
  private turner: Container | null = null;
  private turnSpeed = 0;

  constructor(
    z: Zone,
    private stage: Stage,
    private fx: Fx,
  ) {
    const tex = stage.tex;
    if (z.look === 'teleLine' || z.look === 'fissure') {
      const len = Math.hypot((z.x2 ?? z.x) - z.x, (z.y2 ?? z.y) - z.y);
      const half = z.half ?? 8;
      const base = new Graphics()
        .rect(0, -half, len, half * 2)
        .fill({ color: z.color, alpha: 0.16 })
        .rect(0, -half, len, half * 2)
        .stroke({ color: z.color, width: 2, alpha: 0.7 });
      const prog = new Graphics().rect(0, -half, len, half * 2).fill({ color: z.color, alpha: 0.3 });
      this.prog = prog;
      const angle = Math.atan2((z.y2 ?? z.y) - z.y, (z.x2 ?? z.x) - z.x);
      const crack = z.look === 'fissure' ? fxArt.piece('fissure') : null;
      if (crack) {
        // 남아 있는 균열: 판정 범위는 옅게만 깔고, 그 위에 갈라진 틈 그림을 이어 붙인다
        base.alpha = 0.22;
        this.root.addChild(base);
        const n = Math.max(1, Math.round(len / (half * 5)));
        const seg = len / n;
        // 빛이 솟는 쪽이 화면 위를 향하도록, 왼쪽으로 뻗는 균열은 위아래를 뒤집는다
        const up = Math.cos(proj.angle(angle)) < 0 ? -1 : 1;
        for (let i = 0; i < n; i++) {
          const piece = pieceSprites(crack, 1, z.color, 0, 0.62, 0.45);
          piece.scale.set((seg * 1.12) / crack.tex.width, ((half * 3.2) / crack.tex.height) * up);
          piece.position.set(i * seg - seg * 0.06, 0);
          this.root.addChild(piece);
        }
      } else this.root.addChild(base, prog);
      this.root.rotation = angle;
    } else {
      const disc = new Sprite(tex.disc);
      disc.anchor.set(0.5);
      disc.tint = z.color;
      disc.scale.set(z.r / 63);
      const ring = new Sprite(tex.ring);
      ring.anchor.set(0.5);
      ring.tint = z.color;
      ring.scale.set(z.r / 60);
      if (z.look === 'tele') {
        disc.alpha = 0.16;
        ring.alpha = 0.85;
        const prog = new Sprite(tex.disc);
        prog.anchor.set(0.5);
        prog.tint = z.color;
        prog.alpha = 0.32;
        this.prog = prog;
        this.progBase = z.r / 63;
        this.root.addChild(disc, prog, ring);
      } else {
        // 넓은 범위를 따라다니거나 사거리만 표시하는 것은 옅게. 잔상은 바닥에 발밑 표시만 남긴다
        const faint = z.look === 'storm' || z.look === 'turret' || z.look === 'clone';
        disc.alpha = faint ? 0.04 : 0.17;
        ring.alpha = faint ? 0.22 : 0.6;
        this.root.addChild(disc, ring);
        // 결계는 바닥 문양이, 진군은 기운의 고리가 천천히 돈다
        const mark = z.look === 'ward' ? fxArt.piece('circle') : z.look === 'storm' ? fxArt.piece('ring_energy') : null;
        if (mark) {
          disc.alpha = z.look === 'ward' ? 0.1 : 0.03;
          ring.alpha = z.look === 'ward' ? 0.35 : 0;
          this.turner = pieceSprites(mark, z.r * (z.look === 'ward' ? 1.9 : 2.3), z.color, 0.5, 0.5, 0);
          this.turner.alpha = z.look === 'ward' ? 0.5 : 0.55;
          this.turnSpeed = z.look === 'ward' ? 0.5 : -1.4;
          this.root.addChild(this.turner);
        }
      }
    }
    stage.decals.addChild(this.root);

    if (z.look === 'clone') {
      // 불의 잔상: 불꽃으로 된 형상이 서 있다
      const g = new Container();
      const flame = fxArt.piece('flame');
      const glow = new Sprite(stage.tex.glow);
      glow.anchor.set(0.5);
      glow.tint = z.color;
      glow.blendMode = 'add';
      glow.alpha = 0.55;
      glow.scale.set(2.6, 3.4);
      glow.y = -52;
      g.addChild(glow);
// 본체의 그림이 있으면 그 모습을 불빛으로 물들여 세우고, 없으면 불꽃 조각으로 대신한다
      const set = z.owner ? sprites.get(z.owner.def.id) : null;
      if (set?.clips.Idle) {
        const body = new SpriteBody(set);
        body.show('Idle', Math.PI / 4, 0);
        body.sprite.tint = z.color;
        body.sprite.blendMode = 'add';
        body.sprite.alpha = 0.85;
        g.addChild(body.sprite);
        if (flame) {
          const f = pieceSprites(flame, 70, z.color, 0.5, 0.95, 0.4);
          f.alpha = 0.7;
          g.addChild(f);
        }
      } else if (flame) g.addChild(pieceSprites(flame, 150, z.color, 0.5, 0.95, 0.5));
      else g.addChild(new Graphics().ellipse(0, -50, 24, 52).fill({ color: z.color, alpha: 0.7 }));
      g.position.set(proj.x(z.x, z.y), proj.y(z.x, z.y));
      g.zIndex = proj.depth(z.x, z.y);
      stage.objects.addChild(g);
      this.marker = g;
    }

    // 설치물(포탑, 깃발)은 캐릭터처럼 세워서 그린다
    const markerArt = z.look === 'turret' || z.look === 'flag' ? fxArt.piece(z.look) : null;
    if (markerArt) {
      const g = new Container();
      g.addChild(new Graphics().ellipse(0, 0, z.look === 'turret' ? 15 : 10, z.look === 'turret' ? 6 : 4).fill({ color: 0x000000, alpha: 0.35 }));
      const art = pieceSprites(markerArt, z.look === 'turret' ? 50 : 88, 0xffffff, z.look === 'turret' ? 0.5 : 0.08, 0.97, 0);
      g.addChild(art);
      g.position.set(proj.x(z.x, z.y), proj.y(z.x, z.y));
      g.zIndex = proj.depth(z.x, z.y);
      stage.objects.addChild(g);
      this.marker = g;
    } else if (z.look === 'turret' || z.look === 'flag') {
      const g = new Graphics();
      if (z.look === 'turret') {
        g.ellipse(0, 0, 15, 6).fill({ color: 0x000000, alpha: 0.35 });
        g.roundRect(-12, -22, 24, 20, 5).fill(0x4a4f66);
        g.roundRect(-4, -34, 8, 16, 3).fill(0x2f333b);
        g.circle(0, -12, 5).fill(z.color);
      } else {
        g.ellipse(0, 0, 10, 4).fill({ color: 0x000000, alpha: 0.35 });
        g.rect(-1.5, -74, 3, 74).fill(0x7a6850);
        g.poly([1.5, -74, 38, -63, 1.5, -50]).fill(z.color);
      }
      g.position.set(proj.x(z.x, z.y), proj.y(z.x, z.y));
      g.zIndex = proj.depth(z.x, z.y);
      stage.objects.addChild(g);
      this.marker = g;
    }
  }

  update(z: Zone, dt: number): void {
    this.root.position.set(z.x, z.y);
    const k = Math.min(1, z.t / z.dur);
    if (z.look === 'tele') {
      this.prog!.scale.set(this.progBase * k);
    } else if (z.look === 'teleLine') {
      this.prog!.scale.x = k;
    } else if (z.look === 'fissure') {
      // 남아 있는 균열: 채워진 채로 일렁이다가 끝에 사라진다
      this.root.alpha = Math.max(0, Math.min(1, (z.dur - z.t) * 3)) * (0.75 + 0.25 * Math.sin(z.t * 14));
    } else {
      // 지속 효과: 시작과 끝에 부드럽게 나타났다 사라진다
      const fade = Math.min(1, z.t * 5, (z.dur - z.t) * 3);
      this.root.alpha = Math.max(0, fade) * (0.85 + 0.15 * Math.sin(z.t * 6));
      if (this.turner) this.turner.rotation += this.turnSpeed * dt;
      if (z.look === 'clone' && this.marker) {
        // 잔상은 보스를 따라 움직이고, 불꽃처럼 일렁인다
        this.marker.position.set(proj.x(z.x, z.y), proj.y(z.x, z.y));
        this.marker.zIndex = proj.depth(z.x, z.y);
        this.marker.alpha = Math.max(0, fade) * (0.8 + 0.2 * Math.sin(z.t * 17));
        this.marker.scale.set(1 + 0.05 * Math.sin(z.t * 11), 1 + 0.08 * Math.sin(z.t * 13));
      } else if (z.look === 'spore' || z.look === 'burn') {
        // 구름·불바닥: 범위 안 여기저기에서 연기나 불꽃이 피어오른다
        this.streakT -= dt;
        while (this.streakT <= 0) {
          this.streakT += z.look === 'spore' ? 0.16 : 0.12;
          const a = Math.random() * Math.PI * 2;
          const d = Math.sqrt(Math.random()) * z.r * 0.9;
          const x = z.x + Math.cos(a) * d;
          const y = z.y + Math.sin(a) * d * 0.8;
          if (z.look === 'spore') {
            this.fx.piece('puff', x, y, { h: 10, size: 50 + Math.random() * 40, dur: 0.9, from: 0.5, to: 1.2, color: z.color, blend: 'normal', alpha: 0.4, vy: -22, rot: a, fadeIn: 0.25, hold: 0.5 });
          } else {
            this.fx.piece('flame', x, y, { size: 44 + Math.random() * 34, dur: 0.5, ay: 0.92, from: 0.6, to: 1.1, color: z.color, vy: -26, fadeIn: 0.15, hold: 0.45 });
          }
        }
      }
      if (z.look === 'rain') {
        this.streakT -= dt;
        while (this.streakT <= 0) {
          this.streakT += 0.03;
          const a = Math.random() * Math.PI * 2;
          const d = Math.sqrt(Math.random()) * z.r;
          this.fx.streak(z.x + Math.cos(a) * d, z.y + Math.sin(a) * d, z.color);
        }
      }
    }
  }

  destroy(): void {
    this.root.destroy({ children: true });
    this.marker?.destroy({ children: true });
  }
}

// ---- 상호작용 오브젝트 ------------------------------------------------------

function label(text: string, size: number, color: number): BitmapText {
  const t = new BitmapText({
    text,
    style: { fontFamily: FONT, fontSize: 32, fontWeight: 'bold', fill: 0xffffff, stroke: { color: 0x15131f, width: 5 } },
  });
  t.anchor.set(0.5);
  t.scale.set(size / 32);
  t.tint = color;
  return t;
}

/** 필드 캐릭터 머리 위 체력 막대의 높이 (발밑에서 위로, px) */
export const PARTY_BAR_Y = 111;

/** 펫의 시전 동작을 보여 주는 시간(초) */
const PET_CAST_TIME = 0.7;
/** 교체로 나가는 캐릭터가 하던 동작을 마저 치는 동안 비켜서 있는 거리 (월드 px): 치던 쪽으로, 그리고 새 캐릭터가 들어오는 길의 반대쪽 옆으로 */
const LEAVE_AHEAD = 16;
const LEAVE_ASIDE = 26;
/** 하던 동작을 마저 치는 동안의 불투명도 */
const LEAVE_ALPHA = 0.7;
/** 교체로 나가는 캐릭터가 뒤로 물러날 때 살짝 떠오르는 높이 (px) */
const LEAVE_HOP = 12;

const THING_STYLE: Record<string, { name: string; color: number }> = {
  exit: { name: '출구', color: 0x7fe3ff },
  chest: { name: '보상', color: 0xffd45a },
  crate: { name: '보급 상자', color: 0xc9a06a },
  medkit: { name: '구급 상자', color: 0x7dff9b },
  relic: { name: '괴담의 잔재', color: 0xc79bff },
  sealed: { name: '봉인 상자', color: 0xff7a8a },
  npc: { name: '?', color: 0xfff2a8 },
  stash: { name: '수상한 보따리', color: 0xb9f2c4 },
};

class ThingView implements Disposable {
  readonly root = new Container();
  private glow: Sprite;
  /** 도형과 그림을 담아 함께 까딱이는 묶음 */
  private body = new Container();
  private shape = new Graphics();
  /** 맵 그림이 있으면 도형 대신 쓰는 그림 */
  private art: Sprite | null = null;
  private ringG = new Graphics();
  private name: BitmapText;
  private lastLocked: boolean | null = null;
  /** 출구가 서 있는 문으로 그려지는지 */
  private standing = false;
  private lastProgress = -1;
  private time = Math.random() * 6;

  constructor(
    t: Thing,
    private stage: Stage,
  ) {
    const st = THING_STYLE[t.kind] ?? THING_STYLE.crate;
    this.glow = new Sprite(stage.tex.glow);
    this.glow.anchor.set(0.5);
    this.glow.tint = st.color;
    this.glow.blendMode = 'add';
    this.glow.scale.set(1.3, 0.6);
    this.name = label(st.name, 15, st.color);
    this.name.y = t.kind === 'exit' ? -58 : -52;
    this.body.addChild(this.shape);
    const item = scenery.get()?.things[t.kind];
    if (item) {
      this.art = new Sprite(item.texture);
      this.art.width = item.w;
      this.art.height = item.h;
      // 출구는 세트에 따라 바닥의 문양이거나(가운데 기준) 서 있는 문이다(발밑 기준)
      this.standing = t.kind === 'exit' && item.opt === 'stand';
      if (t.kind === 'exit' && !this.standing) this.art.anchor.set(0.5);
      else {
        this.art.anchor.set(0.5, 1);
        this.art.y = 4;
        this.name.y = -(item.h + 14);
      }
      this.body.addChild(this.art);
    }
    this.root.addChild(this.glow, this.body, this.ringG, this.name);
    this.root.position.set(proj.x(t.x, t.y), proj.y(t.x, t.y));
    // 바닥의 문양은 바닥에, 나머지는 세로 위치로 앞뒤를 정한다
    this.root.zIndex = proj.depth(t.x, t.y) - (t.kind === 'exit' && !this.standing ? 60 : 0);
    stage.objects.addChild(this.root);
    this.draw(t);
  }

  private draw(t: Thing): void {
    const st = THING_STYLE[t.kind] ?? THING_STYLE.crate;
    const g = this.shape.clear();
    const c = st.color;
    if (this.art) {
      // 그림이 있으면 도형은 그리지 않는다. 출구만 잠김 상태에 따라 색과 빛기둥을 바꾼다
      if (t.kind === 'exit') {
        const col = t.locked ? 0x77738f : c;
        if (this.standing) {
          // 서 있는 문: 잠겨 있으면 닫힌 문, 열리면 열린 문 그림으로 바꾼다
          const sc = scenery.get();
          const item = (t.locked ? sc?.things.exit : sc?.things.exit_open) ?? sc?.things.exit;
          if (item) {
            this.art.texture = item.texture;
            this.art.width = item.w;
            this.art.height = item.h;
          }
          this.art.tint = t.locked ? 0xb8b6c8 : 0xffffff;
        } else {
          this.art.tint = t.locked ? 0x8a88a0 : 0xffffff;
          this.art.alpha = t.locked ? 0.55 : 1;
          if (!t.locked) g.rect(-14, -120, 28, 120).fill({ color: col, alpha: 0.13 });
        }
        this.name.text = t.locked ? '출구 (잠김)' : '출구';
        this.name.tint = col;
        this.glow.tint = col;
        this.glow.alpha = t.locked ? 0.15 : 0.6;
      } else if (t.kind === 'npc') {
        this.name.text = t.data === 'shop' ? '상인' : '!';
        if (t.data !== 'shop') this.name.scale.set(0.8);
      }
      return;
    }
    switch (t.kind) {
      case 'exit': {
        const col = t.locked ? 0x77738f : c;
        g.ellipse(0, 0, 40, 17).fill({ color: col, alpha: 0.22 });
        g.ellipse(0, 0, 40, 17).stroke({ color: col, width: 4, alpha: 0.95 });
        g.ellipse(0, 0, 26, 11).stroke({ color: col, width: 2, alpha: 0.7 });
        if (!t.locked) g.rect(-14, -120, 28, 120).fill({ color: col, alpha: 0.13 });
        this.name.text = t.locked ? '출구 (잠김)' : '출구';
        this.name.tint = col;
        this.glow.tint = col;
        this.glow.alpha = t.locked ? 0.15 : 0.6;
        break;
      }
      case 'chest':
        g.roundRect(-17, -24, 34, 24, 4).fill(shade(c, -0.35));
        g.roundRect(-17, -34, 34, 14, 5).fill(c);
        g.rect(-3, -26, 6, 9).fill(0xfff6d0);
        break;
      case 'medkit':
        g.roundRect(-15, -24, 30, 24, 4).fill(0xf2f4f6);
        g.rect(-3, -20, 6, 16).fill(0xe0484f).rect(-8, -15, 16, 6).fill(0xe0484f);
        break;
      case 'relic':
        g.poly([0, -40, 12, -20, 0, -4, -12, -20]).fill(c);
        g.poly([0, -40, 12, -20, 0, -22]).fill(shade(c, 0.35));
        break;
      case 'sealed':
        g.roundRect(-18, -28, 36, 28, 4).fill(0x3a2a3f);
        g.roundRect(-18, -28, 36, 28, 4).stroke({ color: c, width: 2.5 });
        g.rect(-18, -17, 36, 4).fill(c);
        break;
      case 'npc':
        g.ellipse(0, 0, 14, 6).fill({ color: 0x000000, alpha: 0.3 });
        g.roundRect(-11, -40, 22, 40, 9).fill(0x6d7890);
        g.circle(0, -50, 12).fill(0xfde4d8);
        g.roundRect(-13, -64, 26, 14, 8).fill(0x4a5266);
        this.name.text = t.data === 'shop' ? '상인' : '!';
        if (t.data !== 'shop') this.name.scale.set(0.8);
        this.name.y = -84;
        break;
      default:
        g.roundRect(-16, -22, 32, 22, 3).fill(shade(c, -0.3));
        g.roundRect(-16, -30, 32, 12, 3).fill(c);
    }
  }

  update(t: Thing, dt: number): void {
    this.time += dt;
    if (t.done && t.kind !== 'exit') {
      this.root.visible = false;
      return;
    }
    if (t.locked !== this.lastLocked) {
      this.lastLocked = t.locked;
      if (t.kind === 'exit') this.draw(t);
    }
    if (t.kind === 'exit') {
      this.glow.scale.set(1.5 + 0.2 * Math.sin(this.time * 3), 0.7);
      if (this.standing) this.glow.y = -8;
    } else {
      this.body.y = Math.sin(this.time * 3) * 2;
      this.glow.alpha = 0.45 + 0.2 * Math.sin(this.time * 4);
      this.glow.y = -12;
    }
    // 수색 진행 고리
    if (t.progress !== this.lastProgress) {
      this.lastProgress = t.progress;
      this.ringG.clear();
      if (t.progress > 0 && t.progress < 1) {
        this.ringG
          .arc(0, -14, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t.progress)
          .stroke({ color: 0xffffff, width: 5, alpha: 0.95 });
      }
    }
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }
}

/** 포자 버섯: 가만히 있다가, 건드리면 부풀고, 뿜은 뒤에는 쪼그라들어 쉰다 */
class MushroomView implements Disposable {
  readonly root = new Container();
  private body = new Container();
  private glow: Sprite;
  private art: Sprite | null = null;
  private time = Math.random() * 6;

  constructor(s: Mushroom, stage: Stage) {
    this.glow = new Sprite(stage.tex.glow);
    this.glow.anchor.set(0.5);
    this.glow.tint = 0x9be36a;
    this.glow.blendMode = 'add';
    this.glow.scale.set(1.1, 0.5);
    this.glow.y = -6;
    const item = scenery.get()?.things.mushroom;
    if (item) {
      this.art = new Sprite(item.texture);
      this.art.anchor.set(0.5, 1);
      this.art.width = item.w;
      this.art.height = item.h;
      this.art.y = 4;
      this.body.addChild(this.art);
    } else {
      this.body.addChild(
        new Graphics()
          .ellipse(0, 0, 14, 5)
          .fill({ color: 0x000000, alpha: 0.3 })
          .roundRect(-5, -16, 10, 16, 4)
          .fill(0xe9e2d0)
          .ellipse(0, -18, 18, 11)
          .fill(0x8a5ad0)
          .circle(-7, -20, 3)
          .fill(0xe8f7c8)
          .circle(5, -22, 2.5)
          .fill(0xe8f7c8),
      );
    }
    this.root.addChild(this.glow, this.body);
    this.root.position.set(proj.x(s.x, s.y), proj.y(s.x, s.y));
    this.root.zIndex = proj.depth(s.x, s.y);
    stage.objects.addChild(this.root);
  }

  update(s: Mushroom, dt: number): void {
    this.time += dt;
    const body = this.body;
    if (s.state === 'swell') {
      // 부풀어 오르며 떤다: 곧 뿜는다는 신호
      const k = Math.min(1, s.t / 0.6);
      body.scale.set(1 + 0.45 * k + 0.05 * Math.sin(this.time * 40), 1 + 0.3 * k);
      body.x = Math.sin(this.time * 55) * 1.5 * k;
      body.alpha = 1;
      if (this.art) this.art.tint = 0xe9ffb0;
      this.glow.alpha = 0.5 + 0.5 * k;
    } else if (s.state === 'rest') {
      // 뿜고 나면 쪼그라들었다가 천천히 돌아온다
      const k = Math.min(1, s.t / 1.2);
      body.scale.set(1, 0.6 + 0.25 * k);
      body.x = 0;
      body.alpha = 0.6;
      if (this.art) this.art.tint = 0x9a9aa8;
      this.glow.alpha = 0;
    } else {
      body.scale.set(1 + 0.03 * Math.sin(this.time * 2.2), 1 + 0.04 * Math.sin(this.time * 2.2 + 1));
      body.x = 0;
      body.alpha = 1;
      if (this.art) this.art.tint = 0xffffff;
      this.glow.alpha = 0.3 + 0.12 * Math.sin(this.time * 2.6);
    }
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }
}

/** 안개가 한 번에 떠 있는 덩어리 수와, 덩어리가 놓이는 상자의 크기 (화면보다 넉넉히 크다) */
const FOG_BLOBS = 16;
const FOG_W = 2000;
const FOG_H = 1300;

/** 안개: 옅은 덩어리 여러 개가 맵 위를 천천히 흘러간다. 화면 밖으로 나간 덩어리는 반대쪽에서 다시 들어온다 */
class FogView {
  readonly root = new Container();
  private blobs: { s: Sprite; ox: number; oy: number; vx: number; vy: number; a: number; ph: number }[] = [];
  private t = 0;

  constructor(stage: Stage, amount: number, color: number) {
    for (let i = 0; i < FOG_BLOBS; i++) {
      const s = new Sprite(stage.tex.glow);
      s.anchor.set(0.5);
      s.tint = color;
      const size = 520 + Math.random() * 420;
      s.width = size;
      s.height = size * (0.55 + Math.random() * 0.25);
      this.root.addChild(s);
      this.blobs.push({ s, ox: Math.random() * FOG_W, oy: Math.random() * FOG_H, vx: 8 + Math.random() * 14, vy: -3 + Math.random() * 6, a: (0.2 + Math.random() * 0.16) * amount, ph: Math.random() * 6 });
    }
    // 맵과 함께 물들도록 맵 묶음의 맨 위에 올린다 (이펙트 층에 두면 어두운 맵 위에 안개만 환하게 뜬다)
    stage.scene.addChild(this.root);
  }

  /** (cx, cy) = 화면 가운데의 월드 좌표 */
  update(cx: number, cy: number, dt: number): void {
    this.t += dt;
    const wrap = (v: number, n: number): number => ((v % n) + n) % n;
    for (const b of this.blobs) {
      b.s.position.set(cx + wrap(b.ox + b.vx * this.t - cx, FOG_W) - FOG_W / 2, cy + wrap(b.oy + b.vy * this.t - cy, FOG_H) - FOG_H / 2);
      b.s.alpha = b.a * (0.8 + 0.2 * Math.sin(this.t * 0.5 + b.ph));
    }
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }
}

class BarrierView implements Disposable {
  readonly root = new Graphics();

  constructor(b: Barrier, stage: Stage) {
    const H = 38;
    const x1 = proj.x(b.x1, b.y1);
    const y1 = proj.y(b.x1, b.y1);
    const x2 = proj.x(b.x2, b.y2);
    const y2 = proj.y(b.x2, b.y2);
    this.root
      .poly([x1, y1, x2, y2, x2, y2 - H, x1, y1 - H])
      .fill({ color: 0xffb066, alpha: 0.4 })
      .poly([x1, y1, x2, y2, x2, y2 - H, x1, y1 - H])
      .stroke({ color: 0xffd9a8, width: 3, alpha: 0.9 });
    this.root.zIndex = Math.max(proj.depth(b.x1, b.y1), proj.depth(b.x2, b.y2));
    stage.objects.addChild(this.root);
  }

  update(b: Barrier): void {
    const left = b.dur - b.t;
    this.root.alpha = left < 1 ? 0.4 + 0.6 * Math.abs(Math.sin(b.t * 14)) : 1;
  }

  destroy(): void {
    this.root.destroy();
  }
}

// ---- 월드 전체 ---------------------------------------------------------------

export class WorldView {
  readonly fx: Fx;
  private chars: CharView[] = [];
  private partyBar = new Graphics();
  private petView = new Container();
  /** 펫의 스프라이트 애니메이션 (시트가 있을 때만) */
  private petBody: SpriteBody | null = null;
  private petFacing = Math.PI / 4;
  private reticle = new Graphics();
  private aimMark = new Graphics();
  private lastHpRatio = -1;
  private lookX = 0;
  private lookY = 0;
  private time = 0;
  private fog: FogView | null = null;
  /** 마름모 맵의 벽 (필드 캐릭터를 가리는 벽을 비쳐 보이게 한다) */
  private isoMap: IsoMapView | null = null;
  /**
   * 교체 연출 (기획서 3.7절). 규칙에서는 누르는 즉시 바뀌지만, 화면에서는
   *  - 나가는 캐릭터가 하던 공격 동작을 제자리에서 마저 보여 준 뒤, 뒤로 짧게 물러나 잠깐 머물다 사라지고
   *  - 새 캐릭터가 등장 기술을 쓰며 들어온다. 들어오는 길은 캐릭터마다 다르다 (enterStyle):
   *    뒤에서 달려든다 / 위에서 떨어진다 / 구르듯 미끄러져 들어온다 / 그 자리에 나타난다.
   * swapSeen = 마지막으로 본 교체 번호, enterT = 새 캐릭터가 들어오기 시작한 뒤 지난 시간, enterTime = 들어오는 데 걸리는 시간
   */
  private swapSeen = 0;
  private enterT = 99;
  private enterDir = 0;
  private enterStyle: EntryStyle = 'rush';
  private enterTime = 0;
  private enterPose: CharPose = { anim: 'Escape', t: 0, dur: 0, hitAt: 0, facing: 0, combo: 0, hitFlash: 0, invuln: false };
  /** 나가는 캐릭터: 서 있던 자리, 물러나는 방향, 하던 동작이 끝날 때까지 남은 시간, 지난 시간, 보여 줄 자세, 물러나기 시작했는지 */
  private leaving: { index: number; x: number; y: number; dir: number; face: number; hold: number; t: number; pose: CharPose; out: boolean } | null = null;
  private pose: CharPose = {
    anim: 'Idle',
    t: 0,
    dur: 0,
    hitAt: 0,
    facing: Math.PI / 2,
    combo: 0,
    hitFlash: 0,
    invuln: false,
  };

  constructor(private stage: Stage) {
    this.fx = new Fx(stage);
  }

  /** 새 섹터를 화면에 올린다 */
  load(w: World): void {
    this.unload();
    const stage = this.stage;
    w.fx = this.fx;
    // 이 섹터의 맵 그림 세트 (시즌·맵 종류마다 다르다)와 화면 방식 (기존 / 마름모)
    scenery.use(w.setup.def.scene);
    stage.setView(w.setup.def.view);
    stage.setMood(w.setup.def.scene);
    if (proj.iso) this.isoMap = buildIsoMapView(w.plan, stage.ground, stage.objects, stage.tex.glow, w.setup.def.scene);
    else buildMapView(w.plan, stage.ground, stage.objects, stage.tex.glow);
    const fogAmount = w.setup.def.fog;
    if (fogAmount > 0) this.fog = new FogView(stage, fogAmount, mix(scenery.get()?.edge ?? 0x9fb0a8, 0xffffff, 0.72));

    for (const m of w.party.members) {
      const v = createCharView(m.def);
      v.root.visible = false;
      stage.objects.addChild(v.root);
      this.chars.push(v);
    }

    // 펫
    const pc = w.pet.def.color;
    const pet = new Graphics();
    pet.ellipse(0, 0, 10, 4).fill({ color: 0x000000, alpha: 0.3 });
    pet.poly([-9, -22, -12, -32, -3, -25]).fill(shade(pc, -0.3));
    pet.poly([9, -22, 12, -32, 3, -25]).fill(shade(pc, -0.3));
    pet.roundRect(-11, -26, 22, 24, 10).fill(pc);
    pet.roundRect(-11, -14, 22, 12, 6).fill(shade(pc, 0.3));
    pet.circle(-4, -17, 1.6).fill(0x15131f).circle(4, -17, 1.6).fill(0x15131f);
    const petView = new Container();
    this.petView = petView;
    petView.addChild(pet);
    stage.objects.addChild(petView);
    // 펫: 스프라이트 시트(public/sprites/pet_<id>/)가 있으면 애니메이션으로 그린다
    const petSet = sprites.get(`pet_${w.pet.def.id.toLowerCase()}`);
    this.petBody = null;
    const petArt = asset(`ui/pet_${w.pet.def.id}`);
    if (petSet?.clips.Idle) {
      this.petBody = new SpriteBody(petSet);
      pet.clear().ellipse(0, 0, 12, 5).fill({ color: 0x000000, alpha: 0.3 });
      petView.addChild(this.petBody.sprite);
    } else if (petArt) {
      // 시트가 없으면 정지 그림을 받아서 도형과 바꾼다
      void Assets.load<Texture>(petArt).then((tex) => {
        if (this.petView !== petView || petView.destroyed) return;
        const s = new Sprite(tex);
        s.anchor.set(0.5, 1);
        s.width = 36;
        s.height = 36;
        s.y = 3;
        pet.clear().ellipse(0, 0, 11, 4.5).fill({ color: 0x000000, alpha: 0.3 });
        petView.addChild(s);
      });
    }

    // 필드 캐릭터 머리 위 상태 (HUD ⑬)
    this.partyBar = new Graphics();
    this.lastHpRatio = -1;
    stage.fx.addChild(this.partyBar);

    // 추천 타겟 조준 표시
    this.reticle = new Graphics();
    this.reticle.circle(0, 0, 24).stroke({ color: 0xffd84a, width: 3, alpha: 0.95 });
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      this.reticle
        .moveTo(Math.cos(a) * 17, Math.sin(a) * 17)
        .lineTo(Math.cos(a) * 31, Math.sin(a) * 31)
        .stroke({ color: 0xffd84a, width: 3 });
    }
    this.reticle.visible = false;
    stage.fx.addChild(this.reticle);

    // 바라보는 방향 표시
    this.aimMark = new Graphics().poly([0, -9, 16, 0, 0, 9, 4, 0]).fill({ color: 0xffffff, alpha: 0.8 });
    stage.decals.addChild(this.aimMark);

    this.lookX = this.lookY = 0;
    // 섹터에 들어올 때는 교체 연출 없이 서 있는다
    this.swapSeen = w.party.swapSeq;
    this.enterT = 99;
    this.leaving = null;
    this.follow(w, 0, true);
  }

  /** 카메라가 필드 캐릭터를 따라간다. 마름모 화면에서는 맵 가장자리에 가두지 않는다 (맵이 화면에 비스듬히 놓인다) */
  private follow(w: World, dt: number, snap = false): void {
    const p = w.party;
    const cx = proj.x(p.x, p.y) + this.lookX;
    const cy = proj.y(p.x, p.y) + this.lookY - 20;
    this.stage.updateCamera(cx, cy, proj.iso ? 0 : w.plan.w * TILE, proj.iso ? 0 : w.plan.h * TILE, dt, snap);
    // 화면 분위기의 빛은 필드 캐릭터의 몸 가운데를 따라간다
    const layer = this.stage.world;
    this.stage.lightAt(layer.x + proj.x(p.x, p.y) * layer.scale.x, layer.y + (proj.y(p.x, p.y) - 26) * layer.scale.y);
    this.fog?.update(cx, cy, dt);
  }

  /**
   * 필드에 없는 캐릭터의 표시부. 방금 교체로 나간 캐릭터만 잠깐 더 보인다:
   * 하던 공격 동작을 제자리에서 마저 보여 주고(hold), 그 뒤 뒤로 짧게 물러나 잠깐 머물다 사라진다
   */
  private syncLeaving(w: World, v: CharView, index: number, dt: number): void {
    const L = this.leaving;
    if (!L || L.index !== index) {
      v.root.visible = false;
      v.root.alpha = 1;
      return;
    }
    const exitTime = db.P('swap.exitTime');
    const linger = db.P('swap.exitLinger');
    L.t += dt;
    // 물러나기 시작한 뒤 지난 시간
    const since = L.t - L.hold;
    if (since >= exitTime + linger) {
      this.leaving = null;
      v.root.visible = false;
      v.root.alpha = 1;
      v.setLift(0);
      return;
    }
    // 하던 동작을 마저 치는 동안에는 반걸음 비켜서 있는다 (같은 자리에 선 새 캐릭터와 겹치지 않게). 물러나는 쪽 옆이 새 캐릭터가 들어오는 길의 반대쪽이다
    const aside = L.hold > 0 ? Math.min(1, L.t / 0.08) : 0;
    const sideA = L.face + Math.PI / 2;
    let x = L.x + (Math.cos(L.face) * LEAVE_AHEAD + Math.cos(sideA) * LEAVE_ASIDE) * aside;
    let y = L.y + (Math.sin(L.face) * LEAVE_AHEAD + Math.sin(sideA) * LEAVE_ASIDE) * aside;
    let lift = 0;
    // 하던 동작을 마저 치는 캐릭터는 조금 비쳐 보이게 한다: 새 캐릭터가 주인공이고, 이쪽은 마무리하고 떠나는 중이다
    const solid = L.hold > 0 ? LEAVE_ALPHA : 1;
    if (since <= 0) {
      // 하던 동작을 마저 보여 준다
      v.root.alpha = solid;
    } else {
      const dist = db.P('swap.exitDist');
      if (!L.out) {
        // 물러나기 시작: 싸우던 쪽을 본 채로 뒤로 짧게 뛴다
        L.out = true;
        L.pose.anim = 'Idle';
        L.pose.t = 0;
        L.pose.dur = 0;
        L.pose.hitAt = 0;
        L.pose.facing = proj.angle(L.face);
        const m = w.party.members[index];
        this.fx.play('swap.out', x, y, { angle: L.dir, size: dist, color: m.kit.color ?? m.def.colors.hair });
      }
      // 빠르게 물러난 뒤(살짝 떠올랐다 내려앉는다), 그 자리에 잠깐 머물며 흐려진다
      const u = Math.min(1, since / exitTime);
      const d = (1 - (1 - u) ** 2) * dist;
      x += Math.cos(L.dir) * d;
      y += Math.sin(L.dir) * d;
      lift = Math.sin(u * Math.PI) * LEAVE_HOP;
      v.root.alpha = solid * (since <= exitTime ? 1 : 1 - (since - exitTime) / linger);
    }
    v.setLift(lift);
    L.pose.t += dt;
    v.root.visible = true;
    v.root.position.set(proj.x(x, y), proj.y(x, y));
    // 겹칠 때는 언제나 새 캐릭터가 앞에 온다 (비켜선 쪽이 화면 앞쪽이어도 새 캐릭터를 가리지 않는다)
    v.root.zIndex = Math.min(proj.depth(x, y), proj.depth(w.party.x, w.party.y)) - 0.5;
    v.update(L.pose, dt);
  }

  unload(): void {
    this.leaving = null;
    this.fog?.destroy();
    this.fog = null;
    this.isoMap = null;
    this.fx.clear();
    this.stage.clear();
    // 맵이 없는 동안(로비)에는 물들이지 않는다
    this.stage.setMood('');
    this.chars = [];
  }

  /**
   * 캐릭터·몬스터 표시부를 새로 만든다.
   * 스프라이트 시트가 섹터 시작보다 늦게 도착했을 때, 도형으로 그리던 것을 스프라이트로 바꾸는 데 쓴다.
   */
  refreshViews(w: World): void {
    const stage = this.stage;
    this.chars.forEach((old, i) => {
      const v = createCharView(w.party.members[i].def);
      v.root.visible = false;
      stage.objects.addChild(v.root);
      this.chars[i] = v;
      old.destroy();
    });
    for (const e of w.enemies) {
      (e.view as EnemyView | undefined)?.destroy();
      e.view = undefined;
    }
  }

  sync(w: World, dt: number): void {
    this.time += dt;
    const stage = this.stage;

    for (const g of w.gone) {
      (g.view as Disposable | undefined)?.destroy();
      g.view = undefined;
    }
    w.gone.length = 0;

    this.syncParty(w, dt);

    for (const e of w.enemies) {
      let v = e.view as EnemyView | undefined;
      if (!v) {
        v = createEnemyView(e);
        e.view = v;
        stage.objects.addChild(v.root);
      }
      v.root.position.set(proj.x(e.x, e.y), proj.y(e.x, e.y));
      v.root.zIndex = proj.depth(e.x, e.y);
      v.update(e, dt);
    }

    for (const p of w.projectiles) {
      let v = p.view as ProjectileView | undefined;
      if (!v) {
        v = new ProjectileView(p, stage, p.weapon ? this.fx.weapon : null);
        p.view = v;
      }
      v.update(p, dt);
    }

    for (const z of w.zones) {
      let v = z.view as ZoneView | undefined;
      if (!v) {
        v = new ZoneView(z, stage, this.fx);
        z.view = v;
      }
      v.update(z, dt);
    }

    for (const b of w.barriers) {
      let v = b.view as BarrierView | undefined;
      if (!v) {
        v = new BarrierView(b, stage);
        b.view = v;
      }
      v.update(b);
    }

    for (const s of w.mushrooms) {
      let v = s.view as MushroomView | undefined;
      if (!v) {
        v = new MushroomView(s, stage);
        s.view = v;
      }
      v.update(s, dt);
    }

    for (const t of w.things) {
      let v = t.view as ThingView | undefined;
      if (!v) {
        v = new ThingView(t, stage);
        t.view = v;
      }
      v.update(t, dt);
    }

    this.fx.update(dt);

    // 카메라: 바라보는 쪽(화면에서의 방향)을 조금 더 보여 준다
    const p = w.party;
    const k = Math.min(1, dt * 3);
    const look = proj.angle(p.facing);
    this.lookX += (Math.cos(look) * 46 - this.lookX) * k;
    this.lookY += (Math.sin(look) * 30 - this.lookY) * k;
    this.follow(w, dt);
    this.isoMap?.update(p.x, p.y, dt);
  }

  private syncParty(w: World, dt: number): void {
    const p = w.party;
    const m = p.active;
    const pose = this.pose;
    // 교체가 일어났다: 지난 프레임까지의 자세(pose)는 나간 캐릭터의 것이다. 그 자세에서 이어서 마무리 동작을 보여 준다
    if (p.swapSeq !== this.swapSeen) {
      this.swapSeen = p.swapSeq;
      this.leaving = p.leave ? { index: p.leave.index, x: p.x, y: p.y, dir: p.leave.dir, face: p.leave.face, hold: p.leave.hold, t: 0, pose: { ...pose, hitFlash: 0, invuln: false }, out: false } : null;
      this.enterT = 0;
      this.enterDir = p.enterDir;
      this.enterStyle = p.enterStyle;
      this.enterTime = p.enterTime;
    }
    pose.anim = p.anim;
    pose.t = p.animT;
    pose.dur = p.animDur;
    pose.hitAt = p.animHit;
    // 표시부는 화면에서의 방향을 쓴다 (마름모 화면에서는 바닥 위의 방향과 다르다)
    pose.facing = proj.angle(p.facing);
    // 스킬이 타격을 시작하면서 combo를 먼저 올리므로, 지금 치고 있는 타격은 하나 앞 번호다
    pose.combo = Math.max(0, m.combo - 1);
    pose.hitFlash = p.hitFlash;
    pose.invuln = p.invulnT > 0;

    const P = db.P;
    this.chars.forEach((v, i) => {
      if (i !== p.cur) {
        this.syncLeaving(w, v, i, dt);
        return;
      }
      v.root.visible = true;
      // 들어오는 중: 규칙의 위치(p)에 화면에서만 어긋난 거리를 더해 그린다. 등장 기술의 첫 타격이 나가는 때(enterTime)에 제자리에 닿는다
      let x = p.x;
      let y = p.y;
      let lift = 0;
      let shown = pose;
      const enterTime = this.enterTime;
      if (this.enterT < enterTime) {
        const k = this.enterT / enterTime;
        const style = this.enterStyle;
        // 등장 기술의 동작(또는 서 있기·걷기) 대신 달리는 자세를 보여 줄지. 회피나 스킬로 끊었으면 그 동작이 먼저다
        let run = pose.anim === 'Idle' || pose.anim === 'Move';
        if (style === 'drop') {
          // 위에서 떨어진다: 조금 뒤의 높은 곳에서 점점 빠르게 내려온다
          lift = (1 - k * k) * P('swap.enterHeight');
          const left = (1 - k) * P('swap.enterDist') * 0.3;
          x -= Math.cos(this.enterDir) * left;
          y -= Math.sin(this.enterDir) * left;
          v.root.alpha = Math.min(1, 0.25 + k * 3);
        } else if (style === 'blink') {
          // 그 자리에 나타난다: 부적이 꽂힌 뒤에 드러난다
          v.root.alpha = Math.max(0, (k - 0.4) / 0.6);
        } else {
          // 뒤쪽에서 시작해 빠르게 다가와 멈춘다
          const left = (1 - k) ** 3 * P('swap.enterDist');
          x -= Math.cos(this.enterDir) * left;
          y -= Math.sin(this.enterDir) * left;
          v.root.alpha = Math.min(1, 0.2 + k * 2.4);
          // 구르듯 미끄러져 들어오는 캐릭터는 들어오는 동안 회피 자세를 보여 주다가, 멈추는 순간 쏘는 자세로 바뀐다
          if (style === 'roll' && pose.anim === 'BasicAttack') run = true;
        }
        if (run) {
          shown = this.enterPose;
          shown.t = this.enterT;
          shown.dur = enterTime;
          shown.facing = style === 'roll' ? pose.facing : proj.angle(this.enterDir);
          shown.hitFlash = pose.hitFlash;
          shown.invuln = pose.invuln;
        }
      } else v.root.alpha = 1;
      v.setLift(lift);
      this.enterT += dt;
      v.root.position.set(proj.x(x, y), proj.y(x, y));
      v.root.zIndex = proj.depth(x, y);
      v.update(shown, dt);
      // 무기 끝: 공격 자세의 그림에서 잰 위치를 지금 보는 쪽에 맞춰 놓는다 (화면에서 옆으로 mz.x, 위로 mz.y)
      const mz = m.def.muzzle;
      this.fx.weapon = { x: p.x + proj.sideX(v.side * mz.x), y: p.y + proj.sideY(v.side * mz.x), h: mz.y };
    });

    // 머리 위 체력. 그 아래의 상태 아이콘은 HUD가 그린다 (ui/hud.ts 의 FIELD_STATUS_Y 와 맞춘다)
    const ratio = Math.max(0, m.hp / m.stats.maxHp);
    this.partyBar.position.set(proj.x(p.x, p.y), proj.y(p.x, p.y) - PARTY_BAR_Y);
    if (Math.abs(ratio - this.lastHpRatio) > 0.003) {
      this.lastHpRatio = ratio;
      const bw = 46;
      this.partyBar
        .clear()
        .roundRect(-bw / 2 - 1, -1, bw + 2, 7, 2.5)
        .fill({ color: 0x15131f, alpha: 0.85 })
        .roundRect(-bw / 2, 0, bw * ratio, 5, 2)
        .fill(ratio > 0.3 ? 0xc9f24b : 0xff5a5a);
    }

    // 펫
    const pet = w.pet;
    this.petView.position.set(proj.x(pet.x, pet.y), proj.y(pet.x, pet.y) + (this.petBody ? 0 : Math.sin(this.time * 4) * 2));
    this.petView.zIndex = proj.depth(pet.x, pet.y);
    if (this.petBody) {
      // 파티를 바라보는 쪽(화면에서의 좌우)으로 좌우를 정하고, 스킬을 쓴 직후에는 시전 동작을 보여 준다
      const dx = proj.x(p.x, p.y) - proj.x(pet.x, pet.y);
      if (Math.abs(dx) > 6) this.petFacing = dx > 0 ? Math.PI / 4 : (Math.PI * 3) / 4;
      const casting = pet.castT < PET_CAST_TIME && !!this.petBody.set.clips.Cast;
      if (casting) this.petBody.show('Cast', this.petFacing, pet.castT, PET_CAST_TIME);
      else this.petBody.show('Idle', this.petFacing, this.time);
      // 떠 있는 펫이라 그림자 위로 조금 띄운다
      this.petBody.sprite.y = -6 + Math.sin(this.time * 2.4) * 1.5;
    }

    // 추천 타겟
    const t: Enemy | null = p.autoTarget && !p.autoTarget.dead ? p.autoTarget : null;
    this.reticle.visible = !!t;
    if (t) {
      this.reticle.position.set(proj.x(t.x, t.y), proj.y(t.x, t.y) - t.r);
      this.reticle.rotation = this.time * 1.5;
      this.reticle.scale.set(Math.max(0.8, Math.min(1.5, t.r / 20)) * (1 + 0.06 * Math.sin(this.time * 8)));
    }

    this.aimMark.visible = !p.wiped;
    this.aimMark.position.set(p.x + Math.cos(p.facing) * 40, p.y + Math.sin(p.facing) * 40);
    this.aimMark.rotation = p.facing;
    this.aimMark.alpha = p.action === 'attack' ? 1 : 0.55;
  }
}
