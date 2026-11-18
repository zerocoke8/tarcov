// 게임 전체 진행: 로비 → 팀 편성 → 섹터 전투 → 보상·경로·캠프 → … → 보스 → 조사 팀 저장.
// 규칙(World, game/run), 표시(WorldView), 입력(Input), HUD, 화면(Ui)을 이어 준다.
import { Rng } from './core/rng';
import { db } from './data/tables';
import { ATTRS } from './data/types';
import type { Thing } from './game/entities';
import { RAID_NAME, buildChallenge, raidGrade, submitRecord, type Challenge } from './game/run/challenge';
import { rollEvent } from './game/run/events';
import { chooseRoute, healRunTeam, onSectorClear } from './game/run/flow';
import { rollChoices } from './game/run/rewards';
import { RunState } from './game/run/RunState';
import {
  addDeck,
  loadSave,
  makeDeck,
  runFromDeck,
  writeSave,
  type Deck,
  type DeckOutcome,
  type SaveData,
} from './game/run/save';
import { buildSector, currentSectorDef, seasonMonsterIds } from './game/run/sector';
import { rollShop } from './game/run/shop';
import { World, type FinishResult } from './game/world/World';
import { Input } from './input/Input';
import type { Stage } from './render/Stage';
import { TIER_NAME, bagAdd, bagDiscard, bagValue, exchange, resolveFind, rollFind, rollTier, rollValuable, valueOf, type BagItem } from './game/run/valuables';
import { fxArt } from './render/fxArt';
import { scenery } from './render/scenery';
import { valuableIcon } from './ui/portraits';
import { sprites } from './render/sprites/SpriteStore';
import { WorldView } from './render/WorldView';
import { Hud } from './ui/hud';
import { Ui, type ChallengeResultInfo, type DebugActions } from './ui/Ui';

export class Game {
  private view: WorldView;
  private input = new Input();
  private hud: Hud;
  private ui: Ui;
  private rng = new Rng();
  private save: SaveData = loadSave();
  private world: World | null = null;
  private run: RunState | null = null;
  /** 덱 컨텐츠에 도전 중이면 그 조사 팀과 컨텐츠 */
  private challenge: { deck: Deck; c: Challenge } | null = null;
  /** 디버그 옵션: 근거리 캐릭터도 자동 조준. 켜 두면 다음 섹터에도 이어진다 */
  private debugAutoAim = false;

  constructor(
    private stage: Stage,
    uiRoot: HTMLElement,
  ) {
    this.view = new WorldView(stage);
    this.hud = new Hud(uiRoot, this.input, {
      onInfo: () => void this.openTeam(),
      onPause: () => void this.openTeam(),
      onMap: () => {
        if (this.world && !this.world.over && !this.ui.open) void this.ui.map(this.world);
      },
    });
    this.ui = new Ui(uiRoot);
    this.ui.onChange = () => this.syncInput();

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') void this.openTeam();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) void this.openTeam();
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    stage.app.ticker.add((t) => this.frame(t.deltaMS / 1000));
    void this.lobby();
  }

  // ---- 매 프레임 ----------------------------------------------------------

  private frame(dt: number): void {
    // 늦게 도착한 그림도 도착하는 대로 한 프레임에 한 장씩 올려 둔다
    this.stage.uploadTextures();
    const w = this.world;
    if (!w) return;
    // 탭이 멈췄다 돌아왔을 때 한꺼번에 많이 진행되지 않게 한다
    const step = Math.min(dt, 0.05);
    const paused = this.ui.open;
    if (!paused) w.update(step, this.input.state);
    this.view.sync(w, paused ? 0 : step);
    const layer = this.stage.world;
    this.hud.place(layer.x + w.party.x * layer.scale.x, layer.y + w.party.y * layer.scale.y, layer.scale.x);
    this.hud.update(w, step);
  }

  /** 창이 떠 있거나 전투가 끝났으면 조작을 받지 않는다 */
  private syncInput(): void {
    this.input.setEnabled(!this.ui.open && !!this.world && !this.world.over);
  }

  private persist(): void {
    writeSave(this.save);
  }

