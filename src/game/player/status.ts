// 필드 캐릭터에게 걸려 있는 상태(버프·디버프)를 화면에 보여 줄 목록으로 모은다. 그리지는 않는다.
//
// 상태는 두 무리로 나뉜다 (기획서 4.2절).
//  - 핵심 상태(key): 지금 싸우는 방식에 영향을 주는 것. 속성 특성의 상태(빌드업, 임팩트), 보호막,
//    궁극기·스킬로 얻는 한정 강화, 치명적인 디버프. 필드 캐릭터의 머리 위와 왼쪽 위 정보 칸 두 곳에 보인다.
//  - 그 밖의 상태: 장비가 가끔 주는 짧은 강화, 대기 중인 팀원이 주는 상시 효과, 런 내내 남는 저주. 왼쪽 위 정보 칸에만 보인다.
import { db } from '../../data/tables';
import type { CurseDef } from '../../data/types';
import { activeCurses } from '../run/valuables';
import type { World } from '../world/World';
import type { StatusGlyph, StatusIcon } from './Member';

const CURSE_GLYPH: Record<CurseDef['stat'], StatusGlyph> = {
  dmgTaken: 'guard',
  atk: 'atk',
  speed: 'speed',
  maxHp: 'hp',
  critRate: 'crit',
};

const pct = (v: number): number => Math.round(v * 100);

/** 시간제한이 없는 상시 효과 */
const steady = (id: string, icon: StatusGlyph, label: string): StatusIcon => ({ id, icon, label, stacks: 1, ratio: 1, bad: false, key: false });

/** 보여 줄 순서: 치명적인 디버프 → 핵심 버프 → 그 밖의 버프 → 그 밖의 디버프 */
const rank = (s: StatusIcon): number => (s.key ? (s.bad ? 0 : 1) : s.bad ? 3 : 2);

/** 필드 캐릭터의 상태 목록. 앞에 있을수록 중요하다 */
export function fieldStatus(w: World): StatusIcon[] {
  const p = w.party;
  const out = p.active.statusIcons();

  // 대기 중인 팀원이 주는 상시 효과
  const a = p.aura;
  if (a.atk > 0) out.push(steady('aura.atk', 'atk', `대기 팀원의 지원: 공격력 +${pct(a.atk)}%`));
  if (a.crit > 0) out.push(steady('aura.crit', 'crit', `대기 팀원의 지원: 치명타 확률 +${pct(a.crit)}%p`));
  if (a.guard > 0) out.push(steady('aura.guard', 'guard', `대기 팀원의 지원: 받는 피해 -${pct(a.guard)}%`));
  if (a.ultGain > 0) out.push(steady('aura.ult', 'ult', `대기 팀원의 지원: 궁극기 게이지 획득 +${pct(a.ultGain)}%`));

  // 저주: 런이 끝날 때까지(또는 오염된 귀중품을 들고 있는 동안) 남는다. 같은 저주가 겹치면 수를 센다
  const counts = new Map<string, number>();
  for (const id of activeCurses(w.run)) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const [id, n] of counts) {
    const c = db.curse(id);
    out.push({ id: `curse.${id}`, icon: CURSE_GLYPH[c.stat], label: `${c.name}: ${db.curseDesc(id)}`, stacks: n, ratio: 1, bad: true, key: false });
  }

  // 같은 무리 안에서는 원래 순서를 지킨다 (sort 는 순서를 보존한다)
  return out.sort((x, y) => rank(x) - rank(y));
}
