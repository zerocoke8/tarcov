// 마름모(아이소메트릭) 화면의 섹터를 화면 없는 브라우저로 열어 여러 자리에서 스크린샷을 찍는다.
//
//   npm run build && node tools/isoshot.mjs            시즌 3(마름모)의 모든 섹터
//   node tools/isoshot.mjs 1 3                         섹터 1과 3만
//   node tools/isoshot.mjs --season 2 1                비교용: 기존 화면의 시즌 2 섹터 1
//   node tools/isoshot.mjs --wide 1                    넓은 화면(1600x740)으로
//   node tools/isoshot.mjs --keep 2                    전에 찍은 것을 지우지 않고 더 찍는다
//
// 섹터마다: 시작 지점, 무리가 있는 자리 몇 곳(싸우는 모습), 출구 앞을 찍는다. 결과는 tools/.out/iso/ 에 저장된다.
// 콘솔 오류가 하나라도 있으면 실패(종료 코드 1)로 끝난다.
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { preview } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tools', '.out', 'iso');
const argv = process.argv.slice(2);
/** 옵션을 꺼낸다. value 가 true 면 뒤의 값을, 아니면 있는지만 돌려준다 */
const flag = (name, value = false) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return null;
  const v = value ? argv[i + 1] : true;
  argv.splice(i, value ? 2 : 1);
  return v ?? true;
};
const season = Number(flag('season', true) ?? 3);
const wide = flag('wide') !== null;
const keep = flag('keep') !== null;
const only = argv.map(Number).filter((n) => n > 0);

mkdirSync(OUT, { recursive: true });
if (!keep) for (const f of readdirSync(OUT)) if (/^\d\d-.*\.png$/.test(f)) rmSync(join(OUT, f));

const server = await preview({ root: ROOT, preview: { port: 4181, host: '127.0.0.1', strictPort: false } });
const url = server.resolvedUrls.local[0];
let browser;
for (const channel of ['msedge', 'chrome']) {
  try {
    browser = await chromium.launch({ channel, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    break;
  } catch {
    /* 다음 브라우저 시도 */
  }
}
if (!browser) {
  console.error('Edge 또는 Chrome을 찾지 못했습니다.');
  process.exit(1);
}
const context = await browser.newContext({ viewport: wide ? { width: 1600, height: 740 } : { width: 1180, height: 545 }, deviceScaleFactor: 1, hasTouch: true });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e.stack ?? e)));

