// 도형으로 그린 몬스터 플레이스홀더. 머리 위에 체력과 상위 상태 1개를 표시한다 (HUD ⑬ 간략 전투 상태).
import { BitmapText, Container, Graphics } from 'pixi.js';
import { shade } from '../../core/math';
import type { Enemy } from '../../game/enemy/Enemy';
import type { EnemyView } from './types';

const FONT = 'Arial, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const AURA = [0, 0xffc94a, 0xc77dff];

export class PlaceholderEnemy implements EnemyView {
  readonly root = new Container();
  private body = new Container();
  private pupil: Graphics | null = null;
  private bar = new Graphics();
  private status: BitmapText;
  private lastRatio = -1;
  private lastStatus = '';
  private time = Math.random() * 10;
  /** 머리 꼭대기 높이 (체력 바 위치) */
  private top: number;
  private barW: number;

  constructor(e: Enemy) {
    const r = e.r;
    const color = e.def.color;
    const eye = e.def.eye;
    const dark = shade(color, -0.35);

    const shadow = new Graphics().ellipse(0, 0, r * 1.05, r * 0.42).fill({ color: 0x000000, alpha: 0.35 });
    this.root.addChild(shadow);
    if (e.grade.grade > 0) {
      const aura = new Graphics()
        .ellipse(0, 0, r * 1.5, r * 0.62)
        .stroke({ color: AURA[e.grade.grade] ?? 0xffc94a, width: 3, alpha: 0.9 });
      this.root.addChild(aura);
    }
    this.root.addChild(this.body);

    const g = new Graphics();
    this.top = r * 2.4;
    switch (e.def.id) {
      case 'wisp':
        g.circle(0, -r * 1.3, r).fill(color);
        g.poly([-r, -r * 1.3, -r * 0.95, -r * 0.1, -r * 0.45, -r * 0.5, 0, 0, r * 0.45, -r * 0.5, r * 0.95, -r * 0.1, r, -r * 1.3]).fill(
          color,
        );
        g.ellipse(-r * 0.36, -r * 1.35, r * 0.19, r * 0.28).fill(eye);
        g.ellipse(r * 0.36, -r * 1.35, r * 0.19, r * 0.28).fill(eye);
        break;
      case 'hound':
        g.poly([-r * 1.2, -r * 0.9, -r * 1.9, -r * 1.5, -r * 1.1, -r * 0.55]).fill(dark);
        g.rect(-r * 0.9, -r * 0.45, r * 0.32, r * 0.45).fill(dark);
        g.rect(r * 0.45, -r * 0.45, r * 0.32, r * 0.45).fill(dark);
        g.ellipse(0, -r * 0.85, r * 1.25, r * 0.7).fill(color);
        g.circle(r * 0.95, -r * 1.2, r * 0.62).fill(color);
        g.poly([r * 0.65, -r * 1.65, r * 0.8, -r * 2.2, r * 1.05, -r * 1.7]).fill(color);
        g.poly([r * 1.05, -r * 1.7, r * 1.3, -r * 2.15, r * 1.42, -r * 1.55]).fill(color);
        g.circle(r * 1.2, -r * 1.25, r * 0.15).fill(eye);
        this.top = r * 2.3;
        break;
      case 'eye': {
        g.moveTo(0, -r * 0.9).lineTo(-r * 0.6, -r * 0.05).stroke({ color: dark, width: 3 });
        g.moveTo(0, -r * 0.9).lineTo(0, 0).stroke({ color: dark, width: 3 });
        g.moveTo(0, -r * 0.9).lineTo(r * 0.6, -r * 0.05).stroke({ color: dark, width: 3 });
        g.circle(0, -r * 1.6, r).fill(color);
        g.circle(0, -r * 1.6, r * 0.7).fill(0xf4efe6);
        this.pupil = new Graphics().circle(0, 0, r * 0.38).fill(eye).circle(0, 0, r * 0.17).fill(0x1a1420);
        this.pupil.y = -r * 1.6;
        this.top = r * 2.7;
        break;
      }
      case 'bloat':
        g.circle(0, -r * 1.05, r * 1.1).fill(color);
        g.moveTo(-r * 0.6, -r * 0.6).lineTo(-r * 0.1, -r * 0.95).lineTo(r * 0.35, -r * 0.5).stroke({ color: eye, width: 2.5 });
        g.moveTo(r * 0.2, -r * 1.5).lineTo(r * 0.6, -r * 1.1).stroke({ color: eye, width: 2 });
        g.ellipse(-r * 0.38, -r * 1.3, r * 0.16, r * 0.22).fill(eye);
        g.ellipse(r * 0.38, -r * 1.3, r * 0.16, r * 0.22).fill(eye);
        this.top = r * 2.3;
        break;
      case 'boss':
        // 그믐의 우산: 검은 망토 위에 붉은 우산을 쓴 형체
        g.poly([-r * 0.95, 0, -r * 0.6, -r * 1.9, r * 0.6, -r * 1.9, r * 0.95, 0]).fill(color);
        g.poly([-r * 0.95, 0, -r * 0.55, -r * 0.35, -r * 0.2, 0, r * 0.2, -r * 0.35, r * 0.55, 0, r * 0.95, -r * 0.35, r * 0.95, 0]).fill(
          dark,
        );
        g.circle(0, -r * 2, r * 0.5).fill(0xe9e2f2);
        g.ellipse(-r * 0.18, -r * 2.02, r * 0.09, r * 0.14).fill(eye);
        g.ellipse(r * 0.18, -r * 2.02, r * 0.09, r * 0.14).fill(eye);
        g.rect(-r * 0.04, -r * 3.1, r * 0.08, r * 2.2).fill(0x15131f);
        g.moveTo(-r * 1.5, -r * 2.6)
          .arc(0, -r * 2.6, r * 1.5, Math.PI, 0)
          .closePath()
          .fill(eye);
        g.moveTo(-r * 1.5, -r * 2.6)
          .arc(0, -r * 2.6, r * 1.5, Math.PI, 0)
          .stroke({ color: 0x15131f, width: 3 });
        for (const k of [-0.75, 0, 0.75]) {
          g.moveTo(0, -r * 4.1).lineTo(r * 1.5 * k, -r * 2.6).stroke({ color: 0x15131f, width: 2, alpha: 0.5 });
        }
        this.top = r * 4.2;
        break;
      default:
        // 따로 그린 모양이 없는 몬스터: 뿔 달린 덩어리
        g.roundRect(-r, -r * 2.1, r * 2, r * 2.1, r * 0.6).fill(color);
        g.poly([-r * 0.8, -r * 2, -r * 0.95, -r * 2.7, -r * 0.4, -r * 2.1]).fill(dark);
        g.poly([r * 0.8, -r * 2, r * 0.95, -r * 2.7, r * 0.4, -r * 2.1]).fill(dark);
        g.ellipse(-r * 0.4, -r * 1.45, r * 0.18, r * 0.24).fill(eye);
        g.ellipse(r * 0.4, -r * 1.45, r * 0.18, r * 0.24).fill(eye);
        g.rect(-r * 0.45, -r * 0.95, r * 0.9, r * 0.14).fill(dark);
        this.top = r * 2.8;
    }
    this.body.addChild(g);
    if (this.pupil) this.body.addChild(this.pupil);

    this.barW = Math.max(30, Math.min(110, r * 2.4));
    this.bar.y = -this.top - 10;
    this.bar.visible = false;
    this.status = new BitmapText({
      text: '',
      style: { fontFamily: FONT, fontSize: 26, fontWeight: 'bold', fill: 0xffffff, stroke: { color: 0x15131f, width: 4 } },
    });
    this.status.anchor.set(0.5, 1);
    this.status.scale.set(0.5);
    this.status.y = -this.top - 13;
    this.status.visible = false;
    this.root.addChild(this.bar, this.status);
  }

