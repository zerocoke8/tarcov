// 조작 입력의 형태. 터치·키보드 등 실제 입력 장치는 src/input/ 에서 이 형태로 바꿔 넘겨준다.

export type InputAction =
  | { type: 'dodge' }
  | { type: 'active' }
  | { type: 'ult' }
  | { type: 'pet' }
  | { type: 'interact' }
  | { type: 'swap'; index: number };

export interface InputState {
  /** 이동 방향 (단위 벡터). 터치 패드는 누른 방향 그대로, 키보드는 8방향이다. dirActive가 false면 0 */
  dirX: number;
  dirY: number;
  dirActive: boolean;
  /**
   * 방향이 터치 패드에서 왔는지 (화면에서 가리킨 방향 그대로다). 키보드면 false.
   * 마름모 화면에서 화면 방향을 월드 방향으로 바꾸는 방식이 다르다 (Game.worldInput)
   */
  dirFree: boolean;
  /** 공격 버튼을 누르고 있는지 */
  attack: boolean;
  /** 이번 프레임에 눌린 버튼들. 처리한 쪽에서 비운다 */
  actions: InputAction[];
}

export function emptyInput(): InputState {
  return { dirX: 0, dirY: 0, dirActive: false, dirFree: false, attack: false, actions: [] };
}
