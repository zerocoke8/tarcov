// 전투 월드의 상태를 읽어 화면에 반영한다. 규칙은 다루지 않는다.
import { BitmapText, Container, Graphics, GraphicsContext, Sprite, Assets, type Texture } from 'pixi.js';
import { shade } from '../core/math';
import type { Enemy } from '../game/enemy/Enemy';
import type { Barrier, Projectile, Thing, Zone } from '../game/entities';
import { TILE } from '../game/world/layout';
import type { World } from '../game/world/World';
import { Fx } from './fx';
import { buildMapView } from './mapView';
import type { Stage } from './Stage';
import { asset } from '../ui/assets';
import { scenery } from './scenery';
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

class ProjectileView implements Disposable {
  readonly root = new Container();

  constructor(p: Projectile, stage: Stage) {
    if (p.look === 'enemyOrb') {
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

  update(p: Projectile): void {
    this.root.position.set(p.x, p.y - 22);
    this.root.rotation = Math.atan2(p.vy, p.vx);
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }
}

// ---- 범위 효과 --------------------------------------------------------------

class ZoneView implements Disposable {
  readonly root = new Container();
  private marker: Graphics | null = null;
  private prog: Container | null = null;
  private progBase = 1;
  private streakT = 0;

  constructor(
    z: Zone,
    private stage: Stage,
    private fx: Fx,
  ) {
    const tex = stage.tex;
    if (z.look === 'teleLine') {
      const len = Math.hypot((z.x2 ?? z.x) - z.x, (z.y2 ?? z.y) - z.y);
      const half = z.half ?? 8;
      const base = new Graphics()
        .rect(0, -half, len, half * 2)
        .fill({ color: z.color, alpha: 0.16 })
        .rect(0, -half, len, half * 2)
        .stroke({ color: z.color, width: 2, alpha: 0.7 });
      const prog = new Graphics().rect(0, -half, len, half * 2).fill({ color: z.color, alpha: 0.3 });
      this.prog = prog;
      this.root.addChild(base, prog);
      this.root.rotation = Math.atan2((z.y2 ?? z.y) - z.y, (z.x2 ?? z.x) - z.x);
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
        // 넓은 범위를 따라다니거나 사거리만 표시하는 것은 옅게
        const faint = z.look === 'storm' || z.look === 'turret';
        disc.alpha = faint ? 0.04 : 0.17;
        ring.alpha = faint ? 0.22 : 0.6;
        this.root.addChild(disc, ring);
      }
    }
    stage.decals.addChild(this.root);

    // 설치물(포탑, 깃발)은 캐릭터처럼 세워서 그린다
    if (z.look === 'turret' || z.look === 'flag') {
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
      g.position.set(z.x, z.y);
      g.zIndex = z.y;
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
    } else {
      // 지속 효과: 시작과 끝에 부드럽게 나타났다 사라진다
      const fade = Math.min(1, z.t * 5, (z.dur - z.t) * 3);
      this.root.alpha = Math.max(0, fade) * (0.85 + 0.15 * Math.sin(z.t * 6));
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
    this.marker?.destroy();
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

const THING_STYLE: Record<string, { name: string; color: number }> = {
  exit: { name: '출구', color: 0x7fe3ff },
  chest: { name: '보상', color: 0xffd45a },
  crate: { name: '보급 상자', color: 0xc9a06a },
  medkit: { name: '구급 상자', color: 0x7dff9b },
  relic: { name: '괴담의 잔재', color: 0xc79bff },
  sealed: { name: '봉인 상자', color: 0xff7a8a },
  npc: { name: '?', color: 0xfff2a8 },
};

class ThingView implements Disposable {
  readonly root = new Container();
  private glow: Sprite;
  private body = new Graphics();
  /** 맵 그림이 있으면 도형 대신 쓰는 그림 */
  private art: Sprite | null = null;
  private ringG = new Graphics();
  private name: BitmapText;
  private lastLocked: boolean | null = null;
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
    const item = scenery.get()?.things[t.kind];
    if (item) {
      this.art = new Sprite(item.texture);
      this.art.width = item.w;
      this.art.height = item.h;
      // 출구(바닥의 봉인 문양)는 가운데, 나머지는 발밑을 기준으로 놓는다
      if (t.kind === 'exit') this.art.anchor.set(0.5);
      else {
        this.art.anchor.set(0.5, 1);
        this.art.y = 4;
        this.name.y = -(item.h + 14);
      }
      this.body.addChild(this.art);
    }
    this.root.addChild(this.glow, this.body, this.ringG, this.name);
    this.root.position.set(t.x, t.y);
    // 출구는 바닥에, 나머지는 세로 위치로 앞뒤를 정한다
    this.root.zIndex = t.kind === 'exit' ? t.y - 60 : t.y;
    stage.objects.addChild(this.root);
    this.draw(t);
  }

  private draw(t: Thing): void {
    const st = THING_STYLE[t.kind] ?? THING_STYLE.crate;
    const g = this.body.clear();
    const c = st.color;
    if (this.art) {
      // 그림이 있으면 도형은 그리지 않는다. 출구만 잠김 상태에 따라 색과 빛기둥을 바꾼다
      if (t.kind === 'exit') {
        const col = t.locked ? 0x77738f : c;
        this.art.tint = t.locked ? 0x8a88a0 : 0xffffff;
        this.art.alpha = t.locked ? 0.55 : 1;
        if (!t.locked) g.rect(-14, -120, 28, 120).fill({ color: col, alpha: 0.13 });
        this.name.text = t.locked ? '출구 (잠김)' : '출구';
        this.name.tint = col;
        this.glow.tint = col;
        this.glow.alpha = t.locked ? 0.15 : 0.6;
      } else if (t.kind === 'npc') {
        this.name.text = '!';
        this.name.scale.set(0.8);
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
        this.name.text = '!';
        this.name.scale.set(0.8);
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

class BarrierView implements Disposable {
  readonly root = new Graphics();

  constructor(b: Barrier, stage: Stage) {
    const H = 38;
    this.root
      .poly([b.x1, b.y1, b.x2, b.y2, b.x2, b.y2 - H, b.x1, b.y1 - H])
      .fill({ color: 0xffb066, alpha: 0.4 })
      .poly([b.x1, b.y1, b.x2, b.y2, b.x2, b.y2 - H, b.x1, b.y1 - H])
      .stroke({ color: 0xffd9a8, width: 3, alpha: 0.9 });
    this.root.zIndex = Math.max(b.y1, b.y2);
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
  private partyStatus!: BitmapText;
  private petView = new Container();
  private reticle = new Graphics();
  private aimMark = new Graphics();
  private lastHpRatio = -1;
  private lastStatus = '';
  private lookX = 0;
  private lookY = 0;
  private time = 0;
  private pose: CharPose = {
    anim: 'Idle',
    t: 0,
    dur: 0,
    hitAt: 0,
    facing: Math.PI / 2,
    combo: 0,
    hitFlash: 0,
    tagT: 0,
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
    buildMapView(w.plan, stage.ground, stage.objects, stage.tex.glow);

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
    // 펫 그림이 있으면 받아서 도형과 바꾼다
    const petArt = asset(`ui/pet_${w.pet.def.id}`);
    if (petArt) {
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
    this.partyStatus = label('', 13, 0xfff2a8);
    this.lastHpRatio = -1;
    this.lastStatus = '';
    stage.fx.addChild(this.partyBar, this.partyStatus);

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
    stage.updateCamera(w.party.x, w.party.y, w.plan.w * TILE, w.plan.h * TILE, 0, true);
  }

  unload(): void {
    this.fx.clear();
    this.stage.clear();
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
      v.root.position.set(e.x, e.y);
      v.root.zIndex = e.y;
      v.update(e, dt);
    }

    for (const p of w.projectiles) {
      let v = p.view as ProjectileView | undefined;
      if (!v) {
        v = new ProjectileView(p, stage);
        p.view = v;
      }
      v.update(p);
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

    for (const t of w.things) {
      let v = t.view as ThingView | undefined;
      if (!v) {
        v = new ThingView(t, stage);
        t.view = v;
      }
      v.update(t, dt);
    }

    this.fx.update(dt);

    // 카메라: 바라보는 쪽을 조금 더 보여 준다
    const p = w.party;
    const k = Math.min(1, dt * 3);
    this.lookX += (Math.cos(p.facing) * 46 - this.lookX) * k;
    this.lookY += (Math.sin(p.facing) * 30 - this.lookY) * k;
    stage.updateCamera(p.x + this.lookX, p.y + this.lookY - 20, w.plan.w * TILE, w.plan.h * TILE, dt);
  }

  private syncParty(w: World, dt: number): void {
    const p = w.party;
    const m = p.active;
    const pose = this.pose;
    pose.anim = p.anim;
    pose.t = p.animT;
    pose.dur = p.animDur;
    pose.hitAt = p.animHit;
    pose.facing = p.facing;
    // 스킬이 타격을 시작하면서 combo를 먼저 올리므로, 지금 치고 있는 타격은 하나 앞 번호다
    pose.combo = Math.max(0, m.combo - 1);
    pose.hitFlash = p.hitFlash;
    pose.tagT = p.tagT;
    pose.invuln = p.invulnT > 0;

    this.chars.forEach((v, i) => {
      const on = i === p.cur;
      v.root.visible = on;
      if (!on) return;
      v.root.position.set(p.x, p.y);
      v.root.zIndex = p.y;
      v.update(pose, dt);
    });

    // 머리 위 체력과 상위 버프 1개
    const ratio = Math.max(0, m.hp / m.stats.maxHp);
    this.partyBar.position.set(p.x, p.y - 96);
    if (Math.abs(ratio - this.lastHpRatio) > 0.003) {
      this.lastHpRatio = ratio;
      const bw = 46;
      this.partyBar
        .clear()
        .roundRect(-bw / 2 - 1, -1, bw + 2, 7, 2.5)
        .fill({ color: 0x15131f, alpha: 0.85 })
        .roundRect(-bw / 2, 0, bw * ratio, 5, 2)
        .fill(ratio > 0.3 ? 0x6fe38a : 0xff6b6b);
    }
    const icons = m.statusIcons();
    const top = icons.length ? (icons[0].stacks > 1 ? `${icons[0].label} ${icons[0].stacks}` : icons[0].label) : '';
    if (top !== this.lastStatus) {
      this.lastStatus = top;
      this.partyStatus.text = top;
    }
    this.partyStatus.visible = top !== '';
    this.partyStatus.position.set(p.x, p.y - 108);

    // 펫
    const pet = w.pet;
    this.petView.position.set(pet.x, pet.y + Math.sin(this.time * 4) * 2);
    this.petView.zIndex = pet.y;

    // 추천 타겟
    const t: Enemy | null = p.autoTarget && !p.autoTarget.dead ? p.autoTarget : null;
    this.reticle.visible = !!t;
    if (t) {
      this.reticle.position.set(t.x, t.y - t.r);
      this.reticle.rotation = this.time * 1.5;
      this.reticle.scale.set(Math.max(0.8, Math.min(1.5, t.r / 20)) * (1 + 0.06 * Math.sin(this.time * 8)));
    }

    this.aimMark.visible = !p.wiped;
    this.aimMark.position.set(p.x + Math.cos(p.facing) * 40, p.y + Math.sin(p.facing) * 40);
    this.aimMark.rotation = p.facing;
    this.aimMark.alpha = p.action === 'attack' ? 1 : 0.55;
  }
}