  private drawBar(ratio: number): void {
    const w = this.barW;
    this.bar
      .clear()
      .roundRect(-w / 2 - 1, -1, w + 2, 6, 2)
      .fill({ color: 0x15131f, alpha: 0.85 })
      .roundRect(-w / 2, 0, Math.max(0, w * ratio), 4, 1.5)
      .fill(0xff5a6a);
  }

  update(e: Enemy, dt: number): void {
    this.time += dt;
    const body = this.body;
    const flip = e.dirX < -0.1 ? -1 : e.dirX > 0.1 ? 1 : body.scale.x < 0 ? -1 : 1;
    let sx = 1;
    let sy = 1;
    let by = 0;
    let rot = 0;
    let alpha = 1;
    let tint = 0xffffff;

    if (e.dead) {
      const k = Math.min(1, e.animT / 0.4);
      alpha = 1 - k;
      sx = 1 + k * 0.4;
      sy = 1 - k * 0.6;
    } else {
      switch (e.anim) {
        case 'Idle':
          by = Math.sin(this.time * 2.6) * 1.5;
          break;
        case 'Move':
          by = -Math.abs(Math.sin(this.time * 11)) * 3;
          rot = 0.05;
          break;
        case 'MonsterAttack':
        case 'Pattern': {
          // 공격 준비: 부풀며 붉어진다
          const pulse = 1 + 0.1 * Math.sin(this.time * 26);
          sx = sy = pulse;
          tint = 0xffb0a0;
          break;
        }
        case 'Stun':
          rot = Math.sin(this.time * 24) * 0.1;
          tint = 0xb8c6ff;
          break;
        default:
          break;
      }
      if (e.hitFlash > 0) {
        tint = 0xff7a7a;
        sx *= 1.08;
        sy *= 0.94;
      }
    }
    body.scale.set(sx * flip, sy);
    body.y = by;
    body.rotation = rot * flip;
    body.tint = tint;
    this.root.alpha = alpha;
    if (this.pupil) {
      const r = e.r;
      this.pupil.x = e.dirX * r * 0.25 * flip;
      this.pupil.y = -r * 1.6 + e.dirY * r * 0.2;
    }

    const ratio = Math.max(0, e.hp / e.maxHp);
    const show = !e.dead && (e.aggro || ratio < 1);
    this.bar.visible = show;
    if (show && Math.abs(ratio - this.lastRatio) > 0.004) {
      this.lastRatio = ratio;
      this.drawBar(ratio);
    }
    const st = e.dead ? '' : e.topStatus();
    if (st !== this.lastStatus) {
      this.lastStatus = st;
      this.status.text = st;
      this.status.visible = st !== '';
    }
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }
}
