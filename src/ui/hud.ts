// 전투 화면 HUD (기획서 4절). HTML 오버레이로 그리고, 값이 바뀔 때만 DOM을 고친다.
//
//  ① D패드  ② 기본 공격  ③ 회피  ④ 액티브  ⑤ 궁극기  ⑥ 온 필드 캐릭터 상태  ⑦ 교체 캐릭터 상태
//  ⑧ 미니맵  ⑨ 펫 스킬  ⑩ 퀘스트 정보  ⑪ 캐릭터 정보 아이콘  ⑫ 보스 / 중요 오브젝트 상태
//  (⑬ 간략 전투 상태는 유닛 머리 위에 표시부가 그린다)
//  ⑭ 상호작용 버튼 (필드 캐릭터 오른쪽)  ⑮ 자동 공격 켜고 끄기 (궁극기 버튼 위)
import { audio } from '../audio/audio';
import { db } from '../data/tables';
import { ATTR_LABEL, POS_LABEL, type SectorDef } from '../data/types';
import type { Enemy } from '../game/enemy/Enemy';
import type { Member } from '../game/player/Member';
import type { World } from '../game/world/World';
import type { Input } from '../input/Input';
import { Cache, el, escapeHtml, q } from './dom';
import { fieldStatus } from '../game/player/status';
import { PARTY_BAR_Y } from '../render/WorldView';
import { Minimap } from './minimap';
import { StatusRow } from './status';
import { ICON, petSvg, portraitSvg } from './portraits';

/** 왼쪽 위 정보 칸에 보여 줄 상태 아이콘의 최대 수 */
const STATUS_MAX = 8;
/** 필드 캐릭터 머리 위에 보여 줄 핵심 상태 아이콘의 최대 수, 크기(월드 px), 높이(발밑에서 아이콘 윗변까지, 월드 px) */
const FIELD_STATUS_MAX = 4;
const FIELD_STATUS_SIZE = 16;
const FIELD_STATUS_Y = PARTY_BAR_Y - 8;

/** 버튼 그림의 둘레 길이 (SVG 단위). 쿨타임 덮개·고리를 "얼마나 채울지"를 선의 길이로 정한다 */
const C_PIE = 2 * Math.PI * 21.5;
const C_RING = 2 * Math.PI * 45.5;
const C_ULT = 2 * Math.PI * 40;

/** 원형 버튼의 바탕: 회색 원판, 쿨타임 덮개, 테두리 고리 */
const ART = `<svg class="btn-art" viewBox="0 0 100 100" aria-hidden="true">
    <circle class="b-shade" cx="50" cy="50" r="43"/><circle class="b-disc" cx="50" cy="50" r="43"/>
    <circle class="b-pie" cx="50" cy="50" r="21.5"/>
    <circle class="b-track" cx="50" cy="50" r="45.5"/><circle class="b-fill" cx="50" cy="50" r="45.5"/>
  </svg>`;

/** 궁극기 버튼의 고리에 박힌 돌기 하나 (오른쪽에 놓인 모양. 돌려서 네 곳에 둔다) */
const SPIKE = 'M98.5 50 Q91.6 51 90 54.2 Q88.4 51 79.5 50 Q88.4 49 90 45.8 Q91.6 49 98.5 50Z';

/** 궁극기 버튼: 굵은 고리(게이지) + 바깥의 가는 호 + 다 차면 도는 돌기 네 개 */
const ULT_ART = `<i class="u-glow"></i>
  <svg class="btn-art" viewBox="0 0 100 100" aria-hidden="true">
    <circle class="u-deco" cx="50" cy="50" r="48.6" stroke-dasharray="67.86 84.82" stroke-dashoffset="-16.96"/>
    <circle class="u-shade" cx="50" cy="50" r="34"/><circle class="u-disc" cx="50" cy="50" r="34"/>
    <circle class="u-track" cx="50" cy="50" r="40"/><circle class="u-fill" cx="50" cy="50" r="40" stroke-dasharray="0 ${C_ULT.toFixed(2)}"/>
  </svg>
  <svg class="u-spin" viewBox="0 0 100 100" aria-hidden="true">${[45, 135, 225, 315].map((a) => `<path d="${SPIKE}" transform="rotate(${a} 50 50)"/>`).join('')}</svg>`;

