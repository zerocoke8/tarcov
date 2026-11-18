// 화면(UI)에 쓰는 그림 파일의 주소. src/assets/ 아래의 그림을 빌드할 때 함께 묶는다.
// 그림은 tools/art/ui.mjs 가 만든다. 아직 없는 그림은 null 이 돌아오고, 부르는 쪽에서 도형 아이콘으로 대신한다.
const files = import.meta.glob<string>('../assets/**/*.webp', { eager: true, query: '?url', import: 'default' });

const byName = new Map(Object.entries(files).map(([path, url]) => [path.replace('../assets/', '').replace(/\.webp$/, ''), url]));

/** @param name 확장자를 뺀 경로. 예: 'portraits/serin', 'ui/icon_attack' */
export function asset(name: string): string | null {
  return byName.get(name) ?? null;
}

/** 그림이 있으면 <img> 태그를, 없으면 대신할 내용을 돌려준다 */
export function assetImg(name: string, fallback: string, cls = 'art-img'): string {
  const url = asset(name);
  return url ? `<img class="${cls}" src="${url}" alt="" draggable="false">` : fallback;
}
