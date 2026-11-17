// PixiJS 화면 구성: 레이어, 카메라, 공용 텍스처
import { Application, Container, Texture } from 'pixi.js';
import { clamp } from '../core/math';
import { db } from '../data/tables';

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  return Texture.from(c);
}

export interface SharedTextures {
  /** 채워진 원 (반지름 64 기준) */
  disc: Texture;
  /** 원 테두리 (반지름 64 기준) */
  ring: Texture;
  /** 부드러운 빛 번짐 */
  glow: Texture;
  /** 작은 점 */
  dot: Texture;
}

export class Stage {
  readonly app: Application;
  /** 카메라가 적용되는 월드 전체 */
  readonly world = new Container();
  /** 바닥 */
  readonly ground = new Container();
  /** 바닥 위 표시 (범위 효과, 공격 예고, 조준 표시) */
  readonly decals = new Container();
  /** 세로 위치로 앞뒤가 정해지는 것들 (벽, 오브젝트, 캐릭터, 몬스터) */
  readonly objects = new Container();
  /** 투사체와 이펙트 */
  readonly fx = new Container();
  tex!: SharedTextures;

  cam = { x: 0, y: 0, zoom: 1, shake: 0 };

  private constructor(app: Application) {
    this.app = app;
  }

  static async create(host: HTMLElement): Promise<Stage> {
    const app = new Application();
    await app.init({
      resizeTo: host,
      background: 0x0c0b14,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      powerPreference: 'high-performance',
    });
    host.appendChild(app.canvas);
    const s = new Stage(app);
    s.objects.sortableChildren = true;
    s.world.addChild(s.ground, s.decals, s.objects, s.fx);
    app.stage.addChild(s.world);
    s.tex = {
      disc: canvasTexture(128, (c, n) => {
        c.fillStyle = '#fff';
        c.beginPath();
        c.arc(n / 2, n / 2, n / 2 - 1, 0, Math.PI * 2);
        c.fill();
      }),
      ring: canvasTexture(128, (c, n) => {
        c.strokeStyle = '#fff';
        c.lineWidth = 5;
        c.beginPath();
        c.arc(n / 2, n / 2, n / 2 - 4, 0, Math.PI * 2);
        c.stroke();
      }),
      glow: canvasTexture(128, (c, n) => {
        const g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.4, 'rgba(255,255,255,0.45)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, n, n);
      }),
      dot: canvasTexture(16, (c, n) => {
        c.fillStyle = '#fff';
        c.beginPath();
        c.arc(n / 2, n / 2, n / 2 - 1, 0, Math.PI * 2);
        c.fill();
      }),
    };
    return s;
  }

  get width(): number {
    return this.app.screen.width;
  }

  get height(): number {
    return this.app.screen.height;
  }

  /** 카메라를 (tx, ty)로 따라가게 한다. snap이면 즉시 이동 */
  updateCamera(tx: number, ty: number, mapW: number, mapH: number, dt: number, snap = false): void {
    const cam = this.cam;
    cam.zoom = this.height / db.P('view.height');
    const viewW = this.width / cam.zoom;
    const viewH = this.height / cam.zoom;
    // 맵이 화면보다 작으면 가운데에 둔다
    const cx = mapW <= viewW ? mapW / 2 : clamp(tx, viewW / 2, mapW - viewW / 2);
    const cy = mapH <= viewH ? mapH / 2 : clamp(ty, viewH / 2, mapH - viewH / 2);
    const k = snap ? 1 : Math.min(1, dt * 7);
    cam.x += (cx - cam.x) * k;
    cam.y += (cy - cam.y) * k;
    let sx = 0;
    let sy = 0;
    if (cam.shake > 0.1) {
      sx = (Math.random() * 2 - 1) * cam.shake;
      sy = (Math.random() * 2 - 1) * cam.shake;
      cam.shake *= Math.max(0, 1 - dt * 10);
    } else cam.shake = 0;
    this.world.scale.set(cam.zoom);
    this.world.position.set(
      Math.round(this.width / 2 - cam.x * cam.zoom + sx),
      Math.round(this.height / 2 - cam.y * cam.zoom + sy),
    );
  }

  /** 레이어를 비운다 (섹터가 바뀔 때) */
  clear(): void {
    for (const layer of [this.ground, this.decals, this.objects, this.fx]) {
      for (const child of layer.removeChildren()) child.destroy({ children: true });
    }
  }
}