/**
 * 자동 공격 버튼의 고리: 서로 꼬리를 무는 화살표 호 두 개. 켜져 있는 동안 계속 돈다
 * (무언가가 알아서 돌아가고 있다는 느낌)
 */
function autoRing(): string {
  const R = 43;
  const at = (deg: number, r = R): string => {
    const a = (deg * Math.PI) / 180;
    return `${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`;
  };
  return [-160, 20]
    .map((start) => {
      const end = start + 132;
      // 호의 끝에 진행 방향(시계 방향)을 가리키는 화살촉을 단다
      return `<path class="a-arc" d="M${at(start)} A${R} ${R} 0 0 1 ${at(end)}"/><path class="a-head" d="M${at(end + 21)} L${at(end - 2, R + 9)} L${at(end - 2, R - 9)}Z"/>`;
    })
    .join('');
}

const AUTO_ART = `<svg class="auto-disc" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="33"/></svg>
  <svg class="auto-ring" viewBox="0 0 100 100" aria-hidden="true">${autoRing()}</svg>
  <span class="auto-text">AUTO</span>`;

export interface HudHandlers {
  onInfo(): void;
  onPause(): void;
  onMap(): void;
  /** 자동 공격 버튼을 눌렀다 */
  onAuto(): void;
}

const TEMPLATE = `
<div class="hud hidden">
  <div class="topleft">
    <div class="quest">
      <div class="quest-title"></div>
      <ul class="quest-list"></ul>
    </div>
    <button class="info-btn" aria-label="팀 정보">팀 정보</button>
  </div>

  <div class="bossbar hidden">
    <div class="boss-head"><span class="boss-name"></span><span class="boss-weak"></span></div>
    <div class="boss-hp"><i></i></div>
    <div class="boss-foot"><span class="boss-phase"></span><span class="boss-status"></span></div>
  </div>

  <div class="topright">
    <div class="topright-row">
      <div class="bagcount" title="귀중품 가방"><span class="bag-icon"></span><b>0</b></div>
      <div class="shards"><span class="shard-icon"></span><b>0</b></div>
      <button class="pause-btn" aria-label="일시정지"><i></i><i></i></button>
    </div>
    <button class="minimap" aria-label="상세 맵"><canvas></canvas></button>
  </div>

  <div class="swap">
    <button class="swap-card" data-slot="0"></button>
    <button class="swap-card" data-slot="1"></button>
  </div>

  <div class="dpad">
    <i data-i="0"></i><i data-i="1"></i><i data-i="2"></i><i data-i="3"></i>
    <i data-i="4"></i><i data-i="5"></i><i data-i="6"></i><i data-i="7"></i>
    <div class="dpad-knob"></div>
  </div>

  <div class="onfield">
    <div class="of-portrait"></div>
    <div class="of-main">
      <div class="of-name"><b></b><span></span></div>
      <div class="bar hp"><i></i><em></em></div>
      <div class="buffs"></div>
    </div>
  </div>

  <div class="field-status"></div>

  <button class="interact hidden"><span class="it-icon">${ICON.interact}</span><span class="it-text"><b></b><small></small></span><kbd class="it-key">F</kbd><i class="it-bar"></i></button>

  <button class="btn pet" aria-label="펫 스킬">${ART}<span class="btn-icon"></span><span class="btn-time"></span></button>
  <button class="btn attack" aria-label="기본 공격">${ART}<span class="btn-icon">${ICON.attack}</span></button>
  <button class="btn dodge" aria-label="회피">${ART}<span class="btn-icon">${ICON.dodge}</span><span class="btn-count"></span></button>
  <button class="btn active" aria-label="액티브">${ART}<span class="btn-icon">${ICON.active}</span><span class="btn-time"></span><span class="btn-count"></span></button>
  <button class="btn ult" aria-label="궁극기">${ULT_ART}<span class="btn-icon">${ICON.ult}</span></button>
  <button class="auto-btn" aria-label="자동 공격" aria-pressed="false">${AUTO_ART}</button>
</div>`;

