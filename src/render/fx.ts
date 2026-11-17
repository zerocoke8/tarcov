// 일회성 이펙트 (베기 궤적, 폭발, 번개, 피해 숫자). 규칙 코드의 FxApi 요청을 화면에 그린다.
import { BitmapText, Container, Graphics, Sprite } from 'pixi.js';
import type { FxApi, NumKind } from '../game/entities';
import type { Stage } from './Stage';

interface FxItem {
  obj: Container;
  t: number;
  dur: number;
  step: (k: number, obj: Container, dt: number) => void;
  pooled?: BitmapText[];
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

export class Fx implements FxApi {
  private items: FxItem[] = [];
  private numPool: BitmapText[] = [];

  constructor(private stage: Stage) {}

  private add(obj: Container, dur: number, step: FxItem['step'], layer: Container = this.stage.fx): FxItem {
    layer.addChild(obj);
    const item: FxItem = { obj, t: 0, dur, step };
    this.items.push(item);
    step(0, obj, 0);
    return item;
  }

  update(dt: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      const k = Math.min(1, it.t / it.dur);
      it.step(k, it.obj, dt);
      if (k >= 1) {
        this.items.splice(i, 1);
        it.obj.removeFromParent();
        if (it.pooled) it.pooled.push(it.obj as BitmapText);
        else it.obj.destroy();
      }
    }
  }

  clear(): void {
    for (const it of this.items) {
      it.obj.removeFromParent();
      if (it.pooled) it.pooled.push(it.obj as BitmapText);
      else it.obj.destroy();
    }
    this.items.length = 0;
  }

  slash(x: number, y: number, angle: number, reach: number, arc: number, color: number, heavy = false): void {
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
    g.position.set(x, y - 24);
    g.rotation = angle;
    this.add(g, heavy ? 0.26 : 0.18, (k, o) => {
      o.alpha = 1 - k * k;
      o.scale.set(0.85 + k * 0.2);
    });
  }

  ring(x: number, y: number, r: number, color: number, dur = 0.35): void {
    const s = new Sprite(this.stage.tex.ring);
    s.anchor.set(0.5);
    s.tint = color;
    s.position.set(x, y);
    this.add(s, dur, (k, o) => {
      o.alpha = 1 - k;
      o.scale.set(((0.25 + 0.75 * (1 - (1 - k) * (1 - k))) * r) / 60);
    });
  }

  blast(x: number, y: number, r: number, color: number, dur = 0.3): void {
    const s = new Sprite(this.stage.tex.disc);
    s.anchor.set(0.5);
    s.tint = color;
    s.position.set(x, y);
    s.blendMode = 'add';
    this.add(s, dur, (k, o) => {
      o.alpha = 0.55 * (1 - k);
      o.scale.set(((0.6 + 0.4 * k) * r) / 63);
    });
  }

  sparks(x: number, y: number, color: number, count = 5): void {
    for (let i = 0; i < count; i++) {
      const s = new Sprite(this.stage.tex.dot);
      s.anchor.set(0.5);
      s.tint = color;
      s.position.set(x, y);
      const a = Math.random() * Math.PI * 2;
      const v = 60 + Math.random() * 160;
      const vx = Math.cos(a) * v;
      const vy = Math.sin(a) * v - 40;
      const size = 0.25 + Math.random() * 0.4;
      this.add(s, 0.3 + Math.random() * 0.2, (k, o, dt) => {
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

  bolt(x1: number, y1: number, x2: number, y2: number, color: number): void {
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
    const g = new Graphics();
    this.jagged(g, x + (Math.random() * 60 - 30), y - 420, x, y, 16);
    g.stroke({ color, width: 6, alpha: 0.85 });
    this.jagged(g, x, y - 420, x, y, 8);
    g.stroke({ color: 0xffffff, width: 2 });
    this.add(g, 0.2, (k, o) => {
      o.alpha = 1 - k;
    });
  }

  /** 위에서 떨어지는 짧은 줄기 (화살비 등). 표시 전용 */
  streak(x: number, y: number, color: number): void {
    const g = new Graphics().moveTo(0, -46).lineTo(0, 0).stroke({ color, width: 2.5, alpha: 0.9 });
    g.position.set(x, y);
    this.add(g, 0.16, (k, o) => {
      o.y = y - 70 * (1 - k);
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
    return t;
  }

  number(x: number, y: number, value: number, kind: NumKind): void {
    const st = NUM_STYLE[kind];
    const t = this.text(st.prefix + value, st.size, st.color);
    const ox = (Math.random() * 2 - 1) * 14;
    const base = st.size / 32;
    const item = this.add(t, kind === 'crit' ? 0.75 : 0.6, (k, o) => {
      o.position.set(x + ox, y - 34 * (1 - (1 - k) * (1 - k)));
      o.alpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      o.scale.set(base * (k < 0.15 ? 1.5 - k * 3.3 : 1));
    });
    item.pooled = this.numPool;
  }

  label(x: number, y: number, str: string, color: number): void {
    const t = this.text(str, 22, color);
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
