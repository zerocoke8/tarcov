// 게임 전체 진행: 로비 → 섹터 전투 → 결과. 규칙(World), 표시(WorldView), 입력(Input), HUD를 이어 준다.
import { Rng } from './core/rng';
import { db } from './data/tables';
import { RunState } from './game/run/RunState';
import { buildSector } from './game/run/sector';
import { World, type FinishResult } from './game/world/World';
import { Input } from './input/Input';
import type { Stage } from './render/Stage';
import { WorldView } from './render/WorldView';
import { el, q } from './ui/dom';
import { Hud } from './ui/hud';
import { drawFullMap } from './ui/minimap';
import { petSvg, portraitSvg } from './ui/portraits';

/** 1단계(전투 코어)의 고정 편성. 2단계에서 팀 편성 화면으로 바뀐다 */
const DEFAULT_TEAM = ['serin', 'mido', 'sia'];
const DEFAULT_PET = 'B';

export class Game {
  private view: WorldView;
  private input = new Input();
  private hud: Hud;
  private world: World | null = null;
  private run: RunState | null = null;
  private paused = true;
  /** 지금 떠 있는 화면이나 창 */
  private layer: HTMLElement | null = null;

  constructor(
    private stage: Stage,
    private ui: HTMLElement,
  ) {
    this.view = new WorldView(stage);
    this.hud = new Hud(ui, this.input, {
      onInfo: () => this.showPause(),
      onPause: () => this.showPause(),
      onMap: () => this.showMap(),
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.world && !this.world.over) {
        if (this.layer) this.closeLayer();
        else this.showPause();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.world && !this.world.over && !this.layer) this.showPause();
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    stage.app.ticker.add((t) => this.frame(t.deltaMS / 1000));
    this.showLobby();
  }

  // ---- 매 프레임 ----------------------------------------------------------

  private frame(dt: number): void {
    const w = this.world;
    if (!w) return;
    // 탭이 멈췄다 돌아왔을 때 한꺼번에 많이 진행되지 않게 한다
    const step = Math.min(dt, 0.05);
    if (!this.paused) w.update(step, this.input.state);
    this.view.sync(w, this.paused ? 0 : step);
    this.hud.update(w, step);
  }

  private setPaused(paused: boolean): void {
    this.paused = paused;
    this.input.setEnabled(!paused);
  }

  // ---- 화면 / 창 ----------------------------------------------------------

  private openLayer(node: HTMLElement): HTMLElement {
    this.closeLayer(false);
    this.layer = node;
    this.ui.appendChild(node);
    this.setPaused(true);
    return node;
  }

  private closeLayer(resume = true): void {
    this.layer?.remove();
    this.layer = null;
    if (resume && this.world && !this.world.over) this.setPaused(false);
  }

  private showLobby(): void {
    this.world = null;
    this.view.unload();
    this.hud.show(false);
    const team = DEFAULT_TEAM.map((id) => db.char(id));
    const pet = db.pet(DEFAULT_PET);
    const node = this.openLayer(
      el(`
      <div class="screen lobby">
        <div class="lobby-title">
          <small>시즌 1 · 그믐밤의 구도심</small>
          <h1>괴담 조사</h1>
          <p>프로토타입 1단계 — 전투 코어</p>
        </div>
        <div class="lobby-team">
          ${team.map((c) => `<div class="slot"><span>${portraitSvg(c)}</span>${c.name}</div>`).join('')}
          <div class="slot"><span>${petSvg(pet)}</span>${pet.name}</div>
        </div>
        <button class="ui-btn primary" data-act="start">조사 시작</button>
        <p class="hint">키보드: 이동 WASD · 공격 J · 회피 K · 액티브 L · 궁극기 I · 펫 O · 교체 1 2 3</p>
      </div>`),
    );
    q(node, '[data-act="start"]').addEventListener('click', () => {
      this.enterFullscreen();
      this.run = RunState.create(DEFAULT_TEAM, DEFAULT_PET);
      this.enterSector();
    });
  }

  /** 폰에서는 전체 화면 + 가로 고정을 시도한다 (지원하지 않는 브라우저에서는 조용히 넘어간다) */
  private enterFullscreen(): void {
    if (!matchMedia('(pointer: coarse)').matches) return;
    const root = document.documentElement;
    root
      .requestFullscreen?.({ navigationUI: 'hide' })
      .then(() => (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
      .catch(() => {});
  }

  private enterSector(): void {
    const run = this.run!;
    const def = db.sector(run.sector);
    const rng = new Rng();
    const w = new World(run, buildSector(run, def, rng), rng);
    w.events.onFinish = (result) => this.onFinish(result);
    this.world = w;
    this.view.load(w);
    this.hud.bind(w, def);
    this.hud.show(true);
    this.closeLayer(false);
    this.setPaused(false);
  }

  private onFinish(result: FinishResult): void {
    const w = this.world!;
    this.setPaused(true);
    const clear = result === 'clear';
    const node = this.openLayer(
      el(`
      <div class="overlay">
        <div class="panel">
          <h2>${clear ? '섹터 클리어' : '전멸'}</h2>
          <p>${clear ? '출구에 도달했습니다.' : '조사 팀이 모두 쓰러졌습니다.'}</p>
          <div class="stats">
            <div><b>${Math.floor(w.time / 60)}:${String(Math.floor(w.time % 60)).padStart(2, '0')}</b><span>소요 시간</span></div>
            <div><b>${w.stats.kills}</b><span>처치</span></div>
            <div><b>${w.stats.shards}</b><span>괴담 조각</span></div>
          </div>
          <div class="row">
            <button class="ui-btn" data-act="lobby">로비로</button>
            <button class="ui-btn primary" data-act="retry">다시 하기</button>
          </div>
        </div>
      </div>`),
    );
    q(node, '[data-act="lobby"]').addEventListener('click', () => this.showLobby());
    q(node, '[data-act="retry"]').addEventListener('click', () => {
      this.run = RunState.create(DEFAULT_TEAM, DEFAULT_PET);
      this.enterSector();
    });
  }

  private showPause(): void {
    if (!this.world || this.world.over) return;
    const node = this.openLayer(
      el(`
      <div class="overlay">
        <div class="panel">
          <h2>일시정지</h2>
          <div class="row">
            <button class="ui-btn" data-act="lobby">로비로</button>
            <button class="ui-btn primary" data-act="resume">계속</button>
          </div>
        </div>
      </div>`),
    );
    q(node, '[data-act="resume"]').addEventListener('click', () => this.closeLayer());
    q(node, '[data-act="lobby"]').addEventListener('click', () => this.showLobby());
  }

  private showMap(): void {
    if (!this.world || this.world.over) return;
    const node = this.openLayer(
      el(`
      <div class="overlay fullmap">
        <canvas></canvas>
        <div class="row"><button class="ui-btn primary" data-act="close">닫기</button></div>
      </div>`),
    );
    drawFullMap(q<HTMLCanvasElement>(node, 'canvas'), this.world);
    q(node, '[data-act="close"]').addEventListener('click', () => this.closeLayer());
  }
}