/** 상호작용 버튼에 적는 이름과 동작 */
const INTERACT_LABEL: Record<string, [name: string, verb: string]> = {
  exit: ['출구', '다음 구역으로'],
  chest: ['보상 상자', '열기'],
  crate: ['보급 상자', '수색하기'],
  medkit: ['구급 상자', '수색하기'],
  relic: ['괴담의 잔재', '조사하기'],
  sealed: ['봉인 상자', '봉인 풀기'],
  npc: ['수상한 인물', '말 걸기'],
  stash: ['수상한 보따리', '열어 보기'],
};

interface SwapCard {
  root: HTMLElement;
  index: number;
}

export class Hud {
  readonly root: HTMLElement;
  private c = new Cache();
  private minimap: Minimap;
  private mapT = 0;
  private cards: SwapCard[];
  private sectorTitle = '';

  private elQuestTitle: HTMLElement;
  private elQuestList: HTMLElement;
  private elShards: HTMLElement;
  private elBag: HTMLElement;
  private elBoss: HTMLElement;
  private elOnfield: HTMLElement;
  /** 왼쪽 위 정보 칸의 상태 줄 (모든 상태) */
  private rowAll: StatusRow;
  /** 필드 캐릭터 머리 위의 상태 줄 (핵심 상태만) */
  private rowKey: StatusRow;
  private btnDodge: HTMLElement;
  private btnActive: HTMLElement;
  private btnUlt: HTMLElement;
  private btnPet: HTMLElement;
  private btnInteract: HTMLElement;
  private btnAuto: HTMLElement;
  private elInteractBar: HTMLElement;
  /** 필드 캐릭터의 화면 위치(CSS px)와 화면 배율. 상호작용 버튼을 캐릭터 오른쪽에 붙이는 데 쓴다 */
  private anchor = { x: 0, y: 0, zoom: 1 };

