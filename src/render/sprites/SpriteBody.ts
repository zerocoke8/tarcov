// 스프라이트 한 벌(SpriteSet)에서 지금 상태에 맞는 프레임을 골라 보여 주는 표시 객체.
// 캐릭터 표시부(SpriteChar)와 몬스터 표시부(SpriteEnemy)가 함께 쓴다.
import { Sprite } from 'pixi.js';
import { frameAt, pickDir, resolveClip, type DirChoice } from './select';
import type { SpriteSet } from './SpriteStore';

export class SpriteBody {
  readonly sprite = new Sprite();
  /** 지금 재생 중인 클립 이름 (요청한 동작의 그림이 없으면 대신 쓰는 동작의 이름) */
  clipName = '';
  private dir: DirChoice | null = null;

  constructor(readonly set: SpriteSet) {}

  /**
   * @param anim   애니메이션 상태 이름
   * @param facing 바라보는 각도 (rad)
   * @param t      상태가 시작된 뒤 지난 시간
   * @param dur    상태의 전체 길이 (없으면 0)
   * @param hitAt  첫 타격 시점 (없으면 0)
   * @param combo  기본 공격 연속기 단계
   * @param sx, sy 추가 배율 (등장·피격 연출용)
   */
  show(anim: string, facing: number, t: number, dur = 0, hitAt = 0, combo = 0, sx = 1, sy = 1): void {
    const set = this.set;
    const name = resolveClip(set.clips, anim, combo);
    const sprite = this.sprite;
    if (!name) {
      sprite.visible = false;
      return;
    }
    this.clipName = name;
    const clip = set.clips[name];
    // 동작이 바뀌어도 방향 선택은 이어 간다 (그 방향 그림이 이 클립에 없을 때만 새로 고른다)
    const keep = this.dir && clip.available.includes(this.dir.dir) ? this.dir : null;
    const choice = (this.dir = pickDir(clip.available, set.mirror, facing, keep));
    const frames = clip.dirs[choice.dir]!;
    const f = frames[frameAt(clip, frames.length, t, dur, hitAt)];
    sprite.visible = true;
    if (sprite.texture !== f.texture) sprite.texture = f.texture;
    sprite.anchor.set(f.ax, f.ay);
    sprite.scale.set(set.scale * sx * (choice.flip ? -1 : 1), set.scale * sy);
  }
}
