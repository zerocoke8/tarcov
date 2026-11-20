// PixiJS 화면 구성: 레이어, 카메라, 공용 텍스처
import { Application, Container, Matrix, Rectangle, RendererType, Texture } from 'pixi.js';
import { clamp } from '../core/math';
import { db } from '../data/tables';
import { moodLook } from './mood';
import { MoodFilter } from './moodFilter';
import { proj, type ViewMode } from './proj';
import { giveBack, hasFresh, takeFresh } from './textures';

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
  /** 화면 분위기 셰이더로 물들이는 묶음 (바닥, 바닥 표시, 오브젝트). 이펙트 층은 이 위에 물들지 않은 채 그려진다 */
  readonly scene = new Container();
  /** 바닥 */
  readonly ground = new Container();
  /** 바닥 위 표시 (범위 효과, 공격 예고, 조준 표시) */
  readonly decals = new Container();
  /** 세로 위치로 앞뒤가 정해지는 것들 (벽, 오브젝트, 캐릭터, 몬스터) */
  readonly objects = new Container();
  /** 바닥과 나란히 눕혀 그리는 이펙트 (퍼지는 고리, 휘두른 궤적). 마름모 화면에서만 바닥처럼 기운다 */
  readonly fxFlat = new Container();
  /** 투사체와 이펙트 */
  readonly fx = new Container();
  tex!: SharedTextures;

  /** punch = 순간 확대 (0.04면 4% 더 크게). 교체 연출이 잠깐 넣었다 뺀다 */
  cam = { x: 0, y: 0, zoom: 1, shake: 0, punch: 0 };
  /** 화면 분위기 셰이더. 처음 쓰일 때 만든다 */
  private mood: MoodFilter | null = null;
  /** 셰이더로 물들일 넓이 = 지금 화면에 보이는 곳 (맵 묶음의 좌표로). 카메라가 움직일 때마다 고친다 */
  private moodArea = new Rectangle();

  private constructor(app: Application) {
    this.app = app;
  }

  static async create(host: HTMLElement): Promise<Stage> {
    const app = new Application();
    const css = Math.max(1, host.clientWidth * host.clientHeight);
    const resolution = Stage.resolutionFor(host);
    await app.init({
      resizeTo: host,
      background: 0x0c0b14,
      // 계단 현상 줄이기(MSAA)는 픽셀마다 여러 번 칠하므로, 픽셀 수가 적은 화면에서만 켠다.
      // 해상도가 높은 화면은 계단이 잘 보이지 않고, 넓은 이펙트를 겹쳐 칠할 때의 부담만 커진다
      antialias: resolution < 1.5 && css <= db.P('view.maxPixels'),
      resolution,
      autoDensity: true,
      powerPreference: 'high-performance',
      // 쓰지 않는 그림을 그래픽 메모리에서 자동으로 내리지 않는다. 기본 설정은 1분 동안 그리지 않은 그림을 내리는데,
      // 그러면 궁극기 전용 그림이나 교체 대기 중인 캐릭터의 시트가 다시 쓰일 때마다 새로 올라가느라 화면이 끊긴다.
      // 그림은 팀이 바뀔 때 직접 정리한다 (sprites.retain)
      gcActive: false,
    });
    host.appendChild(app.canvas);
    const s = new Stage(app);
    // 창 크기가 바뀌면 내부 해상도도 다시 정한다
    window.addEventListener('resize', () => {
      const r = Stage.resolutionFor(host);
      if (Math.abs(r - app.renderer.resolution) < 0.01) return;
      app.renderer.resolution = r;
      app.resize();
    });
    s.objects.sortableChildren = true;
    s.scene.addChild(s.ground, s.decals, s.objects);
    s.world.addChild(s.scene, s.fxFlat, s.fx);
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

  /**
   * 화면에 쓸 내부 해상도 (CSS 1px당 그리는 픽셀 수).
   * 기기의 화소 밀도를 따르되 2를 넘기지 않고, 전체 픽셀 수가 상한(view.maxPixels)을 넘지 않게 낮춘다. 1 아래로는 내리지 않는다.
   */
  static resolutionFor(host: HTMLElement): number {
    const css = Math.max(1, host.clientWidth * host.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return Math.max(1, Math.min(dpr, Math.sqrt(db.P('view.maxPixels') / css)));
  }

  /**
   * 새로 읽은 그림을 그래픽 메모리에 미리 올린다. 올릴 것이 없으면 아무 일도 하지 않는다.
   * 전투 중에 불려도 끊기지 않도록 한 번에 한 장씩만 올린다 (all 이면 남은 것을 모두 올린다. 전투에 들어가기 전에 쓴다).
   */
  uploadTextures(all = false): void {
    if (!hasFresh()) return;
    const list = takeFresh();
    const now = all ? list : list.splice(0, 1);
    for (const tex of now) {
      try {
        this.app.renderer.texture.initSource(tex.source);
      } catch (err) {
        // 올리지 못해도 처음 그릴 때 올라가므로 게임은 그대로 진행한다
        console.warn('그림을 미리 올리지 못했습니다', err);
      }
    }
    // 이번에 올리지 않은 것은 다음 프레임으로 넘긴다
    if (!all) giveBack(list);
  }

  get width(): number {
    return this.app.screen.width;
  }

  get height(): number {
    return this.app.screen.height;
  }

  /**
   * 화면 방식을 고른다 (섹터에 들어갈 때). 바닥에 눕혀 그리는 층들에 그 방식의 변환을 건다.
   * 마름모 화면에서는 그 층들이 통째로 기울어, 그 안에서는 월드 좌표를 그대로 쓰면 된다
   */
  setView(mode: ViewMode): void {
    proj.use(mode);
    const [a, b, c, d] = proj.ground;
    const m = new Matrix(a, b, c, d, 0, 0);
    for (const layer of [this.ground, this.decals, this.fxFlat]) layer.setFromMatrix(m);
    // 마름모 맵은 벽을 칸마다 세워 그리느라 화면에 올라가는 것이 기존 화면의 두 배쯤 된다.
    // 월드를 하나의 그리기 묶음으로 두면, 카메라가 움직일 때 그 모두의 위치를 다시 계산하지 않고 묶음째 옮겨 그린다
    // (재 보니 카메라만 움직이는 프레임의 계산 시간이 9ms 에서 0.1ms 로 줄었다). 기존 화면은 예전 방식 그대로 둔다
    if (proj.iso) this.world.enableRenderGroup();
    else this.world.disableRenderGroup();
  }

  /**
   * 화면 분위기를 고른다 (섹터에 들어갈 때). 그 맵 그림 세트의 분위기가 표에 없거나 세기가 0이면 물들이지 않는다.
   * @param scene 맵 그림 세트 (data/moods.csv 의 scene)
   */
  setMood(scene: string): void {
    // 셰이더는 WebGL 용으로만 써 두었다. 다른 방식으로 그리는 환경에서는 물들이지 않는다
    const look = this.app.renderer.type === RendererType.WEBGL ? moodLook(db.mood(scene), db.pct('mood.strength')) : null;
    if (!look) {
      this.scene.filters = null;
      return;
    }
    this.mood ??= new MoodFilter();
    this.mood.use(look);
    // 물들일 넓이를 화면으로 정해 둔다 (정하지 않으면 매 프레임 맵 전체의 크기를 다시 잰다)
    this.syncMoodArea();
    this.scene.filterArea = this.moodArea;
    this.scene.filters = [this.mood];
  }

  /** 물들일 넓이를 지금 화면에 맞춘다. 넓이는 맵 묶음의 좌표로 적어야 하므로 카메라의 이동·확대를 되돌려 구한다 */
  private syncMoodArea(): void {
    const z = this.world.scale.x || 1;
    this.moodArea.x = -this.world.x / z;
    this.moodArea.y = -this.world.y / z;
    this.moodArea.width = this.width / z;
    this.moodArea.height = this.height / z;
  }

  /** 빛의 중심(필드 캐릭터)을 화면 좌표로 알려 준다 (매 프레임) */
  lightAt(x: number, y: number): void {
    this.mood?.light(x / this.width, y / this.height, this.width / this.height);
  }

  /**
   * 카메라를 화면(월드 층) 좌표 (tx, ty)로 따라가게 한다. snap이면 즉시 이동.
   * @param mapW, mapH 맵의 크기. 카메라가 맵 밖을 비추지 않게 한다. 0이면 가두지 않는다 (마름모 화면)
   */
  updateCamera(tx: number, ty: number, mapW: number, mapH: number, dt: number, snap = false): void {
    const cam = this.cam;
    cam.zoom = (this.height / db.P(proj.iso ? 'view.isoHeight' : 'view.height')) * (1 + cam.punch);
    const viewW = this.width / cam.zoom;
    const viewH = this.height / cam.zoom;
    // 맵이 화면보다 작으면 가운데에 둔다
    const cx = mapW <= 0 ? tx : mapW <= viewW ? mapW / 2 : clamp(tx, viewW / 2, mapW - viewW / 2);
    const cy = mapH <= 0 ? ty : mapH <= viewH ? mapH / 2 : clamp(ty, viewH / 2, mapH - viewH / 2);
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
    if (this.mood) this.syncMoodArea();
  }

  /** 레이어를 비운다 (섹터가 바뀔 때) */
  clear(): void {
    for (const layer of [this.ground, this.decals, this.objects, this.fxFlat, this.fx]) {
      for (const child of layer.removeChildren()) child.destroy({ children: true });
    }
  }
}
