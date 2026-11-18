// 맵 그림(바닥·지붕·벽 질감, 엄폐 오브젝트, 상호작용 오브젝트, 벽·바닥 장식)을 읽어 들이고 보관한다.
// 세트(한 가지 분위기의 맵 그림 한 벌)마다 public/scenery/<세트>/ 에 놓인다.
// public/scenery/<세트>/scenery.json 이 없거나 읽지 못하면 null 을 돌려주고, 맵은 도형으로 그려진다.
// 그림은 tools/art/scenery.mjs 가 만든다 (data/art/scenery.csv).
import { Rectangle, Texture } from 'pixi.js';
import { loadTexture } from './textures';

/** [시트 번호, x, y, w, h] */
type Frame = [page: number, x: number, y: number, w: number, h: number];

interface ItemJson {
  id: string;
  f: Frame;
  glow?: string;
  opt?: string;
}

interface SceneryJson {
  version: 1;
  v: string;
  /** 시트 1픽셀이 월드에서 차지하는 크기 */
  scale: number;
  ground: string;
  pages: string[];
  roof: Frame;
  wall: Frame;
  props: Record<string, ItemJson[]>;
  things: Record<string, ItemJson>;
  wallDecals: ItemJson[];
  floorDecals: ItemJson[];
  road?: ItemJson[];
  roadChance?: number;
  edge?: string;
  void?: string;
}

export interface SceneryItem {
  id: string;
  texture: Texture;
  /** 월드에서의 크기 (px) */
  w: number;
  h: number;
  /** 빛나는 물체면 그 빛의 색 */
  glow: number | null;
  /** 'stand' = 바닥에 눕지 않고 세워서 그린다 (문, 버섯) */
  opt: string;
}

export interface Scenery {
  /** 화면 전체에 반복해 까는 바닥 질감과, 한 장이 월드에서 차지하는 크기 */
  ground: Texture;
  groundSize: number;
  /** 지붕 질감을 칸 크기로 나눈 것 [세로][가로]. 칸 좌표를 이 크기로 나눈 나머지 번째를 쓰면 이웃 칸과 무늬가 이어진다 */
  roof: Texture[][];
  /** 벽 앞면 질감을 칸 너비로 나눈 것 */
  wall: Texture[];
  /** 엄폐 오브젝트. 키는 "종류:가로x세로" (예: "crate:1x1") */
  props: Record<string, SceneryItem[]>;
  things: Record<string, SceneryItem>;
  wallDecals: SceneryItem[];
  floorDecals: SceneryItem[];
  /** 길(통로 칸)에 까는 조각과, 통로 칸마다 깔릴 확률 */
  road: SceneryItem[];
  roadChance: number;
  /** 지붕 가장자리의 색, 맵 바깥의 색 */
  edge: number;
  voidColor: number;
}

const ROOT = `${import.meta.env.BASE_URL}scenery/`;
const TILE = 64;

class SceneryStore {
  private sets = new Map<string, Scenery>();
  private loading = new Map<string, Promise<void>>();
  /** 지금 화면에 쓰는 세트 */
  current = 'alley';

  /** 읽어 둔 맵 그림. 아직 없거나 읽지 못했으면 null (도형으로 그린다) */
  get(set = this.current): Scenery | null {
    return this.sets.get(set) ?? null;
  }

  /** 지금 화면에 쓸 세트를 고른다 (섹터에 들어갈 때) */
  use(set: string): void {
    this.current = set;
  }

  /** 세트 하나를 읽는다. 여러 번 불러도 한 번만 읽는다 */
  load(set = this.current): Promise<void> {
    let p = this.loading.get(set);
    if (!p) {
      p = this.read(set).catch((err) => {
        console.warn(`맵 그림(${set})을 읽지 못해 도형으로 그립니다`, err);
      });
      this.loading.set(set, p);
    }
    return p;
  }

  private async read(set: string): Promise<void> {
    const BASE = `${ROOT}${set}/`;
    const res = await fetch(`${BASE}scenery.json`, { cache: 'no-cache' });
    if (!res.ok) return;
    const json = (await res.json()) as SceneryJson;
    if (json.version !== 1 || !json.roof || !json.wall) return;
    const q = `?v=${json.v}`;
    // 바닥은 반복해 까는 질감이므로 읽을 때 반복 설정을 함께 한다
    const [ground, ...pages] = await Promise.all([json.ground, ...json.pages].map((f, i) => loadTexture(`${BASE}${f}${q}`, i === 0)));

    const sub = (f: Frame, x: number, y: number, w: number, h: number): Texture =>
      // 칸 사이에 틈이 보이지 않도록 가장자리를 반 픽셀 안쪽으로 잡는다
      new Texture({ source: pages[f[0]].source, frame: new Rectangle(f[1] + x + 0.5, f[2] + y + 0.5, w - 1, h - 1) });
    const item = (it: ItemJson): SceneryItem => ({
      id: it.id,
      texture: new Texture({ source: pages[it.f[0]].source, frame: new Rectangle(it.f[1], it.f[2], it.f[3], it.f[4]) }),
      w: it.f[3] * json.scale,
      h: it.f[4] * json.scale,
      glow: it.glow ? parseInt(it.glow.replace('#', ''), 16) : null,
      opt: it.opt ?? '',
    });

    const cell = TILE / json.scale;
    const roofN = Math.max(1, Math.floor(json.roof[3] / cell));
    const roof: Texture[][] = [];
    for (let y = 0; y < roofN; y++) {
      roof.push([]);
      for (let x = 0; x < roofN; x++) roof[y].push(sub(json.roof, x * cell, y * cell, cell, cell));
    }
    const wallN = Math.max(1, Math.floor(json.wall[3] / cell));
    const wall: Texture[] = [];
    for (let x = 0; x < wallN; x++) wall.push(sub(json.wall, x * cell, 0, cell, json.wall[4]));

    const hex = (v: string | undefined, d: number): number => (v ? parseInt(v.replace('#', ''), 16) : d);
    this.sets.set(set, {
      ground,
      groundSize: ground.width * json.scale,
      roof,
      wall,
      props: Object.fromEntries(Object.entries(json.props).map(([k, list]) => [k, list.map(item)])),
      things: Object.fromEntries(Object.entries(json.things).map(([k, it]) => [k, item(it)])),
      wallDecals: json.wallDecals.map(item),
      floorDecals: json.floorDecals.map(item),
      road: (json.road ?? []).map(item),
      roadChance: json.roadChance ?? 0,
      edge: hex(json.edge, 0x5a5d80),
      voidColor: hex(json.void, 0x0b0a14),
    });
  }
}

export const scenery = new SceneryStore();
