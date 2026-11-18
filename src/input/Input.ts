// 터치(D패드 + 버튼, 멀티 터치)와 키보드 입력을 규칙 코드가 쓰는 InputState로 바꾼다.
//
// 키보드 (PC 테스트용)
//   이동 WASD / 방향키 · 공격 J / Space · 회피 K / Shift · 액티브 L / E · 궁극기 I / Q · 펫 O / R · 교체 1 2 3
import { emptyInput, type InputAction, type InputState } from '../game/input';

const DIR_KEYS: Record<string, [number, number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

const TAP_KEYS: Record<string, InputAction> = {
  KeyK: { type: 'dodge' },
  ShiftLeft: { type: 'dodge' },
  KeyL: { type: 'active' },
  KeyE: { type: 'active' },
  KeyI: { type: 'ult' },
  KeyQ: { type: 'ult' },
  KeyO: { type: 'pet' },
  KeyR: { type: 'pet' },
  KeyF: { type: 'interact' },
  Digit1: { type: 'swap', index: 0 },
  Digit2: { type: 'swap', index: 1 },
  Digit3: { type: 'swap', index: 2 },
};

const ATTACK_KEYS = new Set(['KeyJ', 'Space']);

export class Input {
  readonly state: InputState = emptyInput();
  /** false면 입력을 받지 않는다 (메뉴가 떠 있을 때) */
  enabled = false;

  private keys = new Set<string>();
  private touchDir: [number, number] | null = null;
  private touchAttack = false;
  private dpadEl: HTMLElement | null = null;
  private dpadPointer = -1;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (!this.enabled) return;
      if (DIR_KEYS[e.code] || ATTACK_KEYS.has(e.code) || TAP_KEYS[e.code]) e.preventDefault();
      this.keys.add(e.code);
      const tap = TAP_KEYS[e.code];
      if (tap) this.press(tap);
      this.refresh();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.refresh();
    });
    window.addEventListener('blur', () => this.reset());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.reset();
    });
  }

  /** 버튼 한 번 누름 */
  press(a: InputAction): void {
    if (this.enabled) this.state.actions.push(a);
  }

  reset(): void {
    this.keys.clear();
    this.touchDir = null;
    this.touchAttack = false;
    this.dpadPointer = -1;
    this.state.actions.length = 0;
    this.paintDpad(-1);
    this.refresh();
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.reset();
  }

  private refresh(): void {
    const s = this.state;
    let x = 0;
    let y = 0;
    if (this.touchDir) {
      [x, y] = this.touchDir;
    } else {
      for (const code of this.keys) {
        const d = DIR_KEYS[code];
        if (d) {
          x += d[0];
          y += d[1];
        }
      }
      x = Math.sign(x);
      y = Math.sign(y);
    }
    const len = Math.hypot(x, y);
    s.dirActive = len > 0;
    s.dirX = len > 0 ? x / len : 0;
    s.dirY = len > 0 ? y / len : 0;
    let attack = this.touchAttack;
    for (const code of this.keys) if (ATTACK_KEYS.has(code)) attack = true;
    s.attack = attack && this.enabled;
    if (!this.enabled) s.dirActive = false;
  }

  // ---- 터치 ---------------------------------------------------------------

  /** 8방향 D패드. el 안 어디를 눌러도 el 중심 기준의 방향으로 계산한다 */
  bindDpad(el: HTMLElement): void {
    this.dpadEl = el;
    const update = (e: PointerEvent): void => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dead = rect.width * 0.11;
      if (Math.hypot(dx, dy) < dead) {
        this.touchDir = null;
        this.paintDpad(-1);
      } else {
        // 45도 단위로 맞춘다
        const idx = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
        const a = (idx * Math.PI) / 4;
        this.touchDir = [Math.cos(a), Math.sin(a)];
        this.paintDpad(idx);
      }
      this.refresh();
    };
    el.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      this.dpadPointer = e.pointerId;
      el.setPointerCapture(e.pointerId);
      update(e);
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.dpadPointer) update(e);
    });
    const end = (e: PointerEvent): void => {
      if (e.pointerId !== this.dpadPointer) return;
      this.dpadPointer = -1;
      this.touchDir = null;
      this.paintDpad(-1);
      this.refresh();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  /** D패드의 눌린 방향을 표시한다 (idx: 0 오른쪽부터 시계 방향 45도 단위, -1 없음) */
  private paintDpad(idx: number): void {
    const el = this.dpadEl;
    if (!el) return;
    if (idx < 0) {
      el.removeAttribute('data-dir');
      el.style.setProperty('--kx', '0');
      el.style.setProperty('--ky', '0');
    } else {
      el.setAttribute('data-dir', String(idx));
      el.style.setProperty('--kx', String(Math.cos((idx * Math.PI) / 4)));
      el.style.setProperty('--ky', String(Math.sin((idx * Math.PI) / 4)));
    }
  }

  /** 누르고 있는 동안 공격하는 버튼 */
  bindAttack(el: HTMLElement): void {
    let pointer = -1;
    el.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      pointer = e.pointerId;
      el.setPointerCapture(e.pointerId);
      el.classList.add('down');
      this.touchAttack = true;
      this.refresh();
    });
    const end = (e: PointerEvent): void => {
      if (e.pointerId !== pointer) return;
      pointer = -1;
      el.classList.remove('down');
      this.touchAttack = false;
      this.refresh();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  /** 한 번 누르는 버튼. action을 함수로 주면 누를 때마다 계산한다 */
  bindTap(el: HTMLElement, action: InputAction | (() => InputAction | null)): void {
    el.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      el.classList.add('down');
      const a = typeof action === 'function' ? action() : action;
      if (a) this.press(a);
    });
    const end = (): void => el.classList.remove('down');
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
  }
}
