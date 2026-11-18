// 시즌 2 "소원을 삼키는 나라" 검사: 시즌별 표, 가려진 경로와 돌발 사건, 포자 버섯, 지속 피해, 보스, 런 자동 플레이
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { db } from '../src/data/tables';
import { AI } from '../src/game/enemy/ai';
import { EQUIP_SKILLS } from '../src/game/equip/equipSkills';
import { emptyInput } from '../src/game/input';
import { chooseRoute, onSectorClear, rollRouteOptions } from '../src/game/run/flow';
import { RunState } from '../src/game/run/RunState';
import { teamScore } from '../src/game/run/score';
import { buildSector, type SectorSetup } from '../src/game/run/sector';
import { World } from '../src/game/world/World';
import { playRun } from './helpers/play';

const TEAM = ['serin', 'mido', 'sia'];

function season2(sector = 1): RunState {
  const run = RunState.create(TEAM, 'B', 'form', 2);
  run.sector = sector;
  return run;
}

/** 조건에 맞는 섹터 구성이 나올 때까지 시드를 바꿔 가며 만든다 */
function findSetup(run: RunState, want: (s: SectorSetup) => boolean): { setup: SectorSetup; rng: Rng } {
  for (let seed = 1; seed < 600; seed++) {
    const rng = new Rng(seed);
    const setup = buildSector(run, db.sector(run.sector), rng);
    if (want(setup)) return { setup, rng };
  }
  throw new Error('조건에 맞는 섹터 구성을 찾지 못했습니다');
}

function step(w: World, seconds: number, dt = 1 / 30): void {
  const input = emptyInput();
  for (let t = 0; t < seconds && !w.over; t += dt) w.update(dt, input);
}

describe('시즌별 표', () => {
  it('두 시즌 모두 시즌 스킬 13개, 장비 스킬 21개(슬롯마다 7개), 귀중품 13개를 갖는다', () => {
    for (const s of db.seasons) {
      expect(db.upgradeList.filter((u) => u.category === 'season' && u.season === s.id), `시즌 ${s.id} 시즌 스킬`).toHaveLength(13);
      const equip = db.equipSkillList.filter((k) => k.season === s.id);
      expect(equip, `시즌 ${s.id} 장비 스킬`).toHaveLength(21);
      for (const slot of ['weapon', 'armor', 'acc']) expect(equip.filter((k) => k.slot === slot), `시즌 ${s.id} ${slot}`).toHaveLength(7);
      expect(db.valuableList.filter((v) => v.season === s.id), `시즌 ${s.id} 귀중품`).toHaveLength(13);
    }
  });

  it('모든 몬스터의 행동 규칙과 모든 장비 스킬에 구현이 있다', () => {
    for (const m of db.monsters.values()) expect(AI[m.ai], `${m.id}의 행동 규칙 ${m.ai}`).toBeTypeOf('function');
    for (const k of db.equipSkillList) expect(EQUIP_SKILLS[k.id], `장비 스킬 ${k.id}`).toBeDefined();
  });

  it('시즌 2는 긴 맵 둘(꽃길, 숲) → 극장 셋 → 보스 순서이고, 뒤로 갈수록 몬스터가 강해진다', () => {
    season2();
    const main = db.sectors.filter((s) => s.type !== 'bonus').sort((a, b) => a.index - b.index);
    expect(main.map((s) => s.scene)).toEqual(['oz_field', 'oz_forest', 'oz_stage', 'oz_stage', 'oz_stage', 'oz_stage']);
    expect(main[main.length - 1].type).toBe('boss');
    expect(main[0].fog).toBeGreaterThan(0);
    expect(main[1].fog).toBeGreaterThan(main[0].fog);
    for (let i = 1; i < main.length; i++) expect(main[i].depth).toBeGreaterThanOrEqual(main[i - 1].depth);
    // 긴 맵은 극장 섹터보다 훨씬 넓다
    const tiles = (name: string): number => db.mapText(name).replace(/\s/g, '').length;
    expect(tiles(main[0].map)).toBeGreaterThan(tiles(main[2].map) * 1.5);
    // 런을 만들면 그 시즌의 것만 조회된다
    expect(db.packs.every((p) => p.season === 2)).toBe(true);
    expect(db.equipPool.every((k) => k.season === 2)).toBe(true);
    RunState.create(TEAM, 'B', 'form', 1);
    expect(db.sectors.every((s) => s.season === 1)).toBe(true);
  });
});

