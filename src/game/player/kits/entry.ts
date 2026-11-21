// 등장 기술(교체로 필드에 나오면서 쓰는 짧은 기술)의 공통 부분 (기획서 3.7절).
// 기술 자체는 캐릭터마다 다르며 각 캐릭터 파일의 entry 에 있다. 수치는 skill_values.csv 의 <id>.entry.*
import { clamp } from '../../../core/math';
import { db } from '../../../data/tables';
import type { SkillCtx } from '../kit';

/**
 * 근접 캐릭터의 접근: 겨눈 적 앞(standoff 만큼 떨어진 곳)까지 time 초에 걸쳐 뛰어든다. 멀어도 swap.entryLunge 까지만 간다.
 * 겨눈 적이 없으면 겨눈 쪽으로 반걸음(swap.entryStep)만 내딛는다. 벽에는 막힌다. 가려는 거리를 돌려준다
 */
export function rushIn({ p, aim, target }: SkillCtx, standoff: number, time: number): number {
  const dist = target
    ? clamp(Math.hypot(target.x - p.x, target.y - p.y) - target.r - standoff, 0, db.P('swap.entryLunge'))
    : db.P('swap.entryStep');
  if (dist > 0) p.force(aim, dist, time);
  return dist;
}
