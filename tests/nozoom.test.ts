// 화면 확대 막기 검사: 어떤 터치의 기본 동작을 막고 어떤 것은 그대로 두는지.
// (사파리는 뷰포트의 확대 금지 설정을 따르지 않아 터치 이벤트에서 직접 막는다. 화면 없이 흉내 낸 요소로 검사한다)
import { describe, expect, it } from 'vitest';
import { blockZoom, isHeldControl } from '../src/input/noZoom';

/** 자기와 조상이 가진 선택자 목록으로 closest 를 흉내 낸 요소. 쉼표로 나열한 선택자 가운데 하나라도 맞으면 찾은 것으로 본다 */
function el(...chain: string[]): { closest(selector: string): unknown } {
  return {
    closest(selector: string) {
      return selector.split(',').some((s) => chain.includes(s.trim())) ? {} : null;
    },
  };
}

interface FakeEvent {
  cancelable: boolean;
  prevented: boolean;
  target: unknown;
  touches: unknown[];
  preventDefault(): void;
}

function event(target: unknown, touches = 1, cancelable = true): FakeEvent {
  return {
    cancelable,
    prevented: false,
    target,
    touches: Array.from({ length: touches }),
    preventDefault() {
      this.prevented = true;
    },
  };
}

/** blockZoom 이 건 처리기를 이름별로 모은다 */
function hooked(): { fire(type: string, e: FakeEvent): FakeEvent; passive: Record<string, unknown> } {
  const handlers: Record<string, (e: FakeEvent) => void> = {};
  const passive: Record<string, unknown> = {};
  const doc = {
    addEventListener(type: string, fn: (e: FakeEvent) => void, opts?: { passive?: boolean }) {
      handlers[type] = fn;
      passive[type] = opts?.passive;
    },
  };
  blockZoom(doc as unknown as Document);
  return {
    passive,
    fire(type, e) {
      handlers[type](e);
      return e;
    },
  };
}

describe('화면 확대 막기', () => {
  it('전투 화면과 누르고 있는 조작부에서 시작한 터치는 기본 동작을 막는다', () => {
    expect(isHeldControl(el('canvas', '#stage'))).toBe(true);
    expect(isHeldControl(el('.dpad-knob', '.dpad', '.hud'))).toBe(true);
    expect(isHeldControl(el('.btn-icon', '.btn', 'button', '.hud'))).toBe(true);
    expect(isHeldControl(el('.swap-card', 'button', '.hud'))).toBe(true);
    expect(isHeldControl(el('.interact', 'button', '.hud'))).toBe(true);
    // HUD 의 버튼이 아닌 곳 (팀 상태, 섹터 목표 등)
    expect(isHeldControl(el('.quest', '.hud'))).toBe(true);
  });

  it('클릭으로 받는 버튼과 메뉴 창은 막지 않는다 (막으면 클릭이 생기지 않고 목록을 끌어 넘길 수 없다)', () => {
    expect(isHeldControl(el('.pause-btn', 'button', '.hud'))).toBe(false);
    expect(isHeldControl(el('.info-btn', 'button', '.hud'))).toBe(false);
    expect(isHeldControl(el('canvas', '.minimap', 'button', '.hud'))).toBe(false);
    expect(isHeldControl(el('.card', 'button', '.overlay'))).toBe(false);
    expect(isHeldControl(el('.deck-list', '.screen'))).toBe(false);
    expect(isHeldControl(null)).toBe(false);
  });

  it('두 손가락 벌리기(사파리의 gesture 이벤트)는 어디에서든 막는다', () => {
    const h = hooked();
    for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
      expect(h.fire(type, event(el('.card', 'button', '.overlay'))).prevented, type).toBe(true);
      // 기본 동작을 막으려면 수동(passive)이 아니어야 한다
      expect(h.passive[type]).toBe(false);
    }
  });

  it('손가락 둘 이상이 닿은 채 움직이면 막고, 한 손가락으로 끄는 것(목록 넘기기)은 그대로 둔다', () => {
    const h = hooked();
    expect(h.fire('touchmove', event(el('.deck-list', '.screen'), 2)).prevented).toBe(true);
    expect(h.fire('touchmove', event(el('.deck-list', '.screen'), 1)).prevented).toBe(false);
    expect(h.passive.touchmove).toBe(false);
  });

  it('조작부를 누르면 막고, D패드를 누른 채 누른 클릭 버튼은 막지 않는다', () => {
    const h = hooked();
    expect(h.fire('touchstart', event(el('.btn', 'button', '.hud'))).prevented).toBe(true);
    expect(h.fire('touchstart', event(el('.dpad', '.hud'), 2)).prevented).toBe(true);
    // 손가락이 이미 하나 닿아 있어도(D패드) 일시정지 버튼의 클릭은 살아 있어야 한다
    expect(h.fire('touchstart', event(el('.pause-btn', 'button', '.hud'), 2)).prevented).toBe(false);
    expect(h.fire('touchstart', event(el('.card', 'button', '.overlay'))).prevented).toBe(false);
    expect(h.passive.touchstart).toBe(false);
  });

  it('막을 수 없는 이벤트(이미 화면이 움직이는 중)에는 손대지 않는다', () => {
    const h = hooked();
    expect(h.fire('touchmove', event(el('#stage'), 2, false)).prevented).toBe(false);
  });
});