describe('가려진 경로', () => {
  it('가려진 선택지가 섞여 나오고, 실제 위험과 보상이 서로 따로 정해진다', () => {
    const run = season2(3);
    const cleared = db.sector(3);
    let hidden = 0;
    const combos = new Set<string>();
    const masks = new Set<string>();
    for (let seed = 1; seed <= 400; seed++) {
      const options = rollRouteOptions(cleared, new Rng(seed), run);
      // 일반 경로는 언제나 보이는 채로 남는다
      expect(options.some((o) => o.id === 'normal' && !o.hidden)).toBe(true);
      expect(options.filter((o) => !o.bonus).length).toBeLessThanOrEqual(3);
      const h = options.find((o) => o.hidden);
      if (!h) continue;
      hidden++;
      expect(h.hidden!.risk || h.hidden!.reward).toBe(true);
      combos.add(`${h.route!.id}/${h.reward}`);
      masks.add(`${h.hidden!.risk ? 1 : 0}${h.hidden!.reward ? 1 : 0}`);
      // 가려진 것은 설명에 드러나지 않는다
      if (h.hidden!.risk) expect(h.desc).not.toContain(h.route!.name);
    }
    const chance = db.pct('route.hiddenChance');
    expect(hidden / 400).toBeGreaterThan(chance - 0.1);
    expect(hidden / 400).toBeLessThan(chance + 0.1);
    // 약한 무리에 좋은 보상도, 특급 괴이에 평범한 보상도 나온다
    expect(combos.has('normal/3')).toBe(true);
    expect(combos.has('special/1')).toBe(true);
    expect([...masks].sort()).toEqual(['01', '10', '11']);
  });

  it('가려진 선택지를 고르면 그 위험과 보상이 다음 섹터에 적용되고 팀 점수가 붙는다', () => {
    const run = season2(3);
    const cleared = db.sector(3);
    let seed = 1;
    let pick = rollRouteOptions(cleared, new Rng(seed), run).find((o) => o.hidden);
    while (!pick || pick.route!.id !== 'normal' || pick.reward !== 3) pick = rollRouteOptions(cleared, new Rng(++seed), run).find((o) => o.hidden);
    run.sector = 4;
    chooseRoute(run, pick);
    expect(run.route).toBe('normal');
    expect(run.routeHidden).toBe(true);
    const setup = buildSector(run, db.sector(4), new Rng(3));
    expect(setup.route.id).toBe('normal');
    // 운수 좋은 날(돌발 사건)이 겹쳐도 3을 넘지 않는다
    expect(setup.rewardQuality).toBe(3);
    const before = teamScore(run).routes;
    onSectorClear(run, db.sector(4), new Rng(1));
    expect(teamScore(run).routes - before).toBe(db.P('route.hiddenScore'));
    expect(run.routeHidden).toBe(false);
    expect(run.routeReward).toBe(0);
    // 저장했다 되살려도 가려진 경로의 상태가 남는다
    chooseRoute(run, pick);
    const back = RunState.fromJSON(JSON.parse(JSON.stringify(run.toJSON())))!;
    expect(back.season).toBe(2);
    expect(back.routeHidden).toBe(true);
    expect(back.routeReward).toBe(3);
  });

  it('초록 안경이 있으면 위험이 보이고, 희귀 등급부터는 보상도 보인다', () => {
    const run = season2(3);
    const glasses = (rarity: number): void => {
      run.equipment = { serin: { acc: { uid: 'g', slot: 'acc', skill: 'c2_glasses', rarity, opts: [] } } };
    };
    const roll = (): { risk: number; reward: number } => {
      let risk = 0;
      let reward = 0;
      for (let seed = 1; seed <= 200; seed++) {
        const h = rollRouteOptions(db.sector(3), new Rng(seed), run).find((o) => o.hidden);
        if (h?.hidden?.risk) risk++;
        if (h?.hidden?.reward) reward++;
      }
      return { risk, reward };
    };
    expect(roll().risk).toBeGreaterThan(0);
    glasses(1);
    expect(roll().risk).toBe(0);
    expect(roll().reward).toBeGreaterThan(0);
    glasses(2);
    expect(roll()).toEqual({ risk: 0, reward: 0 });
  });
});

