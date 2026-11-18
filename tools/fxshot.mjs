// 캐릭터별 스킬 이펙트를 화면 없는 브라우저로 찍어 한 장으로 모은다 (이펙트를 손볼 때 확인용).
//
//   npm run build && node tools/fxshot.mjs [캐릭터 id …] [--out 폴더]
//
// 게임 시계를 멈추고 한 걸음씩 직접 진행시키며 찍으므로, 느린 컴퓨터에서도 같은 순간이 찍힌다.
// 캐릭터마다 기본 공격 → 액티브 → 궁극기 순서로 한 줄씩(궁극기는 두 줄) 늘어놓은 그림을 만든다.
// 결과: tools/.out/fx/<id>.png
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { preview } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const outAt = argv.indexOf('--out');
const OUT = outAt >= 0 ? argv[outAt + 1] : join(ROOT, 'tools', '.out', 'fx');
const want = argv.filter((a, i) => !a.startsWith('--') && (outAt < 0 || i !== outAt + 1));
mkdirSync(OUT, { recursive: true });

const ALL = ['serin', 'mido', 'sia', 'karen', 'raon', 'yuna', 'haru', 'roa', 'eve'];
const ids = want.length ? want : ALL;
// 편성은 3명이어야 하므로 모자라는 자리는 다른 캐릭터로 채운다
const teams = [];
for (let i = 0; i < ids.length; i += 3) {
  const team = ids.slice(i, i + 3);
  for (const id of ALL) if (team.length < 3 && !team.includes(id)) team.push(id);
  teams.push({ team, shoot: ids.slice(i, i + 3) });
}

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
const VIEW = { width: 1100, height: 620 };
const CELL = { width: 440, height: 300 };
const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 });
await context.addInitScript(() => localStorage.clear());
const page = await context.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e.stack ?? e)));

/** 게임 시계를 sec 만큼 직접 진행시키고 화면을 그린다 */
const step = (sec) =>
  page.evaluate((s) => {
    const g = window.__game;
    const n = Math.max(1, Math.round(s * 60));
    for (let i = 0; i < n; i++) g.frame(1 / 60);
    g.stage.app.render();
  }, sec);

/** 지금 화면에서 필드 캐릭터 둘레를 잘라 찍는다 */
async function grab() {
  const c = await page.evaluate(() => {
    const g = window.__game;
    const layer = g.stage.world;
    const p = g.world.party;
    return { x: layer.x + p.x * layer.scale.x, y: layer.y + p.y * layer.scale.y };
  });
  // 적을 오른쪽에 세워 두었으므로 오른쪽을 더 넓게 잡는다
  const x = Math.max(0, Math.min(VIEW.width - CELL.width, Math.round(c.x - CELL.width * 0.3)));
  const y = Math.max(0, Math.min(VIEW.height - CELL.height, Math.round(c.y - CELL.height * 0.58)));
  return page.screenshot({ clip: { x, y, ...CELL } });
}

for (const { team, shoot } of teams) {
  await page.goto(url);
  await page.waitForSelector('.lobby, .fatal', { timeout: 15000 });
  await page.click('[data-act="new"]');
  await page.waitForSelector('.pick[data-char]');
  // 고른 캐릭터를 모두 풀고 원하는 셋을 순서대로 고른다
  for (let i = 0; i < 4; i++) {
    const on = await page.$('.pick[data-char].on');
    if (!on) break;
    await on.click();
  }
  for (const id of team) await page.click(`.pick[data-char="${id}"]`);
  await page.click('[data-act="start"]');
  await page.waitForFunction(() => !!window.__game?.world, null, { timeout: 15000 });
  await page.waitForTimeout(1500);

  // 시계를 멈추고, 적 네 마리를 파티 오른쪽에 세워 둔다 (죽지도 움직이지도 않게)
  await page.evaluate(() => {
    const g = window.__game;
    g.stage.app.ticker.stop();
    const w = g.world;
    const p = w.party;
    const es = w.enemies.filter((e) => !e.dead).slice(0, 4);
    p.x = es[0].x - 170;
    p.y = es[0].y;
    const ox = p.x;
    const oy = p.y;
    const spots = [
      [150, 0],
      [215, -72],
      [235, 64],
      [330, 8],
    ];
    es.forEach((e, i) => {
      e.x = ox + spots[i][0];
      e.y = oy + spots[i][1];
    });
    for (const e of w.enemies) if (!es.includes(e)) w.kill(e, null, true);
    window.__hold = () => {
      p.invulnT = 1e9;
      p.x = ox;
      p.y = oy;
      es.forEach((e, i) => {
        e.hp = e.maxHp = 1e9;
        e.dead = false;
        e.x = ox + spots[i][0];
        e.y = oy + spots[i][1];
        e.kx = e.ky = 0;
        e.stun(5);
      });
    };
    window.__hold();
  });

  for (const id of shoot) {
    const index = team.indexOf(id);
    // 교체 (쿨타임을 지우고 숫자 키로)
    await page.evaluate(() => {
      const p = window.__game.world.party;
      p.swapCd = 0;
      p.lock = 0;
      window.__hold();
    });
    await page.keyboard.press(`Digit${index + 1}`);
    await step(0.6);
    // 오른쪽을 보게 한다
    await page.keyboard.down('KeyD');
    await step(0.05);
    await page.keyboard.up('KeyD');
    await page.evaluate(() => window.__hold());
    await step(0.3);

    const rows = [];
    const shootRow = async (count, gap) => {
      const cells = [];
      for (let i = 0; i < count; i++) {
        await step(gap);
        cells.push(await grab());
      }
      rows.push(cells);
    };

    // 1) 기본 공격: 누른 채로
    await page.keyboard.down('KeyJ');
    await shootRow(5, 0.12);
    await page.keyboard.up('KeyJ');
    await step(0.7);
    await page.evaluate(() => window.__hold());

    // 2) 액티브
    await page.evaluate(() => {
      const p = window.__game.world.party;
      const m = p.active;
      m.cd = 0;
      m.charges = m.maxCharges();
      p.lock = 0;
    });
    await page.keyboard.press('KeyL');
    await shootRow(5, 0.11);
    await step(1.2);
    await page.evaluate(() => window.__hold());

    // 3) 궁극기 (두 줄)
    await page.evaluate(() => {
      const p = window.__game.world.party;
      p.active.ult = 1e6;
      p.lock = 0;
    });
    await page.keyboard.press('KeyI');
    await shootRow(5, 0.1);
    await shootRow(5, 0.16);
    await step(2.5);
    await page.evaluate(() => window.__hold());

    const sheet = sharp({ create: { width: CELL.width * 5, height: CELL.height * rows.length, channels: 3, background: '#000' } }).composite(
      rows.flatMap((cells, r) => cells.map((input, c) => ({ input, left: c * CELL.width, top: r * CELL.height }))),
    );
    await sheet.png().toFile(join(OUT, `${id}.png`));
    console.log(`  ${id}: ${join(OUT, `${id}.png`)}`);
  }
}

await browser.close();
await server.close();
if (errors.length) {
  console.error(`콘솔 오류 ${errors.length}건:\n${[...new Set(errors)].slice(0, 8).join('\n')}`);
  process.exit(1);
}
console.log('끝');
