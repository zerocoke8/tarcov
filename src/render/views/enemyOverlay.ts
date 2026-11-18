// 몬스터 머리 위 체력 바와 상위 상태 1개 (HUD ⑬ 간략 전투 상태), 발밑 그림자와 등급 테두리.
// 도형 플레이스홀더와 스프라이트 표시부가 함께 쓴다.
import { BitmapText, Container, Graphics } from 'pixi.js';
import type { Enemy } from '../../game/enemy/Enemy';

const FONT = 'Arial, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const AURA = [0, 0xffc94a, 0xc77dff];

/** 발밑 그림자와 정예·특급 등급 테두리를 root에 깐다 */
export function addEnemyBase(root: Container, e: Enemy): void {
  const r = e.r;
  root.addChild(new Graphics().ellipse(0, 0, r * 1.05, r * 0.42).fill({ color: 0x000000, alpha: 0.35 }));
  if (e.grade.grade > 0) {
    root.addChild(
      new Graphics().ellipse(0, 0, r * 1.5, r * 0.62).stroke({ color: AURA[e.grade.grade] ?? 0xffc94a, width: 3, alpha: 0.9 }),
    );
  }
}

export class EnemyOverlay {
  private bar = new Graphics();
  private status: BitmapText;
  private lastRatio = -1;
  private lastStatus = '';
  private barW: number;

  /** @param top 머리 꼭대기 높이 (월드 px) */
  constructor(root: Container, e: Enemy, top: number) {
    this.barW = Math.max(30, Math.min(110, e.r * 2.4));
    this.bar.y = -top - 10;
    this.bar.visible = false;
    this.status = new BitmapText({
      text: '',
      style: { fontFamily: FONT, fontSize: 26, fontWeight: 'bold', fill: 0xffffff, stroke: { color: 0x15131f, width: 4 } },
    });
    this.status.anchor.set(0.5, 1);
    this.status.scale.set(0.5);
    this.status.y = -top - 13;
    this.status.visible = false;
    root.addChild(this.bar, this.status);
  }

  update(e: Enemy): void {
    const ratio = Math.max(0, e.hp / e.maxHp);
    const show = !e.dead && (e.aggro || ratio < 1);
    this.bar.visible = show;
    if (show && Math.abs(ratio - this.lastRatio) > 0.004) {
      this.lastRatio = ratio;
      const w = this.barW;
      this.bar
        .clear()
        .roundRect(-w / 2 - 1, -1, w + 2, 6, 2)
        .fill({ color: 0x15131f, alpha: 0.85 })
        .roundRect(-w / 2, 0, Math.max(0, w * ratio), 4, 1.5)
        .fill(0xff5a6a);
    }
    const st = e.dead ? '' : e.topStatus();
    if (st !== this.lastStatus) {
      this.lastStatus = st;
      this.status.text = st;
      this.status.visible = st !== '';
    }
  }
}