describe('돌발 사건', () => {
  it('일반 섹터에서만, 정해진 확률쯤으로 일어난다', () => {
    const run = season2(3);
    let n = 0;
    for (let seed = 1; seed <= 400; seed++) if (buildSector(run, db.sector(3), new Rng(seed)).surprise) n++;
    expect(n / 400).toBeGreaterThan(db.pct('event.chance') - 0.1);
    expect(n / 400).toBeLessThan(db.pct('event.chance') + 0.1);
    run.sector = 6;
    for (let seed = 1; seed <= 40; seed++) expect(buildSector(run, db.sector(6), new Rng(seed)).surprise).toBeNull();
  });

  it('난입: 조금 뒤 특급 괴이가 파티 근처에 나타나고, 쓰러뜨리면 영웅 이상 보상 상자가 나온다', () => {
    const run = season2(3);
    const { setup, rng } = findSetup(run, (s) => s.surprise?.id === 'ambush');
    const w = new World(run, setup, rng);
    w.cheatInvuln = true;
    const before = w.enemies.length;
    step(w, setup.surprise!.v1 + 0.2);
    expect(w.enemies.length).toBe(before + 1);
    const boss = w.enemies[w.enemies.length - 1];
    expect(boss.grade.grade).toBe(2);
    expect(db.seasonDef.mediums).toContain(boss.def.id);
    expect(Math.hypot(boss.x - w.party.x, boss.y - w.party.y)).toBeLessThan(420);
    w.kill(boss, null);
    expect(w.things.some((t) => t.kind === 'chest' && t.quality === 3)).toBe(true);
  });

  it('떨어진 보급품과 떠돌이 상인: 맵의 빈 후보 자리에 놓인다', () => {
    const run = season2(3);
    const cache = findSetup(run, (s) => s.surprise?.id === 'cache');
    const w1 = new World(run, cache.setup, cache.rng);
    const chest = w1.things.find((t) => t.kind === 'chest');
    expect(chest?.quality).toBe(cache.setup.surprise!.v1);
    // 수색 오브젝트나 NPC와 겹치지 않는다
    expect(w1.things.filter((t) => t.x === chest!.x && t.y === chest!.y)).toHaveLength(1);
    expect(w1.quest().surprise).toBe(cache.setup.surprise!.name);

    const merchant = findSetup(run, (s) => s.surprise?.id === 'merchant');
    const w2 = new World(run, merchant.setup, merchant.rng);
    expect(w2.things.filter((t) => t.kind === 'npc' && t.data === 'shop')).toHaveLength(1);
  });

  it('몰려든 무리와 운수 좋은 날: 무리가 커지고 조각이 늘거나, 클리어 보상이 한 단계 오른다', () => {
    const run = season2(3);
    const horde = findSetup(run, (s) => s.surprise?.id === 'horde').setup;
    expect(horde.shardMult).toBeCloseTo(horde.route.shardMult * (1 + horde.surprise!.v2 / 100));
    const fortune = findSetup(run, (s) => s.surprise?.id === 'fortune').setup;
    expect(fortune.rewardQuality).toBe(Math.min(3, fortune.route.quality + fortune.surprise!.v1));
  });
});

