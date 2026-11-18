// 스프라이트 시트로 그리는 캐릭터 표시부. 시트가 준비된 캐릭터만 registry.ts에서 이 표시부를 쓴다.
// 아직 그림이 없는 동작은 가까운 동작으로 대신하고(select.ts의 FALLBACK), 플레이스홀더와 같은 연출(기울기·흐려짐)을 덧입힌다.
import { Container, Graphics } from 'pixi.js';
import { SpriteBody } from '../sprites/SpriteBody';
import type { SpriteSet } from '../sprites/SpriteStore';
import type { CharPose, CharView } from './types';

/** 피격 동작을 보여 주는 시간(초). 서 있거나 이동 중에 맞았을 때만 보여 준다 */
const HIT_TIME = 0.32;

export class SpriteChar implements CharView {
  readonly root = new Container();
  private body: SpriteBody;
  private time = 0;
  /** 피격 동작이 시작된 뒤 지난 시간. 재생 중이 아니면 음수 */
  private hitT = -1;
  private lastFlash = 0;

  constructor(private set: SpriteSet) {
    this.body = new SpriteBody(set);
    const shadow = new Graphics().ellipse(0, 0, 16, 6.5).fill({ color: 0x000000, alpha: 0.35 });
    this.root.addChild(shadow, this.body.sprite);
  }

  update(pose: CharPose, dt: number): void {
    this.time += dt;
    let sx = 1;
    let sy = 1;
    if (pose.tagT > 0) {
      // 교체 등장: 살짝 커졌다가 돌아온다
      sx = sy = 1 + pose.tagT * 1.2;
    }

    // 피격 동작: 규칙에는 "맞았다"는 짧은 신호(hitFlash)만 있으므로, 새로 맞은 순간부터 정해진 시간 동안 보여 준다.
    // 공격·스킬·회피 중에는 그 동작을 끊지 않는다
    const free = pose.anim === 'Idle' || pose.anim === 'Move';
    if (pose.hitFlash > this.lastFlash && free && this.set.clips.Hit) this.hitT = 0;
    this.lastFlash = pose.hitFlash;
    if (this.hitT >= 0) {
      this.hitT += dt;
      if (!free || this.hitT >= HIT_TIME) this.hitT = -1;
    }

    const body = this.body;
    if (this.hitT >= 0) body.show('Hit', pose.facing, this.hitT, HIT_TIME, 0, 0, sx, sy);
    else body.show(pose.anim, pose.facing, pose.t, pose.dur, pose.hitAt, pose.combo, sx, sy);
    const sprite = body.sprite;

    // 전용 그림이 없는 동작은 플레이스홀더와 같은 방식으로 표현한다
    const own = this.hitT >= 0 || body.clipName === pose.anim || (pose.anim === 'BasicAttack' && body.clipName.startsWith('BasicAttack'));
    let alpha = 1;
    let rot = 0;
    if (!own) {
      if (pose.anim === 'Escape') {
        alpha = 0.6;
        sprite.scale.x *= 1.12;
        sprite.scale.y *= 0.84;
      } else if (pose.anim === 'Stun') {
        rot = Math.sin(this.time * 22) * 0.09;
      } else if (pose.anim === 'Death') {
        rot = Math.min(1.5, pose.t * 6);
        alpha = Math.max(0.3, 1 - pose.t * 0.9);
      }
    }
    if (pose.invuln && pose.anim !== 'Escape' && pose.anim !== 'Death') alpha = 0.65 + 0.3 * Math.sin(this.time * 30);
    sprite.rotation = rot * (sprite.scale.x < 0 ? -1 : 1);
    sprite.alpha = alpha;
    sprite.tint = pose.hitFlash > 0 ? 0xff8f8f : 0xffffff;
  }

  destroy(): void {
    // 텍스처는 여러 표시부가 함께 쓰므로 지우지 않는다
    this.root.destroy({ children: true });
  }
}
