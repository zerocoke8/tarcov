// 무작위 팀·펫·경로로 런을 여러 번 돌려, 어떤 조합에서도 진행이 멈추지 않는지 확인한다.
// (몬스터나 파티가 벽에 끼는 종류의 문제를 잡는다. 멈추면 그때의 상황을 출력한다.)
import { expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import { playRun } from './helpers/play';

// 더 넓게 훑으려면 횟수를 환경 변수로 준다:  SWEEP=300 npx vitest run tests/sweep.test.ts
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const COUNT = Number(env.SWEEP ?? 40);

it(`무작위 조합 ${COUNT}회: 어떤 런도 멈추지 않는다`, () => {
  const ids = db.charList.map((c) => c.id);
  const stuck: string[] = [];
  let wipes = 0;
  for (let seed = 100; seed < 100 + COUNT; seed++) {
    const pick = new Rng(seed * 7919);
    const team = pick.shuffle([...ids]).slice(0, 3);
    const petId = pick.pick(['A', 'B', 'C', 'D']);
    const routeId = pick.pick(['normal', 'elite', 'special']);
    const res = playRun(seed, routeId, team, petId);
    if (res.outcome === 'stuck') stuck.push(`[멈춤] 시드 ${seed} 팀 ${team.join(',')} ${routeId}\n${res.stuck}`);
    if (res.outcome === 'wipe') wipes++;
  }
  console.log(`런 ${COUNT}회: 멈춤 ${stuck.length}회, 전멸 ${wipes}회`);
  expect(stuck, stuck.join('\n\n')).toHaveLength(0);
}, 600000);
