// 도형으로 그린 2.5~3등신 SD 캐릭터 플레이스홀더.
// 머리색·의상색·머리 모양·무기로 캐릭터를 구분한다 (characters.csv의 색상 열을 쓴다).
import { Container, Graphics } from 'pixi.js';
import { easeOut, shade } from '../../core/math';
import type { CharDef } from '../../data/types';
import type { CharPose, CharView } from './types';

const MELEE = new Set(['greatsword', 'hammer', 'daggers', 'lance']);

export class PlaceholderChar implements CharView {
  readonly root = new Container();
  private body = new Container();
  private legL = new Graphics();
  private legR = new Graphics();
  private weapon = new Container();
  private left = false;
  private time = Math.random() * 10;
  private melee: boolean;

  constructor(private def: CharDef) {
    this.melee = MELEE.has(def.weaponType);
    this.root.sortableChildren = true;

    const shadow = new Graphics().ellipse(0, 0, 16, 6.5).fill({ color: 0x000000, alpha: 0.35 });
    shadow.zIndex = 0;
    this.body.zIndex = 2;
    this.weapon.zIndex = 3;
    this.weapon.y = -27;
    this.root.addChild(shadow, this.body, this.weapon);

    this.build();
    this.buildWeapon();
  }

  private build(): void {
    const c = this.def.colors;
    const style = this.def.hairStyle;

    const hairBack = new Graphics();
    if (style === 'long') {
      hairBack.roundRect(-18, -73, 36, 62, 14).fill(c.hair);
      hairBack.roundRect(-17, -32, 34, 22, 9).fill(c.hair2);
    } else if (style === 'bob') {
      hairBack.roundRect(-18.5, -73, 37, 34, 14).fill(c.hair);
    } else if (style === 'twintail') {
      hairBack.roundRect(-18, -73, 36, 28, 14).fill(c.hair);
      hairBack.ellipse(-19, -41, 6, 10).fill(c.hair2);
      hairBack.ellipse(19, -41, 6, 10).fill(c.hair2);
    } else if (style === 'pony') {
      hairBack.roundRect(-18, -73, 36, 28, 14).fill(c.hair);
      hairBack.ellipse(18, -48, 6, 17).fill(c.hair2);
    } else {
      hairBack.roundRect(-17, -73, 34, 26, 13).fill(c.hair);
    }

    const boot = shade(c.accent, 0.1);
    this.legL.roundRect(-8, -17, 6, 14, 3).fill(c.skin).roundRect(-9, -6, 8, 6, 2.5).fill(boot);
    this.legR.roundRect(2, -17, 6, 14, 3).fill(c.skin).roundRect(1, -6, 8, 6, 2.5).fill(boot);

    const torso = new Graphics();
    torso.ellipse(-13, -31, 4.5, 8).fill(shade(c.outfit, -0.12));
    torso.ellipse(13, -31, 4.5, 8).fill(shade(c.outfit, -0.12));
    torso.roundRect(-11, -41, 22, 25, 8).fill(c.outfit);
    torso.roundRect(-5, -40, 10, 14, 4).fill(shade(c.outfit, 0.55));
    torso.poly([-11, -22, 11, -22, 14, -13, -14, -13]).fill(c.accent);

    const head = new Graphics();
    head.circle(0, -56, 15).fill(c.skin);
    // 앞머리
    head.roundRect(-16.5, -73, 33, 17, 12).fill(c.hair);
    head.poly([-16.5, -61, -10, -51, -5, -61]).fill(c.hair);
    head.poly([5, -61, 10, -51, 16.5, -61]).fill(c.hair);
    head.poly([-3, -61, 0, -55, 3, -61]).fill(c.hair);
    // 눈, 볼
    head.ellipse(-6, -51.5, 2.9, 3.7).fill(c.eye);
    head.ellipse(6, -51.5, 2.9, 3.7).fill(c.eye);
    head.circle(-5, -52.8, 1.05).fill(0xffffff);
    head.circle(7, -52.8, 1.05).fill(0xffffff);
    head.ellipse(-10.5, -47, 3, 1.6).fill({ color: 0xff93a4, alpha: 0.55 });
    head.ellipse(10.5, -47, 3, 1.6).fill({ color: 0xff93a4, alpha: 0.55 });
    // 머리 장식
    if (style === 'bob') {
      head.circle(15.5, -68, 5.5).fill(c.hair2);
      head.rect(12.5, -64, 6, 3).fill(0x22222a);
    } else if (style === 'twintail') {
      head.poly([-1, -72, 4, -83, 4, -72]).fill(c.hair);
    } else if (style === 'long') {
      head.poly([-8, -80, 0, -74, -8, -70]).fill(c.outfit);
      head.poly([8, -80, 0, -74, 8, -70]).fill(c.outfit);
    }

    this.body.addChild(hairBack, this.legL, this.legR, torso, head);
  }

