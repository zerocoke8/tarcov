// HTML 오버레이 UI를 만들 때 쓰는 작은 도우미

/** HTML 문자열로 요소 하나를 만든다 */
export function el<T extends HTMLElement = HTMLElement>(html: string): T {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as T;
}

export function q<T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`UI 요소를 찾을 수 없습니다: ${selector}`);
  return found;
}

/** 값이 바뀔 때만 DOM을 건드리게 해 주는 캐시 */
export class Cache {
  private values = new Map<string, unknown>();

  /** 이전 값과 다르면 true를 돌려주고 새 값을 기억한다 */
  changed(key: string, value: unknown): boolean {
    if (this.values.get(key) === value) return false;
    this.values.set(key, value);
    return true;
  }

  clear(): void {
    this.values.clear();
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
