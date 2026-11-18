// 전투 화면 HUD (기획서 4절). HTML 오버레이로 그리고, 값이 바뀔 때만 DOM을 고친다.
//
//  ① D패드  ② 기본 공격  ③ 회피  ④ 액티브  ⑤ 궁극기  ⑥ 온 필드 캐릭터 상태  ⑦ 교체 캐릭터 상태
//  ⑧ 미니맵  ⑨ 펫 스킬  ⑩ 퀘스트 정보  ⑪ 캐릭터 정보 아이콘  ⑫ 보스 / 중요 오브젝트 상태
//  (⑬ 간략 전투 상태는 유닛 머리 위에 표시부가 그린다)
import { db } from '../data/tables';
import { ATTR_LABEL, POS_LABEL, type SectorDef } from '../data/types';
import type { Enemy } from '../game/enemy/Enemy';
import type { Member } from '../game/player/Member';
import type { World } from '../game/world/World';
import type { Input } from '../input/Input';
import { Cache, el, escapeHtml, q } from './dom';
import { Minimap } from './minimap';
import { ICON, petSvg, portraitSvg } from './portraits';

export interface HudHandlers {
  onInfo(): void;
  onPause(): void;
  onMap(): void;
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
      <div class="bar-row">
        <div class="bar act" title="액티브 게이지"><i></i></div>
        <div class="bar ult" title="궁극기 게이지"><i></i></div>
      </div>
      <div class="buffs"></div>
    </div>
  </div>

  <button class="interact hidden"><span class="it-icon">${ICON.interact}</span><span class="it-text"><b></b><small></small></span><i class="it-bar"></i></button>

  <button class="btn pet"><span class="btn-icon"></span><span class="btn-label"></span><span class="btn-time"></span></button>
  <button class="btn attack"><span class="btn-icon">${ICON.attack}</span><span class="btn-label">기본 공격</span></button>
  <button class="btn dodge"><span class="btn-icon">${ICON.dodge}</span><span class="btn-label">회피</span><span class="btn-count"></span></button>
  <button class="btn active"><span class="btn-icon">${ICON.active}</span><span class="btn-label">액티브</span><span class="btn-time"></span><span class="btn-count"></span></button>
  <button class="btn ult"><span class="btn-icon">${ICON.ult}</span><span class="btn-label">궁극기</span></button>
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
  private elBoss: HTMLElement;
  private elOnfield: HTMLElement;
  private elBuffs: HTMLElement;
  private btnDodge: HTMLElement;
  private btnActive: HTMLElement;
  private btnUlt: HTMLElement;
  private btnPet: HTMLElement;
  private btnInteract: HTMLElement;
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
    this.elBoss = q(r, '.bossbar');
    this.elOnfield = q(r, '.onfield');
    this.elBuffs = q(r, '.buffs');
    this.btnDodge = q(r, '.btn.dodge');
    this.btnActive = q(r, '.btn.active');
    this.btnUlt = q(r, '.btn.ult');
    this.btnPet = q(r, '.btn.pet');
    this.btnInteract = q(r, '.interact');
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