let shotNo = 0;
const shot = async (name) => {
  const file = `${String(++shotNo).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: join(OUT, file) });
  console.log(`  스크린샷: tools/.out/iso/${file}`);
};
const wait = (ms) => page.waitForTimeout(ms);

await page.goto(url);
await page.waitForSelector('.lobby, .fatal', { timeout: 20000 });
if (await page.$('.fatal')) {
  console.error(await page.textContent('.fatal'));
  process.exit(1);
}
await page.click(`[data-season="${season}"]`);
await wait(150);
await shot('lobby');
await page.click('[data-act="new"]');
await wait(200);
await page.click('.pets [data-pet="B"]');
await page.click('[data-act="start"]');
await page.waitForFunction(() => !!window.__game?.world, null, { timeout: 20000 });
await wait(1500);

const sectors = await page.evaluate(() => {
  const g = window.__game;
  g.world.cheatInvuln = true;
  return g.world.setup.def && window.__game.run ? null : null;
});
void sectors;

/** 그 섹터로 바로 들어간다 (보상·경로 화면을 건너뛴다) */
const enter = (index) =>
  page.evaluate((i) => {
    const g = window.__game;
    g.run.sector = i;
    g.run.bonus = i === 100;
    g.enterSector();
    g.world.cheatInvuln = true;
    return { name: g.world.setup.def.name, map: g.world.setup.def.map, view: g.world.setup.def.view, w: g.world.plan.w, h: g.world.plan.h, enemies: g.world.enemies.length };
  }, index);

/** 필드 캐릭터를 그 자리로 옮긴다 */
const moveTo = (x, y) =>
  page.evaluate(
    ([px, py]) => {
      const w = window.__game.world;
      w.party.x = px;
      w.party.y = py;
    },
    [x, y],
  );

/**
 * 한 프레임을 그리는 데 걸리는 시간과 화면에 올라간 것의 수.
 * 화면 없는 브라우저의 소프트웨어 렌더링이라 실제 기기보다 훨씬 느리다. 맵끼리(기존 화면과 마름모 화면) 견주는 데만 쓴다
 */
const frameTime = () =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const stage = window.__game.stage;
        const count = (c) => 1 + (c.children ?? []).reduce((n, k) => n + count(k), 0);
        let n = 0;
        const t0 = performance.now();
        const tick = () => {
          if (++n >= 30) resolve({ ms: (performance.now() - t0) / n, objects: stage.objects.children.length, nodes: count(stage.world) });
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );

const list = only.length ? only : await page.evaluate(() => [...new Set(window.__game.run && [1, 2, 3, 4, 5, 6, 100])]);
for (const index of list) {
  const info = await enter(index).catch((e) => ({ error: String(e) }));
  if (info.error) {
    console.log(`섹터 ${index}: 들어가지 못했습니다 (${info.error})`);
    continue;
  }
  console.log(`섹터 ${index} · ${info.name} (${info.map}, ${info.w}x${info.h}, ${info.view}, 몬스터 ${info.enemies})`);
  await wait(1400);
  await shot(`s${index}-start`);
  const perf = await frameTime();
  console.log(`  프레임당 ${perf.ms.toFixed(1)}ms (소프트웨어 렌더링), 정렬 대상 ${perf.objects}개, 그리는 것 ${perf.nodes}개`);
  // 무리가 있는 자리: 길을 따라 고르게 몇 곳
  const spots = await page.evaluate(() => {
    const w = window.__game.world;
    const packs = w.packs.filter((p) => !p.gate).map((p) => ({ x: p.x, y: p.y }));
    const gate = w.packs.find((p) => p.gate);
    const exit = w.things.find((t) => t.kind === 'exit');
    return { packs, gate: gate ? { x: gate.x, y: gate.y } : null, exit: exit ? { x: exit.x, y: exit.y } : null };
  });
  const picks = spots.packs.filter((_, i, a) => a.length <= 3 || i % Math.ceil(a.length / 3) === 0).slice(0, 3);
  let n = 0;
  for (const p of picks) {
    await moveTo(p.x - 70, p.y + 70);
    await wait(500);
    await page.keyboard.down('KeyJ');
    await wait(900);
    if (n === 0) {
      await page.keyboard.press('KeyL');
      await wait(250);
    }
    await shot(`s${index}-pack${++n}`);
    if (n === 1) {
      await page.evaluate(() => {
        for (const m of window.__game.world.party.members) m.ult = 9999;
      });
      await page.keyboard.press('KeyI');
      await wait(700);
      await shot(`s${index}-ult`);
    }
    await page.keyboard.up('KeyJ');
  }
  if (spots.gate) {
    await moveTo(spots.gate.x - 80, spots.gate.y + 60);
    await wait(400);
    await page.keyboard.down('KeyJ');
    await wait(1000);
    await shot(`s${index}-gate`);
    await page.keyboard.up('KeyJ');
  }
  if (spots.exit) {
    await moveTo(spots.exit.x - 100, spots.exit.y + 30);
    await wait(900);
    await shot(`s${index}-exit`);
  }
}

await browser.close();
await server.close();
if (errors.length) {
  console.error(`콘솔 오류 ${errors.length}건:`);
  for (const e of [...new Set(errors)].slice(0, 12)) console.error(`  ${e}`);
  process.exit(1);
}
console.log('끝');