  // ---- 로비 / 편성 --------------------------------------------------------

  private async lobby(): Promise<void> {
    this.world = null;
    this.run = null;
    this.challenge = null;
    this.view.unload();
    this.hud.show(false);
    for (;;) {
      const act = await this.ui.lobby(this.save);
      if (act.type === 'deleteDeck') {
        this.save.decks = this.save.decks.filter((d) => d.id !== act.id);
        // 그 조사 팀의 덱 컨텐츠 기록도 함께 지운다
        for (const key of Object.keys(this.save.records)) {
          if (key.startsWith(`${act.id}:`)) delete this.save.records[key];
        }
        this.persist();
        continue;
      }
      if (act.type === 'challenge') {
        const deck = this.save.decks.find((d) => d.id === act.id);
        const c = deck ? await this.ui.challengeSelect(deck, this.save) : null;
        if (!deck || !c) continue;
        this.enterFullscreen();
        // 덱 컨텐츠는 시즌 1의 전투장에서 열린다
        await this.warmSprites(runFromDeck(deck), ['alley']);
        this.startChallenge(deck, c);
        return;
      }
      if (act.type === 'resume') {
        const run = RunState.fromJSON(this.save.run);
        if (!run) {
          // 테이블이 바뀌어 되살릴 수 없는 저장은 버린다
          this.save.run = null;
          this.persist();
          continue;
        }
        this.enterFullscreen();
        this.run = run;
        await this.warmSprites(run);
        this.enterSector();
        return;
      }
      const bossWeak = this.rng.pick(ATTRS);
      const sel = await this.ui.formation(bossWeak);
      if (!sel) continue;
      this.enterFullscreen();
      this.save.season = act.season;
      this.run = RunState.create(sel.team, sel.petId, bossWeak, act.season);
      this.autosave();
      await this.warmSprites(this.run);
      this.enterSector();
      return;
    }
  }