    q(r, '.info-btn').addEventListener('click', () => handlers.onInfo());
    q(r, '.pause-btn').addEventListener('click', () => handlers.onPause());
    q(r, '.minimap').addEventListener('click', () => handlers.onMap());
  }

  show(visible: boolean): void {
    this.root.classList.toggle('hidden', !visible);
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
    q(this.btnPet, '.btn-label').textContent = pet.name;
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
      lines.push([quest.packsCleared >= quest.packsTotal, `괴이 무리 처치 ${quest.packsCleared} / ${quest.packsTotal}`]);
    }
    if (quest.searchTotal > 0) {
      lines.push([quest.searched >= quest.searchTotal, `오브젝트 수색 ${quest.searched} / ${quest.searchTotal}`]);
    }
    const questKey = lines.map((l) => (l[0] ? '1' : '0') + l[1]).join('|');
    if (c.changed('quest', questKey)) {
      this.elQuestList.innerHTML = lines
        .map(([done, text], i) => `<li class="${done ? 'done' : ''} ${i === 0 ? 'main' : ''}">${escapeHtml(text)}</li>`)
        .join('');
    }

    if (c.changed('shards', w.run.shards)) this.elShards.textContent = String(w.run.shards);

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
    if (c.changed('act', Math.round(actRatio * 100))) {
      q(this.elOnfield, '.bar.act i').style.width = `${actRatio * 100}%`;
    }
    const ultMax = db.P('ult.max');
    const ultRatio = Math.min(1, m.ult / ultMax);
    if (c.changed('ult', Math.round(ultRatio * 100))) {
      q(this.elOnfield, '.bar.ult i').style.width = `${ultRatio * 100}%`;
      this.btnUlt.style.setProperty('--fill', String(ultRatio));
      this.btnUlt.classList.toggle('ready', ultRatio >= 1);
    }
    const icons = m.statusIcons();
    const buffKey = icons.map((b) => `${b.label}${b.stacks}`).join('|');
    if (c.changed('buffs', buffKey)) {
      this.elBuffs.innerHTML = icons
        .map((b) => `<span class="buff">${escapeHtml(b.label)}${b.stacks > 1 ? ` <b>${b.stacks}</b>` : ''}</span>`)
        .join('');
    }

    // ⑦ 교체 캐릭터
    let slot = 0;
    p.members.forEach((mem, idx) => {
      if (idx === p.cur || slot >= this.cards.length) return;
      this.updateCard(this.cards[slot], slot, mem, idx, p.swapCd, ultMax);
      slot++;
    });

    // ③ 회피
    if (c.changed('dodge', p.dodgeCharges)) {
      q(this.btnDodge, '.btn-count').textContent = String(p.dodgeCharges);
      this.btnDodge.classList.toggle('off', p.dodgeCharges <= 0);
    }
    const dodgeCd = p.dodgeCharges < m.stats.dodgeCharges ? 1 - p.dodgeTimer / db.P('dodge.recharge') : 0;
    if (c.changed('dodgeCd', Math.round(dodgeCd * 60))) {
      this.btnDodge.style.setProperty('--cd', p.dodgeCharges <= 0 ? String(dodgeCd) : '0');
    }

    // ④ 액티브
    const actCd = m.charges > 0 ? 0 : 1 - actRatio;
    if (c.changed('actCd', Math.round(actCd * 100))) {
      this.btnActive.style.setProperty('--cd', String(actCd));
      this.btnActive.classList.toggle('off', m.charges <= 0);
    }
    const actTime = m.charges > 0 ? '' : String(Math.ceil(m.cd));
    if (c.changed('actTime', actTime)) q(this.btnActive, '.btn-time').textContent = actTime;
    const actCount = m.maxCharges() > 1 ? String(m.charges) : '';
    if (c.changed('actCount', actCount)) q(this.btnActive, '.btn-count').textContent = actCount;

    // ⑨ 펫 스킬
    const petCd = 1 - w.pet.ratio(w);
    if (c.changed('petCd', Math.round(petCd * 100))) {
      this.btnPet.style.setProperty('--cd', String(petCd));
      this.btnPet.classList.toggle('off', petCd > 0);
    }
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
          <span class="sc-pips"><i class="pip act" title="액티브 사용 가능"></i><i class="pip ult" title="궁극기 사용 가능"></i><span class="sc-buff"></span></span>
        </span>
        <span class="sc-key">${index + 1}</span>`;
      card.root.dataset.attr = m.def.attr;
      // 내용이 새로 그려졌으니 세부 값도 다시 채운다
      for (const part of ['hp', 'dead', 'act', 'ult', 'cd', 'buff']) c.changed(`${k}.${part}`, null);
    }
    const ratio = Math.max(0, m.hp / m.stats.maxHp);
    if (c.changed(`${k}.hp`, Math.round(ratio * 100))) {
      q(card.root, '.bar.hp i').style.width = `${ratio * 100}%`;
    }
    if (c.changed(`${k}.dead`, m.dead)) card.root.classList.toggle('dead', m.dead);
    if (c.changed(`${k}.act`, m.charges > 0)) q(card.root, '.pip.act').classList.toggle('on', m.charges > 0);
    if (c.changed(`${k}.ult`, m.ult >= ultMax)) q(card.root, '.pip.ult').classList.toggle('on', m.ult >= ultMax);
    const icons = m.statusIcons();
    const buff = icons.length ? icons[0].label : '';
    if (c.changed(`${k}.buff`, buff)) q(card.root, '.sc-buff').textContent = buff;
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
