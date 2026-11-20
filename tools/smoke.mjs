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
      // 가려진 선택지가 섞여 나왔으면 그 화면도 남긴다
      if (await has('.overlay.route .veiled')) await snap('routeVeiled');
      const cards = await page.$$('.overlay.route .card');
      await cards[Math.min(routePick, cards.length - 1)].tap();
    } else if (await has('.overlay.camp')) {
      await snap('camp');
      if (shots.campShop && !taken.has('campShop')) {
        taken.add('campShop');
        await tap('.overlay.camp [data-act="rest"]');
        await tap('.overlay.camp [data-act="shop"]');
      } else await tap('.overlay.camp [data-act="continue"]');
    } else if (await has('.overlay.find [data-opt]')) {
      // 수상한 보따리: 첫 번째 선택지
      await snap('find');
      await tap('.overlay.find [data-opt]');
    } else if (await has('.overlay.find [data-i]')) {
      // 가방이 가득 참: 가장 앞의 것을 버린다
      await snap('bagFull');
      await tap('.overlay.find [data-i]');
    } else if (await has('.panel.notice [data-act="ok"]')) {
      await snap('notice');
      await tap('.panel.notice [data-act="ok"]');
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
// 소리 설정 창: 음량을 바꾸면 기기에 저장되고, 화면을 한 번 누른 뒤에는 로비 음악이 나온다
await tap('.lobby [data-act="sound"]');
await page.$eval('[data-vol="music"]', (el) => {
  el.value = '45';
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await shot('sound-settings');
await tap('.sound-panel [data-act="ok"]');
const lobbySound = await page.evaluate(() => ({ ...window.__game.audio.now(), saved: JSON.parse(localStorage.getItem('tarcov.audio.v1') ?? 'null')?.music }));
console.log('  로비의 소리:', JSON.stringify(lobbySound));
if (lobbySound.music !== 'bgm.lobby') errors.push('로비 음악이 정해지지 않았습니다');
if (lobbySound.saved !== 0.45) errors.push('음량 설정이 저장되지 않았습니다');
if (!lobbySound.unlocked) errors.push('화면을 눌렀는데도 소리가 열리지 않았습니다');
await tap('[data-act="new"]');
await shot('formation');
await tap('.pets [data-pet="A"]');
await tap('.pets [data-pet="B"]');
const petMark = await page.evaluate(() => {
  const on = document.querySelector('.pets .pick.on');
  const off = document.querySelector('.pets .pick:not(.on)');
  return {
    pet: on?.dataset.pet,
    badge: !!on?.querySelector('.order'),
    differs: getComputedStyle(on).borderColor !== getComputedStyle(off).borderColor,
    status: document.querySelector('.form-status').textContent,
  };
});
if (petMark.pet !== 'B' || !petMark.badge || !petMark.differs) await fail(`고른 펫이 표시되지 않습니다: ${JSON.stringify(petMark)}`);
console.log('  펫 선택 표시:', JSON.stringify(petMark));
await shot('formation-pet');
await tap('[data-act="start"]');
await wait(600);
await shot('sector1-start');

// 스프라이트: public/sprites/index.json 에 등록된 캐릭터는 스프라이트로, 나머지는 도형으로 그려져야 한다
const spriteState = await page.evaluate(async () => {
  const index = await fetch('./sprites/index.json')
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  const g = window.__game;
  return g.world.party.members.map((m, i) => ({ id: m.def.id, registered: !!index[m.def.id], sprite: !!g.view.chars[i].body?.set?.clips }));
});
for (const s of spriteState) if (s.registered !== s.sprite) await fail(`스프라이트 표시가 등록 상태와 다릅니다: ${JSON.stringify(s)}`);
console.log('  캐릭터 표시:', spriteState.map((s) => `${s.id} ${s.sprite ? '스프라이트' : '도형'}`).join(', '));

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

// 소리: 섹터의 배경음이 정해졌는지, 효과음 파일을 다 받았는지, 싸우는 동안 효과음이 났는지
const battleSound = await page.evaluate(() => {
  const a = window.__game.audio;
  return { ...a.now(), cues: Object.keys(a.counts).sort() };
});
console.log('  전투의 소리:', JSON.stringify({ ...battleSound, cues: battleSound.cues.length }), battleSound.cues.join(' '));
if (battleSound.music !== 'bgm.s1' || battleSound.ambience !== 'amb.alley') errors.push('섹터의 배경음이 정해지지 않았습니다');
if (battleSound.loaded < 100) errors.push(`받아 둔 소리가 너무 적습니다 (${battleSound.loaded}개)`);
for (const need of ['ui.start', 'ui.pick', 'swap']) if (!battleSound.cues.includes(need)) errors.push(`"${need}" 소리가 나지 않았습니다`);
if (!battleSound.cues.some((c) => c.startsWith('swing') || c.startsWith('shot'))) errors.push('공격하는 소리가 나지 않았습니다');

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

// ---- 확대 막기: D패드와 공격·스킬 버튼을 함께 누른 채 두 손가락이 움직여도 조작이 끊기지 않는다 ----
// 아이폰 사파리는 확대 금지 설정을 다 따르지 않는다. 그 상황을 흉내 내려고 touch-action 을 일부러 끈다:
// 그러면 브라우저가 움직이는 터치를 가져가 화면을 밀거나 키우려 하고, 가져가면 조작이 끊긴다 (pointercancel).
// 터치 이벤트에서 직접 막아 두었으므로(src/input/noZoom.ts) 조작이 이어지고 화면 배율도 그대로여야 한다
const loose = await page.addStyleTag({ content: '*, *::before, *::after { touch-action: auto !important; }' });
const held = [];
for (const sel of ['.btn.attack', '.btn.active', '.btn.dodge', '.btn.pet']) {
  const btn = await center(sel);
  await touch('touchStart', [{ ...dpadUp, id: 1 }]);
  await wait(100);
  await touch('touchStart', [
    { ...dpadUp, id: 1 },
    { ...btn, id: 2 },
  ]);
  // 두 손가락이 서로 멀어진다 (두 손가락 벌리기와 같은 모양)
  for (let i = 1; i <= 6; i++) {
    await touch('touchMove', [
      { x: dpadUp.x - i * 8, y: dpadUp.y - i * 2, id: 1 },
      { x: btn.x + i * 8, y: btn.y - i * 3, id: 2 },
    ]);
    await wait(30);
  }
  const now = await page.evaluate(() => ({ dir: window.__game.input.state.dirActive, scale: window.visualViewport?.scale ?? 1 }));
  await touch('touchEnd', [{ x: dpadUp.x - 48, y: dpadUp.y - 12, id: 1 }]);
  await touch('touchEnd', []);
  await wait(120);
  const after = await page.evaluate(() => ({ ...window.__game.input.state, actions: undefined }));
  held.push(`${sel.replace('.btn.', '')} ${now.dir ? '이어짐' : '끊김'}`);
  if (!now.dir) errors.push(`D패드와 ${sel} 를 함께 누른 채 움직이자 이동 입력이 끊겼습니다 (브라우저가 터치를 가져갔습니다)`);
  if (now.scale > 1.01) errors.push(`D패드와 ${sel} 를 함께 누른 채 움직이자 화면이 확대됐습니다 (배율 ${now.scale})`);
  if (after.dirActive || after.attack) errors.push(`${sel}: 손을 뗀 뒤에도 입력이 남아 있습니다`);
}
await loose.evaluate((el) => el.remove());
console.log('  두 손가락을 움직여도 조작 유지:', held.join(', '));

// ---- 3. 보상 상자, NPC 이벤트, 팀 정보 -------------------------------------
await debug('invuln');
await tap('.overlay.team [data-act="resume"]');

// ---- 상호작용 버튼: 근처에 가도 자동으로 수색되지 않고, 버튼을 눌러야 시작된다 ----
const searchable = await page.evaluate(() => {
  const w = window.__game.world;
  const t = w.things.find((x) => !x.done && x.kind !== 'exit' && x.kind !== 'chest' && x.kind !== 'npc');
  if (!t) return null;
  w.party.x = t.x + 14;
  w.party.y = t.y + 14;
  return { id: t.id, kind: t.kind };
});
if (!searchable) await fail('수색할 오브젝트가 없습니다');
await wait(1200);
const prompt = await page.evaluate((id) => {
  const w = window.__game.world;
  const t = w.things.find((x) => x.id === id);
  const b = document.querySelector('.interact');
  const r = b.getBoundingClientRect();
  return { shown: !b.classList.contains('hidden'), text: b.innerText.replace(/\s+/g, ' ').trim(), progress: t.progress, done: t.done, left: r.left, right: r.right, cy: r.top + r.height / 2, w: Math.round(r.width), h: Math.round(r.height) };
}, searchable.id);
if (!prompt.shown) await fail(`상호작용 버튼이 뜨지 않았습니다: ${JSON.stringify(prompt)}`);
if (prompt.done || prompt.progress > 0) await fail(`버튼을 누르지 않았는데 수색이 진행됐습니다: ${JSON.stringify(prompt)}`);
await shot('interact-button');
// 보이는 버튼의 바깥쪽 여백(넓힌 터치 영역)을 눌러도 눌려야 한다
await page.touchscreen.tap(prompt.right + 14, prompt.cy);
await wait(1500);
const searched = await page.evaluate((id) => window.__game.world.things.find((x) => x.id === id).done, searchable.id);
if (!searched) await fail('상호작용 버튼을 눌렀는데 수색이 끝나지 않았습니다');
console.log('  상호작용 버튼:', JSON.stringify({ kind: searchable.kind, text: prompt.text, size: `${prompt.w}x${prompt.h}`, searched }));
await settle();

// 키보드: F 키로도 상호작용이 시작된다
const byKey = await page.evaluate(() => {
  const w = window.__game.world;
  const t = w.things.find((x) => !x.done && x.kind !== 'exit' && x.kind !== 'chest' && x.kind !== 'npc');
  if (!t) return null;
  w.party.x = t.x + 14;
  w.party.y = t.y + 14;
  return t.id;
});
if (byKey === null) console.log('  F 키 확인: 남은 수색 오브젝트가 없어 건너뜀');
else {
  await wait(500);
  await page.keyboard.press('KeyF');
  await wait(1500);
  const done = await page.evaluate((id) => window.__game.world.things.find((x) => x.id === id).done, byKey);
  if (!done) await fail('F 키를 눌렀는데 상호작용이 되지 않았습니다');
  console.log('  F 키 상호작용: 됨');
  await settle();
}

// ---- 귀중품: 수상한 보따리를 열어 선택하고, 가방이 가득 차면 버릴 것을 고른다 ----
const bagFlow = await page.evaluate(() => {
  const g = window.__game;
  const w = g.world;
  const before = g.run.bag.length;
  const t = w.addThing('stash', w.party.x + 30, w.party.y, 56);
  return { before, id: t.id };
});
await wait(400);
await page.keyboard.press('KeyF');
await wait(1400);
if (!(await has('.overlay.find [data-opt]'))) await fail('수상한 보따리를 열었는데 선택 창이 뜨지 않았습니다');
await settle({ find: 'valuable-find', notice: 'valuable-notice' });
const bagAfter = await page.evaluate(() => window.__game.run.bag.map((it) => it.id));
if (bagAfter.length !== bagFlow.before + 1) await fail(`귀중품이 가방에 들어가지 않았습니다: ${JSON.stringify(bagAfter)}`);
// 가방을 가득 채운 뒤 하나 더 얻으면 버릴 것을 골라야 한다
await page.evaluate(() => {
  const g = window.__game;
  while (g.run.bag.length < 4) g.run.bag.push({ id: 'key_ring', taint: null });
  void g.gainValuable({ id: 'moon_bead', taint: null }, '확인용');
});
await wait(300);
await settle({ bagFull: 'bag-full' });
const bagFinal = await page.evaluate(() => window.__game.run.bag.map((it) => it.id));
if (bagFinal.length !== 4 || !bagFinal.includes('moon_bead')) await fail(`가방이 가득 찼을 때의 교체가 잘못됐습니다: ${JSON.stringify(bagFinal)}`);
console.log('  귀중품:', JSON.stringify({ found: bagAfter, afterFull: bagFinal, hud: await page.textContent('.bagcount b') }));

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
await tap('.overlay.team [data-dbg="autoAim"]');
const aimOn = await page.evaluate(() => ({ text: document.querySelector('[data-dbg="autoAim"]').textContent, flag: window.__game.world.autoAimAll }));
if (!aimOn.flag || !aimOn.text.includes('켜짐')) await fail(`근거리 자동 조준이 켜지지 않았습니다: ${JSON.stringify(aimOn)}`);
await shot('team-debug');
await tap('.overlay.team [data-dbg="autoAim"]');
const aimOff = await page.evaluate(() => window.__game.world.autoAimAll);
if (aimOff) await fail('근거리 자동 조준이 꺼지지 않았습니다');
console.log('  디버그 자동 조준:', aimOn.text);
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
// 보스가 남긴 귀중품 알림(가방이 가득 차 있으면 버릴 것 고르기)을 넘기면 결과 화면이 나온다
await settle({ notice: 'boss-valuable' });
await wait(500);
await shot('run-result');
const traded = await page.evaluate(() => ({ exchange: !!document.querySelector('.exchange'), wallet: window.__game.save.wallet, bag: window.__game.run.bag.length }));
if (!traded.exchange || traded.wallet <= 0 || traded.bag !== 0) errors.push(`귀중품이 은화로 바뀌지 않았습니다: ${JSON.stringify(traded)}`);
console.log('  은화 교환:', JSON.stringify(traded));
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

// ---- 6b. 도전 모드: 컨텐츠와 난이도 → 출전할 조사 팀 → 진입 -------------------
if (await has('.deck [data-go]')) errors.push('로비의 조사 팀 목록에 도전 버튼이 남아 있습니다 (도전 모드로 옮겼다)');
await tap('.lobby [data-act="challenge"]');
await shot('challenge-contents');
const contents = await page.$$eval('.ch-box', (boxes) => boxes.map((box) => `${box.querySelector('h3').firstChild.textContent.trim()}${box.querySelector('.ch-target') ? ' · ' + box.querySelector('.ch-target').textContent : ''} (${box.querySelectorAll('.ch-level').length}단계)`));
console.log('  도전 모드의 컨텐츠:', contents.join(' / '));
if (contents.length < 3 || !contents.some((c) => c.includes('마녀 인형'))) errors.push('도전 모드에 시즌 2 보스 토벌이 없습니다');

// 시즌 1 보스 토벌 난이도 2 → 방금 저장된 조사 팀으로
await tap('[data-ch="raid"][data-level="2"]');
await shot('challenge-decks');
const deckRows = await page.$$eval('.ch-decks .deck', (rows) => rows.map((r) => r.querySelector('.deck-info b').textContent));
console.log('  고를 수 있는 조사 팀:', deckRows.join(' / '));
if (deckRows.length < 6) errors.push(`저장된 팀 1 + 테스트용 팀 5가 보여야 하는데 ${deckRows.length}팀입니다`);
await tap('.ch-decks .deck [data-go]');
await wait(500);
st = await worldState();
console.log('  특급 괴이 토벌 (시즌 1):', JSON.stringify(st));
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

// 결과에서 도전 모드로 돌아오면 방금의 기록이 컨텐츠 화면에 보인다
await tap('[data-act="mode"]');
await wait(300);
const bestShown = await page.$eval('[data-ch="raid"][data-level="2"] em', (el) => el.textContent);
console.log('  돌아온 도전 모드의 기록:', bestShown);
if (!(await has('.screen.challenge')) || bestShown.includes('없음')) errors.push('결과 뒤 도전 모드로 돌아오지 않았거나 기록이 보이지 않습니다');

// 시즌 2 보스 토벌 난이도 1 → 테스트용 조사 팀 (시즌 1에서 만든 팀도 시즌 2의 보스와 싸울 수 있다)
await tap('[data-ch="raid2"][data-level="1"]');
await tap('.ch-decks .deck [data-go="test3"]');
await wait(900);
const raid2 = await page.evaluate(() => {
  const g = window.__game;
  const w = g.world;
  const boss = w.enemies.find((e) => e.boss);
  return {
    name: w.setup.def.name,
    scene: w.setup.def.scene,
    boss: boss?.def.id,
    sprite: !!boss?.view && boss.view.constructor.name,
    team: w.party.members.map((m) => m.def.id).join(','),
    season: g.run.season,
    music: g.audio.now().music,
  };
});
console.log('  특급 괴이 토벌 (시즌 2):', JSON.stringify(raid2));
if (raid2.boss !== 'witch' || raid2.scene !== 'oz_stage') errors.push('시즌 2 보스 토벌이 마녀 인형의 무대에서 열리지 않았습니다');
if (raid2.team !== 'karen,yuna,roa') errors.push('고른 테스트용 조사 팀으로 시작하지 않았습니다');
if (raid2.music !== 'bgm.s2boss') errors.push('시즌 2 보스 토벌의 음악이 시즌 2 보스 음악이 아닙니다');
await page.keyboard.down('KeyW');
await wait(1500);
await page.keyboard.up('KeyW');
await page.keyboard.down('KeyJ');
await wait(3000);
await shot('raid2-fight');
await page.keyboard.up('KeyJ');
await debug('clearSector');
await wait(400);
await shot('raid2-result');
await tap('[data-act="mode"]');
await wait(300);

// 괴이 범람 → 테스트용 조사 팀
await shot('challenge-contents-with-records');
await tap('[data-ch="wave"]');
await tap('.ch-decks .deck [data-go="test4"]');
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
// 포기하면 도전 모드 화면으로, 거기서 로비로
if (!(await has('.screen.challenge'))) errors.push('도전 포기 뒤 도전 모드로 돌아오지 않았습니다');
await tap('.screen.challenge [data-act="back"]');
await wait(200);
if (!(await has('.lobby'))) errors.push('도전 모드에서 로비로 돌아오지 않았습니다');

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

// ---- 9. 시즌 2: 시즌 고르기 → 긴 맵(안개, 포자 버섯) → 극장 → 괴이 ------------
await tap('[data-season="2"]');
await shot('s2-lobby');
await tap('[data-act="new"]');
await tap('[data-act="start"]');
await wait(1200);
const s2 = await page.evaluate(async () => {
  const index = await fetch('./sprites/index.json')
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  const g = window.__game;
  const w = g.world;
  const kinds = [...new Set(w.enemies.map((e) => e.def.id))];
  return {
    season: g.run.season,
    scene: w.setup.def.scene,
    fog: w.setup.def.fog,
    mushrooms: w.mushrooms.length,
    road: w.plan.layout.road.reduce((a, b) => a + b, 0),
    monsters: kinds.map((id) => ({ id, registered: !!index[id], sprite: !!w.enemies.find((e) => e.def.id === id)?.view?.body?.set })),
  };
});
console.log('  시즌 2 진입:', JSON.stringify(s2));
if (s2.season !== 2 || s2.scene !== 'oz_field') errors.push(`시즌 2의 첫 섹터에 들어가지 못했습니다: ${JSON.stringify(s2)}`);
if (!(s2.fog > 0) || s2.mushrooms === 0 || s2.road === 0) errors.push('시즌 2의 긴 맵에 안개·포자 버섯·길이 없습니다');
for (const m of s2.monsters) if (m.registered !== m.sprite) errors.push(`몬스터 스프라이트 표시가 등록 상태와 다릅니다: ${JSON.stringify(m)}`);
await shot('s2-field');

// 포자 버섯: 다가가면 부풀었다가 포자를 뿜고, 구름 안에서 중독된다
await page.evaluate(() => {
  const w = window.__game.world;
  for (const e of w.enemies) e.stunT = 99;
  const s = w.mushrooms[0];
  w.party.x = s.x - 46;
  w.party.y = s.y + 6;
});
await wait(350);
await shot('s2-mushroom-swell');
// 뿜은 뒤 구름의 첫 판정(0.5초)까지 기다린다
await wait(2200);
const spore = await page.evaluate(() => {
  const w = window.__game.world;
  return { cloud: w.zones.some((z) => z.look === 'spore'), poison: w.party.active.buffs.some((b) => b.id === 'poison'), icon: !!document.querySelector('.st.bad') };
});
console.log('  포자 버섯:', JSON.stringify(spore));
if (!spore.cloud || !spore.poison || !spore.icon) errors.push(`포자 버섯이 터지지 않았거나 중독이 표시되지 않습니다: ${JSON.stringify(spore)}`);
await shot('s2-spore-cloud');

// 긴 맵 → 캠프 → 경로 선택 → 숲 → 극장 → 괴이
const scenes = [];
for (let i = 0; i < 6; i++) {
  st = await worldState();
  if (!st || st.type === 'boss') break;
  scenes.push(await page.evaluate(() => window.__game.world.setup.def.scene));
  await debug('clearSector');
  await settle({ route: 's2-route', routeVeiled: 's2-route-veiled', camp: 's2-camp' }, 0);
  await wait(500);
  if (i === 0) await shot('s2-forest');
  if (i === 1) await shot('s2-stage');
}
st = await worldState();
console.log('  시즌 2 진행:', scenes.join(' → '), '→', JSON.stringify(st));
if (st?.type !== 'boss' || !scenes.includes('oz_forest') || !scenes.includes('oz_stage')) errors.push('시즌 2의 괴이 섹터에 도달하지 못했습니다');
await debug('invuln');
await tap('.overlay.team [data-act="resume"]');
await page.keyboard.down('KeyW');
await wait(1200);
await page.keyboard.up('KeyW');
await page.keyboard.down('KeyJ');
await wait(3200);
await shot('s2-boss-fight');
await page.evaluate(() => {
  const boss = window.__game.world.enemies.find((e) => e.boss);
  boss.hp = boss.maxHp * 0.6;
});
await wait(6500);
await shot('s2-boss-phase2');
await page.keyboard.up('KeyJ');
const bossState = await page.evaluate(() => {
  const w = window.__game.world;
  const boss = w.enemies.find((e) => e.boss);
  return { id: boss?.def.id, phase: boss?.vars.phase, sprite: !!boss?.view?.body?.set };
});
console.log('  시즌 2 괴이:', JSON.stringify(bossState));
if (bossState.id !== 'witch' || bossState.phase < 2) errors.push(`시즌 2 괴이의 페이즈가 넘어가지 않았습니다: ${JSON.stringify(bossState)}`);
await debug('clearSector');
await settle({ notice: 's2-boss-valuable' });
await wait(500);
await shot('s2-run-result');
if (!(await has('.score'))) errors.push('시즌 2 런 결과 화면이 나오지 않았습니다');
await tap('[data-act="ok"]');
await wait(300);

await browser.close();
await server.close();

if (errors.length) {
  console.error(`\n문제 ${errors.length}건:`);
  for (const e of errors.slice(0, 12)) console.error(' - ' + e);
  process.exit(1);
}
console.log('\n오류 없이 끝났습니다.');
