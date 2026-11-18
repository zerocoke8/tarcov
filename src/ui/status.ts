// 상태(버프·디버프) 아이콘. 네모난 칸에 기호 하나를 넣고, 남은 시간은 위에서부터 어두워지는 덮개로, 중첩은 숫자로 보여 준다.
// 왼쪽 위 정보 칸과 필드 캐릭터 머리 위가 같은 아이콘을 쓴다.
import type { StatusGlyph, StatusIcon } from '../game/player/Member';
import { escapeHtml } from './dom';

/** 가운데가 (12, 12)인 별 모양의 경로 */
function star(points: number, outer: number, inner: number, turn = 0): string {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2 + turn;
    out.push(`${(12 + Math.cos(a) * r).toFixed(1)} ${(12 + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${out.join('L')}Z`;
}

/** 기호의 경로 (24 x 24 칸 기준, 한 가지 색으로 채운다) */
const GLYPH: Record<StatusGlyph, string> = {
  // 칼: 공격력
  atk: 'M12 1.5L15.2 5V13.5L12 16L8.8 13.5V5ZM6.5 15.5H17.5V18H6.5ZM10.8 18H13.2V22.5H10.8Z',
  // 번개: 공격 속도
  aspd: 'M13.5 1.5L4.5 13.5H10.5L9 22.5L19.5 9.5H13Z',
  // 겹화살: 이동 속도
  speed: 'M3 5L10.5 12L3 19ZM12 5L19.5 12L12 19Z',
  // 방패: 받는 피해
  guard: 'M12 1.5L20.5 4.5V11C20.5 16.2 17 20.4 12 22.5C7 20.4 3.5 16.2 3.5 11V4.5Z',
  // 과녁: 치명타
  crit: 'M10.8 1.5H13.2V7H10.8ZM10.8 17H13.2V22.5H10.8ZM1.5 10.8H7V13.2H1.5ZM17 10.8H22.5V13.2H17ZM12 8.8A3.2 3.2 0 1 0 12 15.2A3.2 3.2 0 0 0 12 8.8Z',
  // 고리: 보호막
  shield: 'M12 2A10 10 0 1 0 12 22A10 10 0 0 0 12 2ZM12 5.2A6.8 6.8 0 1 1 12 18.8A6.8 6.8 0 0 1 12 5.2ZM12 8.6A3.4 3.4 0 1 0 12 15.4A3.4 3.4 0 0 0 12 8.6Z',
  // 쌓인 단: 중첩되는 상태 (빌드업)
  stack: 'M3 17.5H21V21H3ZM5.5 11.5H18.5V15H5.5ZM8 5.5H16V9H8Z',
  // 터지는 별: 짧은 강화 구간 (임팩트)
  impact: star(8, 10.5, 4.6),
  // 네 갈래 별: 궁극기로 얻은 강화
  ult: star(4, 10.8, 3.2),
  // 깃발
  flag: 'M5 1.5H7.4V22.5H5ZM7.4 3L20.5 7.5L7.4 12Z',
  // 더하기: 회복
  regen: 'M9.5 3H14.5V9.5H21V14.5H14.5V21H9.5V14.5H3V9.5H9.5Z',
  // 심장: 체력
  hp: 'M12 21.5C5 15.8 2 12.2 2 8.4A5.2 5.2 0 0 1 12 6.3A5.2 5.2 0 0 1 22 8.4C22 12.2 19 15.8 12 21.5Z',
  // 불꽃: 지속 피해
  burn: 'M12.5 1.5C13.2 5.5 18.5 8 18.5 14A6.5 6.5 0 0 1 5.5 14C5.5 11 7.5 9.6 7.6 6.8C9.6 7.8 10.6 9.6 10.8 11.6C12 9.4 12.6 5.6 12.5 1.5Z',
};

function html(s: StatusIcon): string {
  const cls = `st${s.bad ? ' bad' : ''}${s.key ? ' key' : ''}`;
  const stacks = s.stacks > 1 ? `<b>${s.stacks}</b>` : '';
  // 덮개(u)가 항상 마지막 자식이다
  return `<i class="${cls}" title="${escapeHtml(s.label)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="${GLYPH[s.icon]}"/></svg>${stacks}<u></u></i>`;
}

/** 덮개를 몇 단계로 나눠 움직일지 (단계가 바뀔 때만 화면을 고친다) */
const STEPS = 16;

/** 상태 아이콘 한 줄. 목록이 바뀔 때만 다시 그리고, 남은 시간은 단계가 바뀔 때만 고친다 */
export class StatusRow {
  private key = '';
  private steps: number[] = [];

  constructor(
    readonly el: HTMLElement,
    private max: number,
  ) {}

  /** @returns 보여 준 아이콘 수 */
  update(list: StatusIcon[]): number {
    // 자리가 모자라면 마지막 칸은 "남은 수"를 적는 데 쓴다
    const rest = list.length > this.max ? list.length - (this.max - 1) : 0;
    const shown = rest ? list.slice(0, this.max - 1) : list;
    const key = shown.map((s) => `${s.id}:${s.stacks}`).join('|') + (rest ? `|+${rest}` : '');
    if (key !== this.key) {
      this.key = key;
      this.el.innerHTML = shown.map(html).join('') + (rest ? `<i class="st more">+${rest}</i>` : '');
      this.steps = shown.map(() => -1);
    }
    for (let i = 0; i < shown.length; i++) {
      const step = Math.round((1 - Math.max(0, Math.min(1, shown[i].ratio))) * STEPS);
      if (step === this.steps[i]) continue;
      this.steps[i] = step;
      (this.el.children[i].lastElementChild as HTMLElement).style.height = `${(step / STEPS) * 100}%`;
    }
    return shown.length + (rest ? 1 : 0);
  }
}