  /** 폰에서는 전체 화면 + 가로 고정을 시도한다 (지원하지 않는 브라우저에서는 조용히 넘어간다) */
  private enterFullscreen(): void {
    if (!matchMedia('(pointer: coarse)').matches || document.fullscreenElement) return;
    const root = document.documentElement;
    root
      .requestFullscreen?.({ navigationUI: 'hide' })
      .then(() => (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
      .catch(() => {});
  }

  /** 섹터 사이에서 진행 중인 런을 저장한다 (기획서 7.11절) */
  private autosave(): void {
    this.save.run = this.run ? this.run.toJSON() : null;
    this.persist();
  }

  // ---- 섹터 ---------------------------------------------------------------

  private enterSector(): void {
    const run = this.run!;
    const def = currentSectorDef(run);
    const w = new World(run, buildSector(run, def, this.rng), this.rng);
    w.events.onFinish = (result) => void this.onFinish(result);
    w.events.onThing = (t) => void this.onThing(t);
    w.autoAimAll = this.debugAutoAim;
    this.world = w;
    this.view.load(w);
    this.loadSprites(w);
    this.hud.bind(w, def);
    this.hud.show(true);
    this.syncInput();
  }

  /**
   * 전투에 들어가기 전에 스프라이트 시트를 미리 받아 둔다. 그래야 첫 화면부터 스프라이트로 보인다.
   * 통신이 느리면 3초까지만 기다리고 시작한다 (늦게 온 것은 loadSprites가 도착하는 대로 바꿔 준다).
   */
  private async warmSprites(run: RunState, scenes?: string[]): Promise<void> {
    const team = [...run.team.map((m) => m.id), `pet_${run.petId.toLowerCase()}`];
    // 이 런이 지나갈 섹터들의 맵 그림 세트 (시즌마다, 맵 종류마다 다르다)
    const sets = scenes ?? [...new Set(db.sectors.map((s) => s.scene))];
    // 몬스터는 이 런에 나올 수 있는 것만 받는다 (덱 컨텐츠는 시즌 1의 몬스터가 나온다)
    const wanted = new Set(scenes ? db.monsters.keys() : seasonMonsterIds());
    const load = Promise.all([
      ...sets.map((s) => scenery.load(s)),
      fxArt.load(),
      sprites.monsterIds().then((monsters) => sprites.ensure([...team, ...monsters.filter((id) => wanted.has(id))])),
    ]);
    await Promise.race([load, new Promise((done) => setTimeout(done, 3000))]);
    // 받은 그림을 그래픽 메모리에 미리 올려 둔다 (전투 중 처음 쓰일 때 끊기지 않게)
    this.stage.uploadTextures(true);
  }

  /**
   * 이 팀과 몬스터의 스프라이트 시트를 읽는다. 이미 읽어 둔 것은 바로 쓰이고,
   * 새로 받는 것은 도착하는 대로 도형 플레이스홀더에서 스프라이트로 바뀐다. 그림이 없는 것은 도형으로 남는다.
   */
  private loadSprites(w: World): void {
    const team = w.party.members.map((m) => m.def.id);
    sprites.retain(team);
    void sprites.monsterIds().then(async (monsters) => {
      // 이 섹터에 있거나 나타날 수 있는 몬스터의 그림만 기다린다
      const here = new Set([...w.enemies.map((e) => e.def.id), ...seasonMonsterIds()]);
      const ids = [...team, ...monsters.filter((id) => here.has(id))];
      if (ids.every((id) => sprites.get(id))) return;
      await sprites.ensure(ids);
      if (this.world === w && ids.some((id) => sprites.get(id))) this.view.refreshViews(w);
    });
  }

  /** 3택 1을 띄우고, 고른 보상을 전투 중인 팀에 바로 반영한다 */
  private async offerReward(quality: number, title: string, sub: string, minTier = 1): Promise<void> {
    const run = this.run!;
    await this.ui.reward(run, rollChoices(run, this.rng, quality, 3, minTier), title, sub);
    this.world?.refreshTeam();
  }

  private async onThing(t: Thing): Promise<void> {
    const w = this.world!;
    const run = this.run!;
    if (t.kind === 'chest') {
      const sub = ['', '무리를 처치한 보상', '정예 무리를 처치한 보상 — 희귀 이상이 잘 나온다', '특급 무리를 처치한 보상 — 영웅 이상이 잘 나온다'][
        Math.min(3, t.quality)
      ];
      await this.offerReward(t.quality, '보상 상자', sub);
      // 보상 상자에는 귀중품이 함께 들어 있기도 하다 (정예·특급 무리일수록 자주)
      if (!this.challenge && this.rng.chance(db.pct(`bag.chest.q${Math.min(3, Math.max(1, t.quality))}`))) {
        const def = rollValuable(this.rng, rollTier(this.rng, run.sector, t.quality >= 3 ? 1 : 0));
        await this.gainValuable({ id: def.id, taint: null }, '상자 바닥에서 귀중품을 찾았다');
      }
    } else if (t.kind === 'stash') {
      // 수상한 보따리: 어떻게 챙길지 고른다
      const find = rollFind(this.rng, run.sector, run.route === 'special' ? 1 : 0);
      const pick = await this.ui.find(find);
      const res = resolveFind(run, find, pick, this.rng);
      if (res.hpCost > 0) for (const m of w.party.members) if (!m.dead) m.hp = Math.max(1, m.hp - m.stats.maxHp * res.hpCost);
      w.refreshTeam();
      if (res.item) await this.gainValuable(res.item, res.text);
      else await this.ui.notice(find.title, res.text);
    } else if (t.kind === 'npc' && t.data === 'shop') {
      // 돌발 사건 "떠돌이 상인": 말을 걸면 바로 상점이 열린다
      await this.ui.shop(run, rollShop(run, this.rng), () => {
        for (const m of w.party.members) w.heal(m, m.stats.maxHp * db.pct('shop.heal'));
      });
      w.refreshTeam();
    } else if (t.kind === 'npc') {
      const res = await this.ui.event(w, rollEvent(w, this.rng), this.rng);
      if (res.reward) await this.offerReward(res.reward.quality, '제단의 대가', '영웅 등급 이상', res.reward.minTier);
      if (res.shop) {
        await this.ui.shop(run, rollShop(run, this.rng), () => {
          for (const m of w.party.members) w.heal(m, m.stats.maxHp * db.pct('shop.heal'));
        });
      }
      w.refreshTeam();
    }
  }

  /** 귀중품을 가방에 넣는다. 가방이 가득 찼으면 무엇을 버릴지 묻는다 */
  private async gainValuable(item: BagItem, text: string): Promise<void> {
    const run = this.run!;
    const def = db.valuable(item.id);
    await this.ui.notice(`${def.name} · ${TIER_NAME[def.tier]}`, `${text} (${valueOf(item)} 은화)`, valuableIcon(item.id));
    if (!bagAdd(run, item)) {
      const drop = await this.ui.bagFull(run, item);
      if (drop < run.bag.length) {
        bagDiscard(run, drop);
        bagAdd(run, item);
      }
    }
    this.world?.refreshTeam();
  }

  private async onFinish(result: FinishResult): Promise<void> {
    const w = this.world!;
    const run = this.run!;
    this.syncInput();
    if (result === 'wipe') {
      await this.endRun('전멸', '조사 팀이 모두 쓰러졌습니다. 이번 런에서 쌓은 것은 모두 사라지고, 파티덱은 저장되지 않습니다.', null);
      return;
    }

    const def = w.setup.def;
    if (def.type !== 'boss') {
      const q = w.setup.rewardQuality;
      await this.offerReward(q, def.type === 'bonus' ? '보급소 수색 완료' : `섹터 ${def.index} 클리어`, '클리어 보상', q >= 3 ? 3 : 1);
    }
    if (def.type === 'boss') {
      const boss = rollValuable(this.rng, Math.max(db.P('bag.bossTier'), rollTier(this.rng, run.sector)));
      await this.gainValuable({ id: boss.id, taint: null }, '쓰러진 괴이가 남긴 것');
    }
    const res = onSectorClear(run, def, this.rng);
    if (res.step.kind === 'end') {
      await this.endRun('괴이 토벌 완료', `${def.name}을(를) 쓰러뜨렸습니다. 완성된 조사 팀이 저장되었습니다.`, 'boss');
      return;
    }
    if (res.camp) {
      const act = await this.ui.camp(run, () =>
        this.ui.shop(run, rollShop(run, this.rng), () => healRunTeam(run, db.pct('shop.heal'))),
      );
      if (act === 'extract') {
        await this.endRun('탈출 성공', '캠프에서 무사히 빠져나왔습니다. 지금의 조사 팀이 저장되었습니다.', 'extract');
        return;
      }
    }
    if (res.step.kind === 'route') chooseRoute(run, await this.ui.route(run, res.step.options));
    this.autosave();
    this.enterSector();
  }

  /** 런을 끝낸다. outcome이 있으면 파티덱을 저장하고, 없으면(전멸·포기) 아무것도 남기지 않는다 */
  private async endRun(title: string, text: string, outcome: DeckOutcome | null): Promise<void> {
    const run = this.run!;
    if (outcome) addDeck(this.save, makeDeck(run, outcome));
    // 살아서 나가면 가방의 귀중품이 은화로 바뀐다. 전멸하거나 포기하면 가방째 잃는다
    const lostValue = outcome ? 0 : bagValue(run);
    const traded = outcome ? exchange(run) : null;
    if (traded) this.save.wallet += traded.total;
    this.save.run = null;
    this.persist();
    this.syncInput();
    await this.ui.result({ title, text, run, saved: !!outcome, exchange: traded ? { ...traded, wallet: this.save.wallet } : undefined, lostValue });
    void this.lobby();
  }

  // ---- 파티덱 컨텐츠 (기획서 9절) -----------------------------------------

  private startChallenge(deck: Deck, c: Challenge): void {
    // 덱의 빌드 그대로, 체력이 가득 찬 상태로 시작한다
    const run = runFromDeck(deck);
    this.run = run;
    this.challenge = { deck, c };
    const setup = buildChallenge(run, c, this.rng);
    const w = new World(run, setup, this.rng);
    w.events.onFinish = (result) => void this.onChallengeFinish(result);
    w.autoAimAll = this.debugAutoAim;
    this.world = w;
    this.view.load(w);
    this.loadSprites(w);
    this.hud.bind(w, setup.def);
    this.hud.show(true);
    this.syncInput();
  }

  private async onChallengeFinish(result: FinishResult): Promise<void> {
    const w = this.world!;
    const { deck, c } = this.challenge!;
    this.syncInput();
    const clock = (sec: number): string => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
    let info: ChallengeResultInfo;
    if (c.kind === 'raid') {
      if (result === 'clear') {
        const record = submitRecord(this.save, deck.id, c, Math.round(w.time * 10) / 10);
        info = {
          title: '토벌 성공',
          text: `${RAID_NAME} 난이도 ${c.level}을(를) 끝냈습니다.`,
          stats: [
            ['클리어 타임', clock(w.time)],
            ['등급', raidGrade(w.time)],
            ['받은 피해', String(w.stats.taken)],
          ],
          record,
        };
      } else {
        info = {
          title: result === 'timeout' ? '시간 초과' : '토벌 실패',
          text: result === 'timeout' ? '제한 시간 안에 쓰러뜨리지 못했습니다.' : '조사 팀이 모두 쓰러졌습니다. 조사 팀은 사라지지 않습니다.',
          stats: [
            ['버틴 시간', clock(w.time)],
            ['준 피해', String(Math.round(w.stats.dealt))],
            ['받은 피해', String(w.stats.taken)],
          ],
          record: false,
        };
      }
    } else {
      // 범람은 전멸해도 그때까지의 점수가 기록된다
      const score = Math.floor(w.score);
      const record = submitRecord(this.save, deck.id, c, score);
      info = {
        title: result === 'clear' ? '완주' : '전멸',
        text: result === 'clear' ? '끝까지 버텼습니다.' : '조사 팀이 모두 쓰러졌습니다. 그때까지의 점수가 기록됩니다.',
        stats: [
          ['점수', String(score)],
          ['버틴 시간', clock(w.time)],
          ['처치', String(w.stats.kills)],
        ],
        record,
      };
    }
    this.persist();
    const act = await this.ui.challengeResult(info);
    if (act === 'retry') this.startChallenge(deck, c);
    else void this.lobby();
  }

  // ---- 팀 정보 / 일시정지 / 디버그 ----------------------------------------

  private async openTeam(): Promise<void> {
    const w = this.world;
    const run = this.run;
    if (!w || !run || w.over || this.ui.open) return;
    const debug: DebugActions = {
      invuln: () => (w.cheatInvuln = !w.cheatInvuln),
      autoAim: () => (w.autoAimAll = this.debugAutoAim = !this.debugAutoAim),
      autoAimOn: () => this.debugAutoAim,
      clearSector: () => {
        if (w.setup.def.type === 'boss') run.bossKilled = true;
        w.finish('clear');
      },
      reward: () => void this.offerReward(2, '디버그 보상', '보상 품질 2'),
      shards: () => (run.shards += 200),
      ult: () => {
        for (const m of w.party.members) m.ult = db.P('ult.max');
      },
      reveal: () => w.revealAll(),
      heal: () => {
        for (const m of w.party.members) {
          m.dead = false;
          m.hp = m.stats.maxHp;
        }
      },
    };
    if (this.challenge) {
      // 덱 컨텐츠: 포기해도 조사 팀은 그대로 남는다
      const act = await this.ui.team(run, w, debug, '조사 팀', {
        label: '도전 포기',
        title: '도전 포기',
        text: '도전을 그만두고 로비로 돌아갑니다. 조사 팀은 사라지지 않습니다.',
      });
      if (act === 'abandon') {
        w.over = 'wipe';
        void this.lobby();
      }
      return;
    }
    const act = await this.ui.team(run, w, debug);
    if (act === 'abandon') {
      run.kills += w.stats.kills;
      run.time += w.time;
      w.over = 'wipe';
      await this.endRun('조사 포기', '조사를 포기했습니다. 이번 런에서 쌓은 것은 모두 사라지고, 파티덱은 저장되지 않습니다.', null);
    }
  }
}
