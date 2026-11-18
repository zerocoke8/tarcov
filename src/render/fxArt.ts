// 이펙트 그림(조각, 플립북)을 읽어 들이고 보관한다.
// public/fx/fx.json 이 없거나 읽지 못하면 null 을 돌려주고, 이펙트는 도형으로 그려진다.
// 그림은 tools/art/fx.mjs 가 만든다 (data/art/fx.csv, fx_flips.csv).
import { Rectangle, Texture } from 'pixi.js';
import { loadTexture } from './textures';

/** [시트 번호, x, y, w, h] */
type Frame = [page: number, x: number, y: number, w: number, h: number];

interface FxJson {
  version: 1;
  v: string;
  /** 조각 시트 1픽셀이 월드에서 차지하는 크기 */
  scale: number;
  pages: string[];
  pieces: Record<string, { f: Frame; core?: Frame; color?: 1; glow?: 1 }>;
  flips: Record<string, { play: number; size: number; frames: Frame[] }>;
}

/** 그림 한 장짜리 이펙트 조각. 게임이 크기·회전·투명도·색을 움직여 쓴다 */
export interface FxPiece {
  tex: Texture;
  /** 가장 밝은 부분만 남긴 흰 그림. 색을 입힌 조각 위에 겹쳐 가운데가 하얗게 타 보이게 한다 */
  core: Texture | null;
  /** 색이 이미 들어 있는 조각 (색을 입히지 않고 그대로 그린다) */
  colored: boolean;
  /** 색이 들어 있는 빛 (검은 배경에서 뽑은 것). 더하기로 합성한다 */
  glow: boolean;
  /** 긴 변의 길이 (시트 px). 원하는 크기로 맞출 때 쓴다 */
  long: number;
}

/** 영상에서 뽑은 여러 장짜리 이펙트 */
export interface FxFlip {
  frames: Texture[];
  /** 한 프레임의 한 변이 월드에서 차지하는 기본 크기 (px) */
  size: number;
  /** 기본 재생 시간 (초) */
  play: number;
}

export interface FxArt {
  pieces: Record<string, FxPiece>;
  flips: Record<string, FxFlip>;
}

const BASE = `${import.meta.env.BASE_URL}fx/`;

class FxArtStore {
  private data: FxArt | null = null;
  private loading: Promise<void> | null = null;

  /** 읽어 둔 이펙트 그림. 아직 없거나 읽지 못했으면 null (도형으로 그린다) */
  get(): FxArt | null {
    return this.data;
  }

  piece(id: string): FxPiece | null {
    return this.data?.pieces[id] ?? null;
  }

  flip(id: string): FxFlip | null {
    return this.data?.flips[id] ?? null;
  }

  /** 이펙트 그림을 읽는다. 여러 번 불러도 한 번만 읽는다 */
  load(): Promise<void> {
    this.loading ??= this.read().catch((err) => {
      console.warn('이펙트 그림을 읽지 못해 도형으로 그립니다', err);
    });
    return this.loading;
  }

  private async read(): Promise<void> {
    const res = await fetch(`${BASE}fx.json`, { cache: 'no-cache' });
    if (!res.ok) return;
    const json = (await res.json()) as FxJson;
    if (json.version !== 1 || !json.pages?.length) return;
    const pages = await Promise.all(json.pages.map((f) => loadTexture(`${BASE}${f}?v=${json.v}`)));
    const tex = (f: Frame): Texture => new Texture({ source: pages[f[0]].source, frame: new Rectangle(f[1], f[2], f[3], f[4]) });
    const pieces: Record<string, FxPiece> = {};
    for (const [id, p] of Object.entries(json.pieces)) {
      pieces[id] = { tex: tex(p.f), core: p.core ? tex(p.core) : null, colored: !!p.color, glow: !!p.glow, long: Math.max(p.f[3], p.f[4]) };
    }
    const flips: Record<string, FxFlip> = {};
    for (const [id, fl] of Object.entries(json.flips ?? {})) {
      if (fl.frames.length) flips[id] = { frames: fl.frames.map(tex), size: fl.size, play: fl.play };
    }
    this.data = { pieces, flips };
  }
}

export const fxArt = new FxArtStore();
