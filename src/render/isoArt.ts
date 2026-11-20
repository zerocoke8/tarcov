// 마름모(아이소메트릭) 맵에만 쓰는 그림: 높은 벽의 앞면 질감과, 벽 위에 서는 구조물(나무·건물·탑).
// 세트마다 public/iso/<세트>/ 에 놓인다 (세트 이름은 맵 그림 세트와 같다). tools/art/iso.mjs 가 만든다 (data/art/iso.csv).
// 없거나 읽지 못하면 null 을 돌려주고, 마름모 맵은 기존 벽 질감만으로 그려진다.
import { Rectangle, Texture } from 'pixi.js';
import { loadTexture } from './textures';

/** [시트 번호, x, y, w, h] */
type Frame = [page: number, x: number, y: number, w: number, h: number];

interface IsoJson {
  version: 1;
  v: string;
  /** 시트 1픽셀이 월드에서 차지하는 크기 */
  scale: number;
  pages: string[];
  face: Frame | null;
  /** 벽 앞면 질감이 가로로 몇 칸마다 되풀이되는지 */
  faceTiles: number;
  structs: { id: string; f: Frame; tw: number; th: number; rate: number; glow?: string }[];
}

export interface IsoStruct {
  id: string;
  texture: Texture;
  /** 월드에서의 크기 (px) */
  w: number;
  h: number;
  /** 차지하는 칸 수 */
  tw: number;
  th: number;
  /** 높은 벽 한 칸마다 이것이 설 확률 (0~1) */
  rate: number;
  /** 빛나는 물체면 그 빛의 색 */
  glow: number | null;
}

export interface IsoArt {
  /**
   * 벽 앞면 질감: 한 칸 너비씩 나눈 것을, 아래에서부터 얼마만큼 쓰는지에 따라 잘라 준다.
   * @param col  몇 번째 칸인지 (이웃 칸과 무늬가 이어진다)
   * @param part 아래에서부터 쓸 비율 (1 = 전체. 낮은 벽은 아랫부분만 쓴다)
   */
  face(col: number, part: number): Texture;
  structs: IsoStruct[];
}

const ROOT = `${import.meta.env.BASE_URL}iso/`;
const TILE = 64;

class IsoArtStore {
  private sets = new Map<string, IsoArt>();
  private loading = new Map<string, Promise<void>>();

  /** 읽어 둔 그림. 아직 없거나 읽지 못했으면 null */
  get(set: string): IsoArt | null {
    return this.sets.get(set) ?? null;
  }

  /** 세트 하나를 읽는다. 여러 번 불러도 한 번만 읽는다 */
  load(set: string): Promise<void> {
    let p = this.loading.get(set);
    if (!p) {
      p = this.read(set).catch((err) => {
        console.warn(`마름모 맵 그림(${set})을 읽지 못해 기존 벽 질감으로 그립니다`, err);
      });
      this.loading.set(set, p);
    }
    return p;
  }

  private async read(set: string): Promise<void> {
    const BASE = `${ROOT}${set}/`;
    const res = await fetch(`${BASE}iso.json`, { cache: 'no-cache' });
    if (!res.ok) return;
    const json = (await res.json()) as IsoJson;
    if (json.version !== 1 || !json.face) return;
    const pages = await Promise.all(json.pages.map((f) => loadTexture(`${BASE}${f}?v=${json.v}`)));
    const f = json.face;
    const cell = TILE / json.scale;
    const cols = Math.max(1, json.faceTiles);
    const cache = new Map<string, Texture>();
    const face = (col: number, part: number): Texture => {
      const c = ((col % cols) + cols) % cols;
      const key = `${c}:${part.toFixed(3)}`;
      let tex = cache.get(key);
      if (!tex) {
        const h = Math.max(2, Math.round(f[4] * Math.min(1, part)));
        // 칸 사이에 틈이 보이지 않도록 가장자리를 반 픽셀 안쪽으로 잡는다
        tex = new Texture({ source: pages[f[0]].source, frame: new Rectangle(f[1] + c * cell + 0.5, f[2] + f[4] - h + 0.5, cell - 1, h - 1) });
        cache.set(key, tex);
      }
      return tex;
    };
    this.sets.set(set, {
      face,
      structs: json.structs.map((s) => ({
        id: s.id,
        texture: new Texture({ source: pages[s.f[0]].source, frame: new Rectangle(s.f[1], s.f[2], s.f[3], s.f[4]) }),
        w: s.f[3] * json.scale,
        h: s.f[4] * json.scale,
        tw: s.tw,
        th: s.th,
        rate: (s.rate ?? 1) / 100,
        glow: s.glow ? parseInt(s.glow.replace('#', ''), 16) : null,
      })),
    });
  }
}

export const isoArt = new IsoArtStore();
