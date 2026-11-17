// 빌드 결과를 화면 없는 브라우저(Edge 또는 Chrome)로 열어 실제로 동작하는지 확인하고 스크린샷을 남긴다.
//
//   npm run build && npm run smoke
//
// 스크린샷은 tools/.out/ 에 저장된다. 콘솔 오류가 하나라도 있으면 실패(종료 코드 1)로 끝난다.
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { preview } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tools', '.out');
mkdirSync(OUT, { recursive: true });

const server = await preview({ root: ROOT, preview: { port: 4179, host: '127.0.0.1', strictPort: false } });
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

// 가로로 든 스마트폰 크기
const context = await browser.newContext({
  viewport: { width: 844, height: 390 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e.stack ?? e)));

const shot = async (name) => {
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log(`  스크린샷: tools/.out/${name}.png`);
};
const wait = (ms) => page.waitForTimeout(ms);

await page.goto(url);
await page.waitForSelector('.lobby, .fatal', { timeout: 15000 });
await shot('01-lobby');

if (await page.$('.fatal')) {
  console.error(await page.textContent('.fatal'));
  await browser.close();
  await server.close();
  process.exit(1);
}

await page.tap('[data-act="start"]');
await wait(700);
await shot('02-sector-start');

// 오른쪽으로 걸어가 첫 무리를 만난다
await page.keyboard.down('KeyD');
await wait(1600);
await shot('03-moving');
await page.evaluate(() => {
  // 적이 보일 때까지 이동한 뒤 멈춘다
  return new Promise((resolve) => {
    const g = window.__game;
    const t0 = performance.now();
    const tick = () => {
      if (g.world.party.autoTarget || g.world.enemies.some((e) => e.aggro) || performance.now() - t0 > 6000) resolve(true);
      else requestAnimationFrame(tick);
    };
    tick();
  });
});
await page.keyboard.up('KeyD');
await page.keyboard.down('KeyJ');
await wait(900);
await shot('04-combat-basic');
await page.keyboard.press('KeyL');
await wait(250);
await shot('05-combat-active');
await page.keyboard.press('KeyO');
await wait(1200);
await shot('06-combat-pet');
await page.keyboard.up('KeyJ');
await page.keyboard.press('Digit2');
await wait(200);
await page.keyboard.down('KeyJ');
await wait(1200);
await shot('07-swap-mido');
await page.keyboard.press('KeyL');
await wait(300);
await shot('08-mido-active');
await page.keyboard.up('KeyJ');
await page.keyboard.press('Digit3');
await wait(200);
await page.keyboard.down('KeyJ');
await wait(900);
await page.keyboard.press('KeyL');
await wait(900);
await shot('09-sia-rain');
await page.keyboard.up('KeyJ');

// 멀티 터치: 왼손으로 D패드를 누른 채 오른손으로 공격 버튼을 누른다
const cdp = await context.newCDPSession(page);
const center = async (sel, fx = 0.5, fy = 0.5) => {
  const b = await (await page.$(sel)).boundingBox();
  return { x: Math.round(b.x + b.width * fx), y: Math.round(b.y + b.height * fy) };
};
const dpadUp = await center('.dpad', 0.5, 0.12);
const attackBtn = await center('.btn.attack');
const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
await touch('touchStart', [{ ...dpadUp, id: 1 }]);
await wait(150);
const moveOnly = await page.evaluate(() => ({ ...window.__game.input.state, actions: undefined }));
await touch('touchStart', [
  { ...dpadUp, id: 1 },
  { ...attackBtn, id: 2 },
]);
await wait(250);
const both = await page.evaluate(() => ({
  ...window.__game.input.state,
  actions: undefined,
  action: window.__game.world.party.action,
}));
await shot('09b-multitouch');
await touch('touchEnd', [{ ...dpadUp, id: 1 }]);
await wait(100);
await touch('touchEnd', []);
await wait(100);
const released = await page.evaluate(() => ({ ...window.__game.input.state, actions: undefined }));
console.log('  멀티 터치 — D패드만:', JSON.stringify(moveOnly));
console.log('  멀티 터치 — D패드 + 공격:', JSON.stringify(both));
console.log('  멀티 터치 — 손 뗀 뒤:', JSON.stringify(released));
if (!moveOnly.dirActive || moveOnly.dirY > -0.9) errors.push('D패드 위쪽 입력이 인식되지 않았습니다');
if (!both.dirActive || !both.attack) errors.push('D패드와 공격 버튼의 동시 입력이 인식되지 않았습니다');
if (both.action !== 'attack') errors.push('공격 버튼을 누른 동안 공격 행동이 시작되지 않았습니다');
if (released.dirActive || released.attack) errors.push('손을 뗀 뒤에도 입력이 남아 있습니다');

await page.tap('.minimap');
await wait(300);
await shot('10-fullmap');
await page.tap('[data-act="close"]');
await page.tap('.pause-btn');
await wait(200);
await shot('11-pause');

const state = await page.evaluate(() => {
  const w = window.__game.world;
  return {
    time: Math.round(w.time),
    kills: w.stats.kills,
    enemies: w.enemies.length,
    hp: w.party.members.map((m) => `${m.def.name} ${Math.round(m.hp)}/${m.stats.maxHp}`),
    over: w.over,
  };
});
console.log('  상태:', JSON.stringify(state));

await browser.close();
await server.close();

if (errors.length) {
  console.error(`\n콘솔 오류 ${errors.length}건:`);
  for (const e of errors.slice(0, 10)) console.error(' - ' + e);
  process.exit(1);
}
console.log('\n오류 없이 끝났습니다.');