describe('포자 버섯과 지속 피해', () => {
  it('안개 낀 섹터에만, 길과 시작 지점을 피해 놓인다', () => {
    const run = season2(1);
    const setup = buildSector(run, db.sector(1), new Rng(5));
    expect(setup.mushrooms.length).toBeGreaterThan(3);
    for (const s of setup.mushrooms) expect(Math.hypot(s.x - setup.plan.start.x, s.y - setup.plan.start.y)).toBeGreaterThan(100);
    run.sector = 3;
    expect(buildSector(run, db.sector(3), new Rng(5)).mushrooms).toHaveLength(0);
  });

  it('다가가면 부풀었다가 포자를 뿜고, 구름 안의 파티와 몬스터가 함께 중독된다. 독만으로는 쓰러지지 않는다', () => {
    const run = season2(1);
    const rng = new Rng(7);
    const w = new World(run, buildSector(run, db.sector(1), rng), rng);
    const s = w.mushrooms[0];
    const p = w.party;
    const m = p.active;
    const e = w.enemies.find((x) => !x.boss)!;
    e.x = s.x + 60;
    e.y = s.y;
    const hp = e.hp;
    p.x = s.x - 40;
    p.y = s.y;
    // 몬스터가 때리는 것과 섞이지 않게 나머지는 치운다
    for (const o of w.enemies) if (o !== e) w.kill(o, null, true);
    e.stunT = 99;
    step(w, 0.2);
    expect(s.state).toBe('swell');
    expect(w.zones.some((z) => z.look === 'spore')).toBe(false);
    step(w, db.P('mushroom.delay') + 0.6);
    expect(s.state).toBe('rest');
    expect(w.zones.some((z) => z.look === 'spore')).toBe(true);
    expect(m.buffs.some((b) => b.id === 'poison' && b.bad && b.key)).toBe(true);
    expect(e.hasDebuff('poison')).toBe(true);
    step(w, 3);
    expect(e.hp).toBeLessThan(hp);
    expect(m.hp).toBeLessThan(m.stats.maxHp);
    // 체력이 바닥이어도 독으로는 쓰러지지 않는다
    m.hp = 2;
    step(w, 3);
    expect(m.dead).toBe(false);
    expect(m.hp).toBeGreaterThanOrEqual(1);
    // 쉬는 동안에는 다시 건드려도 뿜지 않고, 시간이 지나면 다시 뿜을 수 있다
    w.poke(s);
    expect(s.state).toBe('rest');
    p.x = s.x + 2000;
    step(w, db.P('mushroom.cooldown'));
    expect(s.state).toBe('idle');
  });

  it('공격이 닿아도 터진다 (멀리서 쏴서 몬스터 쪽에 터뜨릴 수 있다)', () => {
    const run = season2(1);
    const rng = new Rng(9);
    const w = new World(run, buildSector(run, db.sector(1), rng), rng);
    const s = w.mushrooms[0];
    w.areaHit(s.x + 30, s.y, 40, { m: null, mult: 1, kind: 'pet' });
    expect(s.state).toBe('swell');
    const s2 = w.mushrooms[1];
    w.party.x = s2.x - 300;
    w.party.y = s2.y;
    w.shoot({ x: s2.x - 200, y: s2.y, angle: 0, speed: 900, range: 400, r: 8, look: 'bullet', color: 0xffffff, hit: { m: null, mult: 1, kind: 'pet' }, wall: false });
    step(w, 0.4);
    expect(s2.state).not.toBe('idle');
  });

  it('시즌 스킬 "독버섯 길들이기"는 팀이 받는 독을 줄인다', () => {
    const run = season2(1);
    const rng = new Rng(7);
    const w = new World(run, buildSector(run, db.sector(1), rng), rng);
    w.afflict('poison', 3, 10);
    const base = w.party.active.buffs.find((b) => b.id === 'poison')!.dot!;
    run.addUpgrade('s2_spore', 2);
    w.party.active.buffs.length = 0;
    w.afflict('poison', 3, 10);
    expect(w.party.active.buffs.find((b) => b.id === 'poison')!.dot!).toBeCloseTo(base * (1 - (2 * db.upgrade('s2_spore').v2) / 100));
  });

  it('화상·중독·출혈은 0.5초마다 초당 피해만큼 들어간다', () => {
    const run = season2(3);
    const rng = new Rng(3);
    const w = new World(run, buildSector(run, db.sector(3), rng), rng);
    const e = w.enemies.find((x) => x.def.size === 'M')!;
    e.stunT = 99;
    w.party.x = e.x + 4000;
    const hp = e.hp;
    e.addDebuff('burn', 2.05, 40);
    e.addDebuff('poison', 2.05, 10);
    step(w, 3);
    expect(hp - e.hp).toBeGreaterThanOrEqual(90);
    expect(hp - e.hp).toBeLessThanOrEqual(110);
  });
});