  constructor(parent: HTMLElement, input: Input, handlers: HudHandlers) {
    this.root = el(TEMPLATE);
    parent.appendChild(this.root);
    const r = this.root;

    this.elQuestTitle = q(r, '.quest-title');
    this.elQuestList = q(r, '.quest-list');
    this.elShards = q(r, '.shards b');
    this.elBag = q(r, '.bagcount b');
    this.elBoss = q(r, '.bossbar');
    this.elOnfield = q(r, '.onfield');
    this.rowAll = new StatusRow(q(r, '.buffs'), STATUS_MAX);
    this.rowKey = new StatusRow(q(r, '.field-status'), FIELD_STATUS_MAX);
    this.btnDodge = q(r, '.btn.dodge');
    this.btnActive = q(r, '.btn.active');
    this.btnUlt = q(r, '.btn.ult');
    this.btnPet = q(r, '.btn.pet');
    this.btnInteract = q(r, '.interact');
    this.btnAuto = q(r, '.auto-btn');
    this.elInteractBar = q(r, '.interact .it-bar');
    this.minimap = new Minimap(q<HTMLCanvasElement>(r, '.minimap canvas'));

    this.cards = [...r.querySelectorAll<HTMLElement>('.swap-card')].map((root) => ({ root, index: -1 }));

    input.bindDpad(q(r, '.dpad'));
    input.bindAttack(q(r, '.btn.attack'));
    input.bindTap(this.btnDodge, { type: 'dodge' });
    input.bindTap(this.btnActive, { type: 'active' });
    input.bindTap(this.btnUlt, { type: 'ult' });
    input.bindTap(this.btnPet, { type: 'pet' });
    input.bindTap(this.btnInteract, { type: 'interact' });
    for (const card of this.cards) {
      input.bindTap(card.root, () => (card.index >= 0 ? { type: 'swap', index: card.index } : null));
    }

    // 자동 공격: 누르는 순간 바뀐다 (조작 버튼처럼 포인터 이벤트로 받는다. 터치의 기본 동작은 input/noZoom.ts 가 막는다)
    this.btnAuto.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handlers.onAuto();
    });
    q(r, '.info-btn').addEventListener('click', () => handlers.onInfo());
    q(r, '.pause-btn').addEventListener('click', () => handlers.onPause());
    q(r, '.minimap').addEventListener('click', () => handlers.onMap());
  }

  show(visible: boolean): void {
    this.root.classList.toggle('hidden', !visible);
  }

  /** 자동 공격이 켜졌는지 버튼에 보여 준다 (켜져 있으면 고리가 돈다) */
  setAuto(on: boolean): void {
    this.btnAuto.classList.toggle('on', on);
    this.btnAuto.setAttribute('aria-pressed', String(on));
    this.btnAuto.setAttribute('aria-label', on ? '자동 공격 켜짐' : '자동 공격 꺼짐');
  }

  /** 필드 캐릭터가 화면 어디에 있는지 알려 준다 (매 프레임, update 전에) */
  place(x: number, y: number, zoom: number): void {
    this.anchor.x = x;
    this.anchor.y = y;
    this.anchor.zoom = zoom;
  }

  /** 상호작용 버튼: 닿는 거리에 오브젝트가 있을 때만 캐릭터 오른쪽에 뜬다. 눌러야 상호작용이 시작된다 */
  private updateInteract(w: World): void {
    const c = this.c;
    const t = w.over ? null : w.nearThing;
    const btn = this.btnInteract;
    if (c.changed('itShow', !!t)) btn.classList.toggle('hidden', !t);
    if (!t) return;
    const label = INTERACT_LABEL[t.kind] ?? INTERACT_LABEL.crate;
    const busy = !!t.searching;
    if (c.changed('itText', `${t.kind}:${busy}`)) {
      q(btn, 'b').textContent = label[0];
      q(btn, 'small').textContent = busy ? '수색 중…' : label[1];
      btn.dataset.kind = t.kind;
      btn.classList.toggle('busy', busy);
    }
    const pct = Math.round(t.progress * 100);
    if (c.changed('itBar', pct)) this.elInteractBar.style.width = `${pct}%`;
    // 캐릭터 오른쪽, 몸통 높이에 붙인다. 화면 밖으로 나가지 않게 막는다
    const a = this.anchor;
    const x = Math.min(this.root.clientWidth - btn.offsetWidth - 8, a.x + 44 * a.zoom);
    const y = Math.max(btn.offsetHeight / 2 + 8, a.y - 46 * a.zoom);
    const pos = `translate(${Math.round(x)}px, ${Math.round(y)}px) translateY(-50%)`;
    if (c.changed('itPos', pos)) btn.style.transform = pos;
  }

  /** 새 섹터에 들어갈 때 */
  bind(w: World, sector: SectorDef): void {
    this.c.clear();
    this.mapT = 0;
    // 보너스 맵과 덱 컨텐츠(번호 0)는 이름만 보여 준다
    this.sectorTitle =
      sector.type === 'bonus' || sector.index === 0 ? sector.name : `섹터 ${sector.index} · ${sector.name}`;
    const pet = w.pet.def;
    q(this.btnPet, '.btn-icon').innerHTML = petSvg(pet);
    this.btnPet.setAttribute('aria-label', `펫 스킬: ${pet.name}`);
    for (const card of this.cards) card.index = -1;
  }

  update(w: World, dt: number): void {
    const c = this.c;
    const p = w.party;
    const m = p.active;
    this.updateInteract(w);

    // ⑩ 퀘스트
    if (c.changed('title', this.sectorTitle)) this.elQuestTitle.textContent = this.sectorTitle;
    const quest = w.quest();
    const lines: [boolean, string][] = [];
    const clock = (sec: number): string => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
    if (quest.mode === 'raid') {
      lines.push([quest.gateCleared, '특급 괴이를 쓰러뜨려라']);
      lines.push([false, `남은 시간 ${clock(quest.timeLeft)}`]);
    } else if (quest.mode === 'wave') {
      lines.push([false, `웨이브 ${quest.waveStage + 1} · 끝까지 버텨라`]);
      lines.push([false, `남은 시간 ${clock(quest.timeLeft)}`]);
      lines.push([false, `점수 ${quest.score}`]);
    } else if (quest.boss) lines.push([quest.gateCleared, '괴이 토벌']);
    else if (quest.hasGate && !quest.gateCleared) lines.push([false, '출구를 지키는 괴이 처치']);
    else if (quest.exitOpen || !quest.hasGate) lines.push([false, '출구로 이동']);
    if (quest.packsTotal > 0 && !quest.boss && quest.mode === 'sector') {
      // 보상 상자는 몇 무리마다 하나씩 나온다. 다음 상자까지 남은 무리 수를 함께 적는다
      const next = quest.chestIn > 0 ? ` · 보상 상자까지 ${quest.chestIn}` : '';
      lines.push([quest.packsCleared >= quest.packsTotal, `괴이 무리 처치 ${quest.packsCleared} / ${quest.packsTotal}${next}`]);
    }
    if (quest.searchTotal > 0) {
      lines.push([quest.searched >= quest.searchTotal, `오브젝트 수색 ${quest.searched} / ${quest.searchTotal}`]);
    }
    if (quest.surprise) lines.push([false, `돌발 · ${quest.surprise}`]);
    const questKey = lines.map((l) => (l[0] ? '1' : '0') + l[1]).join('|');
    if (c.changed('quest', questKey)) {
      this.elQuestList.innerHTML = lines
        .map(([done, text], i) => `<li class="${done ? 'done' : ''} ${i === 0 ? 'main' : ''}">${escapeHtml(text)}</li>`)
        .join('');
    }

    if (c.changed('shards', w.run.shards)) this.elShards.textContent = String(w.run.shards);
    const bag = `${w.run.bag.length}/${db.P('bag.slots')}`;
    if (c.changed('bag', bag)) {
      this.elBag.textContent = bag;
      this.elBag.parentElement!.classList.toggle('full', w.run.bag.length >= db.P('bag.slots'));
    }

    // ⑥ 온 필드 캐릭터
    if (c.changed('field', m.def.id)) {
      q(this.elOnfield, '.of-portrait').innerHTML = portraitSvg(m.def);
      q(this.elOnfield, '.of-name b').textContent = m.def.name;
      q(this.elOnfield, '.of-name span').textContent =
        `${m.def.grade}급 · ${POS_LABEL[m.def.position]} · ${ATTR_LABEL[m.def.attr]}`;
      this.elOnfield.dataset.attr = m.def.attr;
    }
    const hpRatio = Math.max(0, m.hp / m.stats.maxHp);
    if (c.changed('hp', Math.round(hpRatio * 200))) {
      q(this.elOnfield, '.bar.hp i').style.width = `${hpRatio * 100}%`;
      this.elOnfield.classList.toggle('low', hpRatio < 0.3);
    }
    if (c.changed('hpText', Math.ceil(m.hp))) {
      q(this.elOnfield, '.bar.hp em').textContent = `${Math.max(0, Math.ceil(m.hp))} / ${m.stats.maxHp}`;
    }
    const actRatio = m.cdRatio();
    const ultMax = db.P('ult.max');
    const ultRatio = Math.min(1, m.ult / ultMax);
    if (c.changed('ult', Math.round(ultRatio * 100))) {
      q(this.btnUlt, '.u-fill').style.strokeDasharray = `${(ultRatio * C_ULT).toFixed(2)} ${C_ULT.toFixed(2)}`;
    }
    if (c.changed('ultReady', ultRatio >= 1)) {
      const was = this.btnUlt.classList.contains('ready');
      this.btnUlt.classList.toggle('ready', ultRatio >= 1);
      if (!was && ultRatio >= 1) {
        this.pop(this.btnUlt);
        audio.cue('ult.ready');
      }
    }
    // 상태 아이콘: 왼쪽 위에는 전부, 머리 위에는 핵심 상태만
    const status = fieldStatus(w);
    this.rowAll.update(status);
    const shown = this.rowKey.update(p.wiped ? [] : status.filter((s) => s.key));
    if (shown > 0) {
      // 머리 위 체력 막대 바로 아래에 가운데 맞춰 놓는다. 크기는 화면 배율을 따른다
      const a = this.anchor;
      const el = this.rowKey.el;
      const size = (FIELD_STATUS_SIZE * a.zoom).toFixed(1);
      if (c.changed('fsSize', size)) el.style.fontSize = `${size}px`;
      const pos = `translate(${Math.round(a.x)}px, ${Math.round(a.y - FIELD_STATUS_Y * a.zoom)}px) translateX(-50%)`;
      if (c.changed('fsPos', pos)) el.style.transform = pos;
    }

    // ⑦ 교체 캐릭터
    let slot = 0;
    p.members.forEach((mem, idx) => {
      if (idx === p.cur || slot >= this.cards.length) return;
      this.updateCard(this.cards[slot], slot, mem, idx, p.swapCd, ultMax);
      // 궁극기·회피 동작 중에 눌러 둔 교체: 그 동작이 끝나면 바뀔 캐릭터의 카드에 표시한다
      if (c.changed(`card${slot}.queued`, p.queuedSwap === idx)) this.cards[slot].root.classList.toggle('queued', p.queuedSwap === idx);
      slot++;
    });

    // ③ 회피
    if (c.changed('dodge', p.dodgeCharges)) {
      q(this.btnDodge, '.btn-count').textContent = String(p.dodgeCharges);
      this.btnDodge.classList.toggle('off', p.dodgeCharges <= 0);
    }
    const dodgeCd = p.dodgeCharges < m.stats.dodgeCharges ? 1 - p.dodgeTimer / db.P('dodge.recharge') : 0;
    this.cool(this.btnDodge, 'dodge', p.dodgeCharges <= 0 ? dodgeCd : 0);

    // ④ 액티브
    const actCd = m.charges > 0 ? 0 : 1 - actRatio;
    this.cool(this.btnActive, 'active', actCd);
    const actTime = m.charges > 0 ? '' : String(Math.ceil(m.cd));
    if (c.changed('actTime', actTime)) q(this.btnActive, '.btn-time').textContent = actTime;
    const actCount = m.maxCharges() > 1 ? String(m.charges) : '';
    if (c.changed('actCount', actCount)) q(this.btnActive, '.btn-count').textContent = actCount;

    // ⑨ 펫 스킬
    const petCd = 1 - w.pet.ratio(w);
    this.cool(this.btnPet, 'pet', petCd);
    const petTime = w.pet.cd > 0 ? String(Math.ceil(w.pet.cd)) : '';
    if (c.changed('petTime', petTime)) q(this.btnPet, '.btn-time').textContent = petTime;

    // ⑫ 보스 / 중요 오브젝트
    this.updateBoss(w);

    // ⑧ 미니맵 (초당 10회)
    this.mapT -= dt;
    if (this.mapT <= 0) {
      this.mapT = 0.1;
      this.minimap.draw(w);
    }
  }

  /**
   * 버튼의 쿨타임 표시를 고친다. left 는 남은 비율(1 → 0)이고, 0이면 쓸 수 있는 상태다.
   * "쿨타임 중인지"는 비율과 따로 기억한다. 비율을 반올림한 값만 비교하면 마지막 한 단계에서 꺼짐 상태가 남아,
   * 쿨타임이 끝나도 버튼이 다시 켜지지 않았다.
   */
  private cool(btn: HTMLElement, key: string, left: number): void {
    const c = this.c;
    const on = left > 0;
    if (c.changed(`${key}.cooling`, on)) {
      const was = btn.classList.contains('cooling');
      btn.classList.toggle('cooling', on);
      // 다시 쓸 수 있게 된 순간을 알린다
      if (was && !on) this.pop(btn);
    }
    if (!on) return;
    const step = Math.max(1, Math.round(left * 240));
    if (!c.changed(`${key}.left`, step)) return;
    const k = Math.min(1, step / 240);
    // 덮개는 남은 만큼만 남고(12시에서 시계 방향으로 걷힌다), 고리는 지난 만큼 차오른다
    q(btn, '.b-pie').style.strokeDasharray = `0 ${((1 - k) * C_PIE).toFixed(2)} ${(k * C_PIE).toFixed(2)} 0`;
    q(btn, '.b-fill').style.strokeDasharray = `${((1 - k) * C_RING).toFixed(2)} ${C_RING.toFixed(2)}`;
  }

  /** 버튼이 살짝 튀며 고리가 퍼지는 연출을 한 번 보여 준다 */
  private pop(btn: HTMLElement): void {
    btn.classList.remove('pop');
    // 같은 연출을 연달아 다시 시작할 수 있게 한 번 배치를 읽는다
    void btn.offsetWidth;
    btn.classList.add('pop');
  }

  private updateCard(card: SwapCard, slot: number, m: Member, index: number, swapCd: number, ultMax: number): void {
    const c = this.c;
    const k = `card${slot}`;
    card.index = index;
    if (c.changed(`${k}.id`, m.def.id)) {
      card.root.innerHTML = `
        <span class="sc-portrait">${portraitSvg(m.def)}</span>
        <span class="sc-main">
          <span class="sc-name">${escapeHtml(m.def.name)}<small>${ATTR_LABEL[m.def.attr]}</small></span>
          <span class="bar hp"><i></i></span>
          <span class="sc-pips"><i class="pip act" title="액티브 사용 가능"></i><i class="pip ult" title="궁극기 사용 가능"></i></span>
        </span>
        <span class="sc-key">${index + 1}</span>`;
      card.root.dataset.attr = m.def.attr;
      // 내용이 새로 그려졌으니 세부 값도 다시 채운다
      for (const part of ['hp', 'dead', 'act', 'ult', 'cd']) c.changed(`${k}.${part}`, null);
    }
    const ratio = Math.max(0, m.hp / m.stats.maxHp);
    if (c.changed(`${k}.hp`, Math.round(ratio * 100))) {
      q(card.root, '.bar.hp i').style.width = `${ratio * 100}%`;
    }
    if (c.changed(`${k}.dead`, m.dead)) card.root.classList.toggle('dead', m.dead);
    if (c.changed(`${k}.act`, m.charges > 0)) q(card.root, '.pip.act').classList.toggle('on', m.charges > 0);
    if (c.changed(`${k}.ult`, m.ult >= ultMax)) q(card.root, '.pip.ult').classList.toggle('on', m.ult >= ultMax);
    const cd = swapCd > 0 && !m.dead;
    if (c.changed(`${k}.cd`, cd)) card.root.classList.toggle('cooling', cd);
  }

  private updateBoss(w: World): void {
    const c = this.c;
    // 보스가 있으면 보스를, 없으면 싸우는 중인 중형 몬스터를 보여 준다
    let target: Enemy | null = null;
    for (const e of w.enemies) {
      if (e.dead || !e.aggro || e.def.size === 'S') continue;
      if (!target || (e.def.size === 'L' && target.def.size !== 'L')) target = e;
    }
    if (c.changed('bossOn', !!target)) this.elBoss.classList.toggle('hidden', !target);
    if (!target) return;
    const name = (target.grade.grade > 0 ? `[${target.grade.name}] ` : '') + target.def.name;
    if (c.changed('bossName', name)) q(this.elBoss, '.boss-name').textContent = name;
    if (c.changed('bossWeak', target.weak)) {
      const weak = q(this.elBoss, '.boss-weak');
      weak.textContent = `약점 ${ATTR_LABEL[target.weak]}`;
      weak.dataset.attr = target.weak;
    }
    const ratio = Math.max(0, target.hp / target.maxHp);
    if (c.changed('bossHp', Math.round(ratio * 400))) {
      q(this.elBoss, '.boss-hp i').style.width = `${ratio * 100}%`;
    }
    const phases = target.vars.phases ?? 0;
    const phase = target.vars.phase ?? 0;
    const phaseKey = `${phase}/${phases}`;
    if (c.changed('bossPhase', phaseKey)) {
      q(this.elBoss, '.boss-phase').innerHTML = phases
        ? Array.from({ length: phases }, (_, i) => `<i class="${i < phase ? 'on' : ''}"></i>`).join('')
        : '';
    }
    const status = target.debuffs.map((d) => STATUS_NAME[d.id] ?? d.id).join(' · ');
    if (c.changed('bossStatus', status)) q(this.elBoss, '.boss-status').textContent = status;
  }
}

const STATUS_NAME: Record<string, string> = {
  slow: '둔화',
  shock: '전이',
  mark: '표식',
  jolt: '감전',
  bleed: '출혈',
};
