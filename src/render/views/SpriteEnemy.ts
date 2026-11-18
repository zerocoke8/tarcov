// 스프라이트 시트로 그리는 몬스터 표시부. 시트가 준비된 몬스터만 registry.ts에서 이 표시부를 쓴다.
import { Container } from 'pixi.js';
import type { Enemy } from '../../game/enemy/Enemy';
import { SpriteBody } from '../sprites/SpriteBody';
import type { SpriteSet } from '../sprites/SpriteStore';
import { addEnemyBase, EnemyOverlay } from './enemyOverlay';
import type { EnemyView } from './types';

export class SpriteEnemy implements EnemyView {
  readonly root = new Container();
  private body: SpriteBody;
  private overlay: EnemyOverlay;
  private time = 0;
  private facing = Math.PI / 2;
  /** 시트의 키(height)는 기본 크기 몬스터 기준이다. 등급 등으로 몸집이 달라지면 그만큼 키운다 */
  private size: number;

  constructor(e: Enemy, set: SpriteSet) {
    this.size = e.r / e.def.radius;
    addEnemyBase(this.root, e);
    this.body = new SpriteBody(set);
    this.root.addChild(this.body.sprite);
    this.overlay = new EnemyOverlay(this.root, e, set.height * this.size);
  }

  update(e: Enemy, dt: number): void {
    this.time += dt;
    if (Math.abs(e.dirX) + Math.abs(e.dirY) > 0.1) this.facing = Math.atan2(e.dirY, e.dirX);
    let sx = this.size;
    let sy = this.size;
    let alpha = 1;
    let tint = 0xffffff;
    let rot = 0;

    const anim = e.dead ? 'Death' : e.anim;
    const body = this.body;
    body.show(anim, this.facing, e.animT, 0, 0, 0, 1, 1);
    const own = body.clipName === anim;

    if (e.dead) {
      const k = Math.min(1, e.animT / 0.4);
      if (!own) {
        // 죽는 그림이 없으면 납작해지며 사라진다
        sx *= 1 + k * 0.4;
        sy *= 1 - k * 0.6;
        alpha = 1 - k;
      } else alpha = e.animT > 0.6 ? Math.max(0, 1 - (e.animT - 0.6) / 0.3) : 1;
    } else {
      if (!own && (anim === 'MonsterAttack' || anim === 'Pattern')) {
        // 공격 준비 그림이 없으면 부풀며 붉어진다
        sx = sy = this.size * (1 + 0.1 * Math.sin(this.time * 26));
        tint = 0xffb0a0;
      } else if (!own && anim === 'Stun') {
        rot = Math.sin(this.time * 24) * 0.1;
        tint = 0xb8c6ff;
      }
      if (e.hitFlash > 0) {
        tint = 0xff7a7a;
        sx *= 1.08;
        sy *= 0.94;
      }
    }
    const sprite = body.sprite;
    sprite.scale.x *= sx;
    sprite.scale.y *= sy;
    sprite.rotation = rot;
    sprite.tint = tint;
    this.root.alpha = alpha;
    this.overlay.update(e);
  }

  destroy(): void {
    // 텍스처는 여러 표시부가 함께 쓰므로 지우지 않는다
    this.root.destroy({ children: true });
  }
}
