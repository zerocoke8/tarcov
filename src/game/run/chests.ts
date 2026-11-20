// 보상 상자가 나오는 박자 (기획서 7.3절).
// 무리를 처치할 때마다 상자가 나오면 선택지가 너무 자주 뜬다. 그래서 섹터마다 "그 섹터의 무리가 주는 상자 수"를 정해 두고
// (sectors.csv 의 chests), 무리를 몇 개 처치할 때마다 하나씩 고르게 나오게 한다. 마지막 무리를 처치하면 마지막 상자가 나온다.

/** 실제로 나올 상자 수. budget 이 음수면 무리마다 하나 */
export function chestBudget(total: number, budget: number): number {
  if (total <= 0) return 0;
  return budget < 0 ? total : Math.min(budget, total);
}

/**
 * 무리 total 개 가운데 kills 개를 처치했을 때까지 나왔어야 하는 상자 수.
 * 예: 무리 8개에 상자 4개면 2, 4, 6, 8번째에, 무리 9개에 상자 4개면 3, 5, 7, 9번째에 나온다
 */
export function chestsDue(kills: number, total: number, budget: number): number {
  const b = chestBudget(total, budget);
  if (b <= 0) return 0;
  return Math.floor((Math.min(kills, total) * b) / total);
}

/** 다음 상자까지 더 처치해야 하는 무리 수. 더 나올 상자가 없으면 0 */
export function packsToNextChest(kills: number, total: number, budget: number): number {
  const b = chestBudget(total, budget);
  const given = chestsDue(kills, total, budget);
  if (given >= b) return 0;
  return Math.ceil(((given + 1) * total) / b) - kills;
}
