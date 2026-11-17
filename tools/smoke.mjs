// 빌드 결과를 화면 없는 브라우저(Edge 또는 Chrome)로 열어 실제로 동작하는지 확인하고 스크린샷을 남긴다.
//
//   npm run build && npm run smoke
//
// 로비 → 편성 → 전투 → 보상 → 경로 → 캠프 → 보스 → 조사 팀 저장까지 한 바퀴를 돈다.
// (섹터는 디버그 메뉴의 "섹터 클리어"로 넘긴다.)
// 스크린샷은 tools/.out/ 에 저장된다. 콘솔 오류가 하나라도 있으면 실패(종료 코드 1)로 끝난다.
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { preview } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tools', '.out');
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f.endsWith('.png')) rmSync(join(OUT, f));

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

let shotNo = 0;
const shot = async (name) => {
  const file = `${String(++shotNo).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: join(OUT, file) });
  console.log(`  스크린샷: tools/.out/${file}`);
};
const wait = (ms) => page.waitForTimeout(ms);
const has = async (sel) => (await page.$(sel)) !== null;
const tap = async (sel) => {
  await page.tap(sel);
  await wait(120);
};
const fail = async (msg) => {
  console.error(msg);
  await shot('fail');
  await browser.close();
  await server.close();
  process.exit(1);
};

/**
 * 떠 있는 창을 차례로 처리해 전투 화면(또는 결과 화면)으로 돌아올 때까지 진행한다.
 * shots에 창 종류별 스크린샷 이름을 주면 그 창이 처음 나타났을 때 찍는다.
 */
async function settle(shots = {}, routePick = 0) {
  const taken = new Set();
  const snap = async (kind) => {
    if (shots[kind] && !taken.has(kind)) {
      taken.add(kind);
      await shot(shots[kind]);
    }
  };
  for (let i = 0; i < 40; i++) {
    await wait(150);
    if (await has('.targets .target')) {
      await snap('target');
      await tap('.targets .target');
    } else if (await has('.overlay.shop')) {
      await snap('shop');
      const buyable = await page.$('.overlay.shop .card:not([disabled]) .price:not(.poor)');
      if (buyable && !taken.has('bought')) {
        taken.add('bought');
        await buyable.tap();
        await wait(150);
      } else await tap('.overlay.shop [data-act="close"]');
    } else if (await has('.overlay.reward .cards .card')) {
      await snap('reward');
      await tap('.overlay.reward .cards .card');
    } else if (await has('.overlay.route')) {
      await snap('route');
      const cards = await page.$$('.overlay.route .card');
      await cards[Math.min(routePick, cards.length - 1)].tap();
    } else if (await has('.overlay.camp')) {
      await snap('camp');
      if (shots.campShop && !taken.has('campShop')) {
        taken.add('campShop');
        await tap('.overlay.camp [data-act="rest"]');
        await tap('.overlay.camp [data-act="shop"]');
      } else await tap('.overlay.camp [data-act="continue"]');
    } else if (await has('.overlay.event .choice')) {
      await snap('event');
      await tap('.overlay.event .choice:not([disabled])');
    } else if (await has('.overlay.event [data-act="ok"]')) {
      await snap('eventResult');
      await tap('.overlay.event [data-act="ok"]');
    } else return;
  }
  await fail('창이 계속 떠 있어 진행할 수 없습니다');
}

/** 디버그 메뉴의 동작을 누른다 */
async function debug(action) {
  await tap('.info-btn');
  await tap('.overlay.team [data-act="debug"]');
  await tap(`.overlay.team [data-dbg="${action}"]`);
}

const worldState = () =>
  page.evaluate(() => {
    const g = window.__game;
    const w = g.world;
    return w
      ? {
          sector: w.setup.def.index,
          type: w.setup.def.type,
          route: w.setup.route.id,
          enemies: w.enemies.filter((e) => !e.dead).length,
          things: w.things.map((t) => t.kind).join(','),
          over: w.over,
        }
      : null;
  });

// ---- 1. 로비와 편성 ------------------------------------------------------
await page.goto(url);
await page.waitForSelector('.lobby, .fatal', { timeout: 15000 });
if (await has('.fatal')) await fail(await page.textContent('.fatal'));
await shot('lobby');
await tap('[data-act="new"]');
await shot('formation');
await tap('.pets [data-pet="A"]');
await tap('.pets [data-pet="B"]');
await tap('[data-act="start"]');
await wait(600);
await shot('sector1-start');

// ---- 2. 전투: 이동, 공격, 스킬, 교체, 멀티 터치 ---------------------------
await page.keyboard.down('KeyD');
await page.evaluate(
  () =>
    new Promise((resolve) => {
      const g = window.__game;
      const t0 = performance.now();
      const tick = () => {
        if (g.world.enemies.some((e) => e.aggro) || performance.now() - t0 > 7000) resolve(true);
        else requestAnimationFrame(tick);
      };
      tick();
    }),
);
await page.keyboard.up('KeyD');
await page.keyboard.down('KeyJ');
await wait(800);
await shot('combat');
await page.keyboard.press('KeyL');
await page.keyboard.press('KeyO');
await wait(900);
await page.keyboard.up('KeyJ');
await page.keyboard.press('Digit2');
await wait(150);
await page.keyboard.down('KeyJ');
await wait(700);
await page.keyboard.up('KeyJ');

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
await touch('touchEnd', [{ ...dpadUp, id: 1 }]);
await wait(100);
await touch('touchEnd', []);
await wait(100);
const released = await page.evaluate(() => ({ ...window.__game.input.state, actions: undefined }));
if (!moveOnly.dirActive || moveOnly.dirY > -0.9) errors.push('D패드 위쪽 입력이 인식되지 않았습니다');
if (!both.dirActive || !both.attack) errors.push('D패드와 공격 버튼의 동시 입력이 인식되지 않았습니다');
if (both.action !== 'attack') errors.push('공격 버튼을 누른 동안 공격 행동이 시작되지 않았습니다');
if (released.dirActive || released.attack) errors.push('손을 뗀 뒤에도 입력이 남아 있습니다');
console.log('  멀티 터치 확인:', JSON.stringify({ moveOnly: moveOnly.dirActive, both: both.attack, action: both.action }));

// ---- 3. 보상 상자, NPC 이벤트, 팀 정보 -------------------------------------
await debug('invuln');
await tap('.overlay.team [data-act="resume"]');
await debug('reward');
await settle({ reward: 'reward-choices', target: 'equip-target' });
// 장비 보상이 나올 때까지 몇 번 더 받아 장착 화면을 확인한다
for (let i = 0; i < 4; i++) {
  await debug('reward');
  await wait(150);
  const equip = await page.$('.overlay.reward .card.equip');
  if (equip) {
    await equip.tap();
    await wait(150);
    await shot('equip-target');
    await tap('.targets .target');
    break;
  }
  await settle();
}
await page.evaluate(() => {
  const g = window.__game;
  void g.onThing({ kind: 'npc', quality: 1 });
});
await settle({ event: 'npc-event', eventResult: 'npc-event-result', shop: 'npc-shop', reward: 'npc-reward' });
await tap('.info-btn');
await shot('team-info');
await tap('.overlay.team [data-act="debug"]');
await tap('.overlay.team [data-dbg="shards"]');
await tap('.overlay.team [data-dbg="shards"]');
await shot('team-debug');
await tap('.overlay.team [data-act="resume"]');

// ---- 4. 섹터 클리어 → 경로 선택 → 캠프 ------------------------------------
await debug('clearSector');
await settle({ reward: 'clear-reward', route: 'route-select' }, 1);
await wait(400);
let st = await worldState();
console.log('  섹터 2 진입:', JSON.stringify(st));
if (st.sector !== 2) errors.push(`섹터 2에 들어가지 못했습니다 (현재 ${st.sector})`);
await shot('sector2-elite');
await debug('clearSector');
await settle({}, 0);
await wait(300);
await debug('clearSector'); // 섹터 3 → 캠프
await settle({ camp: 'camp', campShop: true, shop: 'camp-shop', route: 'route-after-camp' }, 2);
await wait(300);
st = await worldState();
console.log('  섹터 4 진입:', JSON.stringify(st));
if (st.sector !== 4) errors.push(`캠프 뒤 섹터 4에 들어가지 못했습니다 (현재 ${st.sector})`);
await shot('sector4-special');

// ---- 5. 이어하기: 새로 고침 후 저장된 런으로 복귀 --------------------------
await page.reload();
await page.waitForSelector('.lobby', { timeout: 15000 });
await shot('lobby-resume');
if (!(await has('[data-act="resume"]'))) errors.push('로비에 이어하기 버튼이 없습니다');
else {
  await tap('[data-act="resume"]');
  await wait(500);
  st = await worldState();
  console.log('  이어하기:', JSON.stringify(st));
  if (st?.sector !== 4) errors.push(`이어하기가 섹터 4로 돌아오지 않았습니다 (현재 ${st?.sector})`);
}

// ---- 6. 보스까지 진행 ------------------------------------------------------
for (let i = 0; i < 8; i++) {
  st = await worldState();
  if (!st || st.type === 'boss') break;
  await debug('clearSector');
  await settle({}, 0);
  await wait(300);
}
st = await worldState();
console.log('  보스 섹터:', JSON.stringify(st));
if (st?.type !== 'boss') errors.push('보스 섹터에 도달하지 못했습니다');
await debug('invuln');
await tap('.overlay.team [data-act="resume"]');
await page.keyboard.down('KeyW');
await wait(1400);
await page.keyboard.up('KeyW');
await page.keyboard.down('KeyJ');
await wait(2600);
await shot('boss-fight');
await page.keyboard.press('KeyI');
await wait(2500);
await shot('boss-patterns');
await page.keyboard.up('KeyJ');
await debug('clearSector');
await wait(500);
await shot('run-result');
if (!(await has('.score'))) errors.push('런 결과 화면이 나오지 않았습니다');
await tap('[data-act="ok"]');
await wait(300);
await shot('lobby-with-deck');
if (!(await has('.deck'))) errors.push('로비에 저장된 조사 팀이 보이지 않습니다');
else {
  await tap('.deck [data-view]');
  await shot('deck-view');
}

await tap('.overlay.team [data-act="resume"]');

// ---- 6b. 파티덱 컨텐츠: 저장된 조사 팀으로 토벌과 범람에 도전 ---------------
await tap('.deck [data-go]');
await shot('challenge-select');
await tap('[data-raid="2"]');
await wait(500);
st = await worldState();
console.log('  특급 괴이 토벌:', JSON.stringify(st));
if (st?.type !== 'boss') errors.push('특급 괴이 토벌이 시작되지 않았습니다');
await page.keyboard.down('KeyW');
await wait(1300);
await page.keyboard.up('KeyW');
await page.keyboard.down('KeyJ');
await wait(2500);
await shot('raid-fight');
await page.keyboard.up('KeyJ');
await debug('clearSector');
await wait(400);
await shot('raid-result');
if (!(await has('.stats'))) errors.push('토벌 결과 화면이 나오지 않았습니다');
await tap('[data-act="lobby"]');
await wait(300);
await tap('.deck [data-go]');
await shot('challenge-select-with-record');
await tap('[data-act="wave"]');
await wait(500);
await debug('invuln');
await tap('.overlay.team [data-act="resume"]');
await page.keyboard.down('KeyJ');
await wait(9000);
await shot('wave-fight');
await page.keyboard.up('KeyJ');
const waveState = await page.evaluate(() => {
  const w = window.__game.world;
  return { mode: w.setup.mode, time: Math.round(w.time), stage: w.waveStage, score: Math.floor(w.score), enemies: w.enemies.length };
});
console.log('  괴이 범람:', JSON.stringify(waveState));
if (waveState.mode !== 'wave' || waveState.enemies === 0) errors.push('괴이 범람에서 몬스터가 나타나지 않았습니다');
await tap('.info-btn');
await tap('.overlay.team [data-act="abandon"]');
await tap('[data-act="yes"]');
await wait(300);
if (!(await has('.lobby'))) errors.push('도전 포기 뒤 로비로 돌아오지 않았습니다');

// ---- 7. 전멸: 파티덱이 저장되지 않고, 이어하기도 사라져야 한다 --------------
const decksBefore = (await page.$$('.deck')).length;
await tap('[data-act="new"]');
await tap('[data-act="start"]');
await wait(500);
await page.evaluate(() => {
  const w = window.__game.world;
  // 세 명이 차례로 쓰러질 만큼의 피해를 준다
  for (let i = 0; i < 3; i++) {
    w.party.invulnT = 0;
    w.party.hitInvulnT = 0;
    w.hurt(99999);
  }
});
await wait(400);
await shot('wipe-result');
if (!(await has('.score.lost'))) errors.push('전멸 결과 화면이 나오지 않았습니다');
await tap('[data-act="ok"]');
await wait(300);
if (await has('[data-act="resume"]')) errors.push('전멸 뒤에도 이어하기가 남아 있습니다');
if ((await page.$$('.deck')).length !== decksBefore) errors.push('전멸했는데 조사 팀 수가 바뀌었습니다');

// ---- 8. 신규 캐릭터로 편성해 전투 ------------------------------------------
async function fightWith(team, name) {
  await tap('[data-act="new"]');
  for (const id of ['serin', 'mido', 'sia']) await tap(`.roster [data-char="${id}"]`);
  for (const id of team) await tap(`.roster [data-char="${id}"]`);
  if (name === 'new-team-a') await shot('formation-9');
  await tap('[data-act="start"]');
  await wait(500);
  await debug('invuln');
  await tap('.overlay.team [data-dbg="ult"]');
  await tap('.overlay.team [data-act="resume"]');
  await page.keyboard.down('KeyD');
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const g = window.__game;
        const t0 = performance.now();
        const tick = () => {
          if (g.world.enemies.some((e) => e.aggro) || performance.now() - t0 > 7000) resolve(true);
          else requestAnimationFrame(tick);
        };
        tick();
      }),
  );
  await page.keyboard.up('KeyD');
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press(`Digit${i + 1}`);
    await wait(120);
    await page.keyboard.down('KeyJ');
    await wait(500);
    await page.keyboard.press('KeyL');
    await wait(450);
    await page.keyboard.press('KeyI');
    await wait(500);
    await shot(`${name}-${team[i]}`);
    await page.keyboard.up('KeyJ');
    await wait(1100);
  }
  // 싸우는 동안 보상 상자가 열렸을 수 있다
  await settle();
  // 런을 포기하고 로비로 돌아간다
  await tap('.info-btn');
  await tap('.overlay.team [data-act="abandon"]');
  await tap('[data-act="yes"]');
  await wait(200);
  await tap('[data-act="ok"]');
  await wait(200);
}
await fightWith(['karen', 'raon', 'yuna'], 'new-team-a');
await fightWith(['haru', 'roa', 'eve'], 'new-team-b');

await browser.close();
await server.close();

if (errors.length) {
  console.error(`\n문제 ${errors.length}건:`);
  for (const e of errors.slice(0, 12)) console.error(' - ' + e);
  process.exit(1);
}
console.log('\n오류 없이 끝났습니다.');
