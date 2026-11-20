// 스프라이트 시트로 그리는 몬스터 표시부. 시트가 준비된 몬스터만 registry.ts에서 이 표시부를 쓴다.
import { Container } from 'pixi.js';
import { DEATH_FADE } from '../../game/entities';
import type { Enemy } from '../../game/enemy/Enemy';
import { proj } from '../proj';
import { SpriteBody } from '../sprites/SpriteBody';
import type { SpriteSet } from '../sprites/SpriteStore';
import { addEnemyBase, EnemyOverlay } from './enemyOverlay';
import type { EnemyView } from './types';

/** 피격 동작을 보여 주는 시간(초) */
const HIT_TIME = 0.28;
/** 공격을 준비하는 동작들. 전용 그림이 없으면 몸이 부풀며 붉어지는 것으로 대신한다 */
const ATTACKS = new Set(['MonsterAttack', 'Pattern', 'Finale', 'Phase']);

export class SpriteEnemy implements EnemyView {
  readonly root = new Container();
  private body: SpriteBody;
  private overlay: EnemyOverlay;
  private time = 0;
  private facing = Math.PI / 2;
  /** 시트의 키(height)는 기본 크기 몬스터 기준이다. 등급 등으로 몸집이 달라지면 그만큼 키운다 */
  private size: number;
  /** 피격 동작이 시작된 뒤 지난 시간. 보여 주고 있지 않으면 -1 */
  private hitT = -1;
  private lastFlash = 0;

  constructor(
    e: Enemy,
    private set: SpriteSet,
  ) {
    this.size = e.r / e.def.radius;
    addEnemyBase(this.root, e);
    this.body = new SpriteBody(set);
    this.root.addChild(this.body.sprite);
    this.overlay = new EnemyOverlay(this.root, e, set.height * this.size);
  }

  update(e: Enemy, dt: number): void {
    this.time += dt;
    // 화면에서 바라보는 방향
    if (Math.abs(e.dirX) + Math.abs(e.dirY) > 0.1) this.facing = proj.angle(Math.atan2(e.dirY, e.dirX));
    let sx = this.size;
    let sy = this.size;
    let alpha = 1;
    let tint = 0xffffff;
    let rot = 0;

    const anim = e.dead ? 'Death' : e.anim;

    // 피격 동작: 규칙에는 "맞았다"는 짧은 신호(hitFlash)만 있으므로, 새로 맞은 순간부터 정해진 시간 동안 보여 준다.
    // 공격을 준비하거나 공격하는 중에는 그 동작을 끊지 않는다 (예고와 어긋나 보이지 않게)
    const free = !e.dead && (anim === 'Idle' || anim === 'Move');
    if (e.hitFlash > this.lastFlash && free && this.set.clips.Hit) this.hitT = 0;
    this.lastFlash = e.hitFlash;
    if (this.hitT >= 0) {
      this.hitT += dt;
      if (!free || this.hitT >= HIT_TIME) this.hitT = -1;
    }

    const body = this.body;
    if (this.hitT >= 0) body.show('Hit', this.facing, this.hitT, HIT_TIME, 0, 0, 1, 1);
    else body.show(anim, this.facing, e.animT, e.animDur, e.animHit, 0, 1, 1);
    const own = this.hitT >= 0 || body.clipName === anim;

    if (e.dead) {
      if (!own) {
        // 죽는 그림이 없으면 납작해지며 사라진다
        const k = Math.min(1, e.animT / 0.4);
        sx *= 1 + k * 0.4;
        sy *= 1 - k * 0.6;
        alpha = 1 - k;
      } else alpha = Math.max(0, Math.min(1, e.deathT / DEATH_FADE));
    } else {
      if (!own && ATTACKS.has(anim)) {
        // 공격 준비 그림이 없으면 부풀며 붉어진다
        sx = sy = this.size * (1 + 0.1 * Math.sin(this.time * 26));
        tint = 0xffb0a0;
      } else if (!own && anim === 'Stun') {
        // 기절 그림이 없으면 피격 그림(또는 대기 그림) 위에서 몸을 떨며 푸르게 물든다
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