describe('보스: 부서져 가는 마녀 인형', () => {
  it('체력이 내려가면 페이즈가 바뀌며 잔상·불의 파도·필살기를 쓰고, 쓰러뜨리면 섹터가 끝난다', () => {
    const run = season2(6);
    const rng = new Rng(11);
    const w = new World(run, buildSector(run, db.sector(6), rng), rng);
    w.cheatInvuln = true;
    const boss = w.enemies.find((e) => e.boss)!;
    expect(boss.def.id).toBe('witch');
    const p = w.party;
    p.x = boss.x - 200;
    p.y = boss.y;
    const seen = new Set<string>();
    const watch = (seconds: number): void => {
      const input = emptyInput();
      for (let t = 0; t < seconds && !w.over; t += 1 / 30) {
        w.update(1 / 30, input);
        for (const z of w.zones) seen.add(z.look);
        if (w.projectiles.some((q) => q.team === 'enemy')) seen.add('shot');
      }
    };
    watch(14);
    expect(boss.vars.phase).toBe(1);
    expect(seen.has('tele')).toBe(true);
    expect(seen.has('shot')).toBe(true);
    expect(seen.has('burn')).toBe(true);
    expect(seen.has('clone')).toBe(false);

    boss.hp = boss.maxHp * 0.6;
    const before = w.enemies.length;
    watch(16);
    expect(boss.vars.phase).toBe(2);
    expect(w.enemies.length).toBeGreaterThan(before);
    expect(seen.has('clone')).toBe(true);
    expect(seen.has('teleLine')).toBe(true);

    boss.hp = boss.maxHp * 0.3;
    watch(12);
    expect(boss.vars.phase).toBe(3);
    expect(boss.invuln).toBe(false);

    w.kill(boss, null);
    watch(3);
    expect(w.over).toBe('clear');
    expect(run.bossKilled).toBe(true);
  });

  it('불에 맞으면 화상이 걸린다', () => {
    const run = season2(6);
    const rng = new Rng(11);
    const w = new World(run, buildSector(run, db.sector(6), rng), rng);
    const boss = w.enemies.find((e) => e.boss)!;
    const p = w.party;
    p.x = boss.x - 120;
    p.y = boss.y;
    const m = p.active;
    m.hp = m.stats.maxHp = 1e7;
    let burned = false;
    const input = emptyInput();
    for (let t = 0; t < 30 && !burned; t += 1 / 30) {
      w.update(1 / 30, input);
      burned = m.buffs.some((b) => b.id === 'burn');
    }
    expect(burned).toBe(true);
  });
});

describe('시즌 2 런 자동 플레이', () => {
  it.each([
    [31, 'normal', ['serin', 'mido', 'sia'], 'B'],
    [32, 'hidden', ['karen', 'raon', 'yuna'], 'A'],
    [33, 'elite', ['haru', 'roa', 'eve'], 'C'],
  ] as const)('시드 %i, %s 경로, 팀 %j, 펫 %s — 끝까지 진행한다', (seed, routeId, team, petId) => {
    const { run, log, outcome, stuck } = playRun(seed, routeId, [...team], petId, 2, 900);
    console.table(log);
    console.log(`결과: ${outcome} · 클리어 섹터 ${run.cleared} · 팀 점수 ${teamScore(run).total} · ${Math.round(run.time / 60)}분`);
    expect(outcome, stuck).not.toBe('stuck');
    expect(run.season).toBe(2);
    // 시즌 2에서는 시즌 2의 스킬과 장비만 나온다
    for (const id of Object.keys(run.upgrades)) {
      const u = db.upgrade(id);
      if (u.category === 'season') expect(u.season, id).toBe(2);
    }
    for (const { item } of run.allItems()) expect(db.equipSkill(item.skill).season, item.skill).toBe(2);
    if (outcome === 'boss') {
      expect(run.bossKilled).toBe(true);
      expect(run.cleared).toBe(db.lastSector);
    }
  }, 300000);
});
