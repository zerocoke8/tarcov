// 화면이 확대되지 않게 막는다.
//
// 아이폰 사파리는 뷰포트 설정의 user-scalable=no 를 따르지 않는다 (iOS 10부터, 접근성 때문에). 그래서 게임 중에
//  - 두 엄지로 D패드와 버튼을 함께 누른 채 움직이면 "두 손가락 벌리기"로,
//  - 버튼을 빠르게 거듭 누르면 "두 번 두드리기"로 받아들여 화면을 확대하고,
//  - 한곳을 길게 누르고 있으면 글자를 고를 때 쓰는 돋보기를 띄우는 일이 있다.
// CSS 의 touch-action 으로도 막아 두었지만(styles/main.css) 그것만으로는 새는 경우가 있어, 터치 이벤트에서 직접 막는다.
// 조작은 포인터 이벤트로 받으므로(input/Input.ts) 여기서 터치의 기본 동작을 막아도 조작에는 영향이 없다.

/** closest 만 있으면 되는 요소 (화면 없이 검사할 수 있게) */
interface Target {
  closest(selector: string): unknown;
}

/** 누르고 있거나 빠르게 거듭 누르는 조작부. 포인터 이벤트로 받으므로 터치의 기본 동작(클릭 포함)이 필요 없다 */
const HELD = '#stage, .dpad, .btn, .swap-card, .interact, .auto-btn';

/**
 * 이 자리에서 시작한 터치의 기본 동작을 막아도 되는지.
 * 전투 화면(캔버스)과 HUD 의 조작부, HUD 의 버튼이 아닌 곳은 막는다.
 * 클릭으로 받는 버튼(팀 정보, 일시정지, 미니맵)과 메뉴 창은 막지 않는다: 막으면 클릭이 생기지 않고, 목록을 끌어 넘길 수 없다.
 */
export function isHeldControl(target: Target | null): boolean {
  if (!target || typeof target.closest !== 'function') return false;
  if (target.closest(HELD)) return true;
  return !!target.closest('.hud') && !target.closest('button');
}

/** 한 번만 부른다 (게임을 시작할 때) */
export function blockZoom(doc: Document = document): void {
  const stop = (e: Event): void => {
    if (e.cancelable) e.preventDefault();
  };
  // 두 손가락 벌리기 (사파리 전용 이벤트. 다른 브라우저에는 없어 아무 일도 하지 않는다)
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) doc.addEventListener(type, stop, { passive: false });
  // 손가락 둘 이상이 닿은 채 움직일 때: 어디에서든 확대로 이어지지 않게 한다
  doc.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length > 1) stop(e);
    },
    { passive: false },
  );
  // 조작부에서 시작한 터치: 두 번 두드리기 확대와 길게 누를 때의 돋보기를 막는다.
  // 손가락이 몇 개 닿아 있는지는 보지 않는다: D패드를 누른 채 일시정지 같은 클릭 버튼을 눌러도 그 클릭은 살아 있어야 한다
  doc.addEventListener(
    'touchstart',
    (e) => {
      if (isHeldControl(e.target as Target | null)) stop(e);
    },
    { passive: false },
  );
}
