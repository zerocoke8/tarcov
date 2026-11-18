// 스프라이트 시트를 읽어 들이고 보관한다.
// public/sprites/index.json 에 적힌 캐릭터·몬스터만 스프라이트로 그리고, 없는 것은 도형 플레이스홀더로 남는다.
import { Assets, Rectangle, Texture } from 'pixi.js';
import type { ClipData, Dir8, FrameData, SheetData } from './select';

export interface SpriteFrame {
  texture: Texture;
  /** 발밑 기준점 (프레임 크기에 대한 비율. 0~1 밖일 수 있다) */
  ax: number;
  ay: number;
}

export interface SpriteClip extends Omit<ClipData, 'dirs'> {
  dirs: Partial<Record<Dir8, SpriteFrame[]>>;
  /** 그림이 있는 방향 목록 */
  available: Dir8[];
}

export interface SpriteSet {
  id: string;
  kind: 'char' | 'monster';
  scale: number;
  height: number;
  mirror: boolean;
  clips: Record<string, SpriteClip>;
  /** 내려받은 시트 주소 (해제할 때 쓴다) */
  urls: string[];
}

interface IndexEntry {
  kind: 'char' | 'monster';
  /** 내용이 바뀌면 달라지는 값. 주소 뒤에 붙여 예전 파일이 캐시에서 나오지 않게 한다 */
  v: string;
}

const BASE = `${import.meta.env.BASE_URL}sprites/`;

class SpriteStore {
  private index: Record<string, IndexEntry> | null = null;
  private indexLoading: Promise<void> | null = null;
  private sets = new Map<string, SpriteSet>();
  private loading = new Map<string, Promise<void>>();

  /** 스프라이트 목록을 읽는다. 목록이 없거나 깨졌으면 전부 플레이스홀더로 그린다 */
  private loadIndex(): Promise<void> {
    this.indexLoading ??= fetch(`${BASE}index.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, IndexEntry>>) : {}))
      .catch(() => ({}))
      .then((idx) => {
        this.index = idx;
      });
    return this.indexLoading;
  }

  /** 이미 읽어 둔 스프라이트. 없으면 null (플레이스홀더를 쓴다) */
  get(id: string): SpriteSet | null {
    return this.sets.get(id) ?? null;
  }

  /** 스프라이트가 준비된 몬스터 id 전부 */
  async monsterIds(): Promise<string[]> {
    await this.loadIndex();
    return Object.entries(this.index ?? {})
      .filter(([, e]) => e.kind === 'monster')
      .map(([id]) => id);
  }

  /** ids 가운데 스프라이트가 있는 것을 모두 읽어 둔다. 실패한 것은 플레이스홀더로 남는다 */
  async ensure(ids: Iterable<string>): Promise<void> {
    await this.loadIndex();
    const jobs: Promise<void>[] = [];
    for (const id of new Set(ids)) {
      const entry = this.index?.[id];
      if (!entry || this.sets.has(id)) continue;
      let job = this.loading.get(id);
      if (!job) {
        job = this.loadSet(id, entry)
          .catch((err) => console.warn(`스프라이트를 읽지 못했습니다: ${id}`, err))
          .finally(() => this.loading.delete(id));
        this.loading.set(id, job);
      }
      jobs.push(job);
    }
    await Promise.all(jobs);
  }

  /** 지금 쓰지 않는 캐릭터 스프라이트를 메모리에서 내린다 (몬스터는 여러 섹터에서 계속 쓰므로 둔다) */
  retain(ids: Iterable<string>): void {
    const keep = new Set(ids);
    for (const [id, set] of this.sets) {
      if (set.kind !== 'char' || keep.has(id)) continue;
      this.sets.delete(id);
      for (const clip of Object.values(set.clips)) {
        for (const frames of Object.values(clip.dirs)) for (const f of frames ?? []) f.texture.destroy(false);
      }
      for (const url of set.urls) void Assets.unload(url);
    }
  }

  private async loadSet(id: string, entry: IndexEntry): Promise<void> {
    const dir = `${BASE}${id}/`;
    const res = await fetch(`${dir}sheet.json?v=${entry.v}`);
    if (!res.ok) throw new Error(`sheet.json ${res.status}`);
    const data = (await res.json()) as SheetData;
    if (data.version !== 1) throw new Error(`지원하지 않는 시트 버전: ${String(data.version)}`);
    const urls = data.pages.map((p) => `${dir}${p}?v=${entry.v}`);
    const pages = await Promise.all(urls.map((u) => Assets.load<Texture>(u)));

    const clips: Record<string, SpriteClip> = {};
    for (const [name, clip] of Object.entries(data.clips)) {
      const dirs: Partial<Record<Dir8, SpriteFrame[]>> = {};
      for (const [d, frames] of Object.entries(clip.dirs) as [Dir8, FrameData[]][]) {
        dirs[d] = frames.map(([page, x, y, w, h, ax, ay]) => ({
          texture: new Texture({ source: pages[page].source, frame: new Rectangle(x, y, w, h) }),
          ax: ax / w,
          ay: ay / h,
        }));
      }
      const available = Object.keys(dirs) as Dir8[];
      if (available.length) clips[name] = { loop: clip.loop, fps: clip.fps, impact: clip.impact, dirs, available };
    }
    this.sets.set(id, { id, kind: data.kind, scale: data.scale, height: data.height, mirror: data.mirror, clips, urls });
  }
}

export const sprites = new SpriteStore();