  /** 무기는 오른쪽(+x)을 향하게 그리고, 조준 각도로 돌린다 */
  private buildWeapon(): void {
    const c = this.def.colors;
    const g = new Graphics();
    switch (this.def.weaponType) {
      case 'greatsword':
        g.roundRect(2, -3, 14, 6, 2).fill(0x3a3340);
        g.rect(14, -8, 4, 16).fill(0xcaa54b);
        g.poly([18, -6, 58, -5, 68, 0, 58, 5, 18, 6]).fill(0xe8edf6);
        g.poly([18, 0, 66, 0, 58, 5, 18, 6]).fill(0xb7c2d6);
        break;
      case 'hammer':
        g.roundRect(2, -2.5, 40, 5, 2).fill(0x5a4636);
        g.roundRect(36, -13, 18, 26, 4).fill(0x8f97a8);
        g.roundRect(36, -13, 18, 8, 4).fill(0xb9c0cf);
        break;
      case 'daggers':
        g.poly([10, -3, 34, -2, 40, 0, 34, 2, 10, 3]).fill(0xe8edf6);
        g.roundRect(4, -2.5, 8, 5, 2).fill(0x3a3340);
        break;
      case 'lance':
        g.roundRect(-6, -2, 60, 4, 2).fill(0x6b5a44);
        g.poly([54, -6, 74, 0, 54, 6]).fill(0xe8edf6);
        g.poly([10, -2, 30, -16, 30, -2]).fill(c.outfit);
        break;
      case 'gauntlet':
        g.roundRect(6, -11, 24, 22, 8).fill(shade(c.outfit, -0.15));
        g.roundRect(18, -9, 14, 18, 6).fill(0x2f333b);
        g.circle(31, 0, 4.5).fill(0x8ff5e0);
        break;
      case 'bow':
        g.arc(8, 0, 21, -1.15, 1.15).stroke({ color: shade(c.outfit, 0.25), width: 4.5 });
        g.moveTo(8 + 21 * Math.cos(1.15), -21 * Math.sin(1.15))
          .lineTo(8 + 21 * Math.cos(1.15), 21 * Math.sin(1.15))
          .stroke({ color: 0xffffff, width: 1.2, alpha: 0.85 });
        break;
      case 'talisman':
        g.roundRect(14, -7, 11, 14, 2).fill(0xfff3c4);
        g.rect(17, -4, 5, 8).fill(0xd2463e);
        break;
      case 'shotgun':
        g.roundRect(4, -3.5, 34, 7, 2).fill(0x30343c);
        g.roundRect(4, -1, 12, 7, 2).fill(0x6b4a36);
        break;
      default:
        g.roundRect(6, -3, 24, 6, 2).fill(0x30343c);
        g.roundRect(8, 0, 6, 8, 2).fill(0x30343c);
    }
    this.weapon.addChild(g);
  }

  update(pose: CharPose, dt: number): void {
    this.time += dt;
    const cos = Math.cos(pose.facing);
    if (cos < -0.15) this.left = true;
    else if (cos > 0.15) this.left = false;
    const dir = this.left ? -1 : 1;

    const body = this.body;
    let sx = 1;
    let sy = 1;
    let rot = 0;
    let by = 0;
    let alpha = 1;
    let wRot = pose.facing;
    let wPush = 0;
    this.legL.y = 0;
    this.legR.y = 0;
    const k = pose.dur > 0 ? Math.min(1, pose.t / pose.dur) : 0;

    switch (pose.anim) {
      case 'Idle':
        by = Math.sin(this.time * 3) * 1.2;
        break;
      case 'Move': {
        const ph = this.time * 15;
        this.legL.y = Math.min(0, Math.sin(ph)) * 4.5;
        this.legR.y = Math.min(0, -Math.sin(ph)) * 4.5;
        by = -Math.abs(Math.sin(ph)) * 2.5;
        rot = 0.07;
        break;
      }
      case 'BasicAttack':
        if (this.melee) {
          // 휘두르기: 연속기 단계마다 방향을 바꾼다
          const swing = easeOut(Math.min(1, k / 0.55));
          const side = pose.combo % 2 === 0 ? 1 : -1;
          wRot = pose.facing + side * (-1.5 + 3 * swing);
          rot = 0.12 * (1 - k);
        } else {
          wPush = -7 * Math.max(0, 1 - k * 3);
        }
        break;
      case 'ActiveSkill': {
        const s = 1 + 0.14 * Math.sin(k * Math.PI);
        sx = sy = s;
        wPush = 6 * Math.sin(k * Math.PI);
        break;
      }
      case 'Ultimate': {
        const s = 1 + 0.22 * Math.sin(k * Math.PI);
        sx = sy = s;
        by = -8 * Math.sin(k * Math.PI);
        break;
      }
      case 'Escape':
        rot = 0.45;
        sx = 1.12;
        sy = 0.84;
        alpha = 0.6;
        break;
      case 'Stun':
        rot = Math.sin(this.time * 22) * 0.09;
        break;
      case 'Death':
        rot = Math.min(1.5, pose.t * 6);
        alpha = Math.max(0.3, 1 - pose.t * 0.9);
        break;
      default:
        break;
    }
    if (pose.tagT > 0) {
      // 교체 등장: 살짝 커졌다가 돌아온다
      const pop = 1 + pose.tagT * 1.2;
      sx *= pop;
      sy *= pop;
    }
    if (pose.invuln && pose.anim !== 'Escape' && pose.anim !== 'Death') alpha = 0.65 + 0.3 * Math.sin(this.time * 30);

    body.scale.set(sx * dir, sy);
    body.rotation = rot * dir;
    body.y = by;
    body.alpha = alpha;
    this.root.tint = pose.hitFlash > 0 ? 0xff8f8f : 0xffffff;

    const w = this.weapon;
    w.visible = pose.anim !== 'Death';
    w.rotation = wRot;
    w.scale.y = Math.cos(wRot) < 0 ? -1 : 1;
    w.x = Math.cos(wRot) * wPush;
    w.y = -27 + by + Math.sin(wRot) * wPush;
    w.alpha = alpha;
    // 위쪽을 조준할 때는 무기가 몸 뒤로 간다
    w.zIndex = Math.sin(pose.facing) < -0.35 ? 1 : 3;
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }
}
