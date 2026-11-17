// 조작 입력의 형태. 터치·키보드 등 실제 입력 장치는 src/input/ 에서 이 형태로 바꿔 넘겨준다.

export type InputAction =
  | { type: 'dodge' }
  | { type: 'active' }
  | { type: 'ult' }
  | { type: 'pet' }
  | { type: 'swap'; index: number };

export interface InputState {
  /** D패드 방향 (8방향 단위 벡터). dirActive가 false면 0 */
  dirX: number;
  dirY: number;
  dirActive: boolean;
  /** 공격 버튼을 누르고 있는지 */
  attack: boolean;
  /** 이번 프레임에 눌린 버튼들. 처리한 쪽에서 비운다 */
  actions: InputAction[];
}

export function emptyInput(): InputState {
  return { dirX: 0, dirY: 0, dirActive: false, attack: false, actions: [] };
}
