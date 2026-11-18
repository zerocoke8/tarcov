// 그림 파일 읽기. 읽은 그림은 "그래픽 메모리에 미리 올릴 목록"에 넣어 둔다.
//
// 그림은 처음 화면에 그려지는 순간 그래픽 메모리로 올라가는데, 큰 시트(2048px)는 그 한 번이 눈에 띄게 끊긴다.
// 궁극기 전용 그림처럼 드물게 쓰는 것은 전투 한가운데서 그 끊김이 나므로, 읽자마자 미리 올려 둔다 (Stage.uploadTextures).
import { Assets, type Texture } from 'pixi.js';

const fresh: Texture[] = [];

/** 그림을 읽고, 미리 올릴 목록에 넣는다 */
export async function loadTexture(url: string): Promise<Texture> {
  const tex = await Assets.load<Texture>(url);
  fresh.push(tex);
  return tex;
}

/** 아직 그래픽 메모리에 올리지 않은 그림들을 꺼낸다 (꺼낸 것은 목록에서 빠진다) */
export function takeFresh(): Texture[] {
  return fresh.splice(0);
}

/** 미리 올릴 그림이 남아 있는지 */
export function hasFresh(): boolean {
  return fresh.length > 0;
}

/** 꺼냈지만 아직 올리지 않은 그림을 목록 앞쪽에 되돌려 놓는다 */
export function giveBack(list: Texture[]): void {
  fresh.unshift(...list);
}
