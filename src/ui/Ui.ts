// 전투 밖의 화면과 창 (로비, 편성, 보상 선택, 경로, 캠프, 상점, 이벤트, 팀 정보, 결과).
// 각 화면은 사용자가 고를 때까지 기다리는 Promise를 돌려준다.
import type { Rng } from '../core/rng';
import { db, trim } from '../data/tables';
import { ATTR_LABEL, SLOTS, SLOT_LABEL, type Attr } from '../data/types';
import { KITS } from '../game/player/kits';
import { RAID_NAME, WAVE_NAME, raidGrade, raidRecommend, recordKey, type Challenge } from '../game/run/challenge';
import { equipName, equipSkillText, optionText } from '../game/run/equipment';
import type { EventResult, NpcEvent } from '../game/run/events';
import { campRest, type RouteOption } from '../game/run/flow';
import { applyReward, type Reward } from '../game/run/rewards';
import type { EquipItem, RunState } from '../game/run/RunState';
import { runFromDeck, type Deck, type SaveData } from '../game/run/save';
import { teamScore } from '../game/run/score';
import type { ShopItem } from '../game/run/shop';
import { computeStats } from '../game/run/stats';
import type { World } from '../game/world/World';
import { charTags, equipCard, equipCardAttrs, equipLine, upgradeCard, upgradeCardClass, upgradeOwnerText } from './cards';
import { el, escapeHtml, q } from './dom';
import { drawFullMap } from './minimap';
import { TIER_NAME, bagDiscard, bagValue, valueOf, type BagItem, type Find, type FindOption } from '../game/run/valuables';
import { asset } from './assets';
import { valuableIcon } from './portraits';
import { petSvg, portraitSvg } from './portraits';

export type LobbyAction =
  | { type: 'new' }
  | { type: 'resume' }
  | { type: 'deleteDeck'; id: string }
  | { type: 'challenge'; id: string };

export interface ChallengeResultInfo {
  title: string;
  text: string;
  /** 결과 수치 (이름, 값) */
  stats: [string, string][];
  /** 신기록 여부 */
  record: boolean;
}

/** 팀 정보 창의 "포기" 버튼 문구 */
export interface AbandonText {
  label: string;
  title: string;
  text: string;
}

const ABANDON_RUN: AbandonText = {
  label: '조사 포기',
  title: '조사 포기',
  text: '조사를 포기하면 이번 런에서 쌓은 것을 모두 잃습니다. 파티덱은 저장되지 않습니다.',
};

export interface DebugActions {
  /** 무적을 켜고 끈다. 켜졌으면 true */
  invuln(): boolean;
  /** 근거리 캐릭터의 자동 조준을 켜고 끈다. 켜졌으면 true */
  autoAim(): boolean;
  autoAimOn(): boolean;
  clearSector(): void;
  reward(): void;
  shards(): void;
  ult(): void;
  reveal(): void;
  heal(): void;
}

export interface ResultInfo {
  title: string;
  text: string;
  run: RunState;
  saved: boolean;
  /** 들고 나온 귀중품을 은화로 바꾼 내역. 잃었으면 lost 에 잃은 가치 */
  exchange?: { items: { name: string; value: number; tier: number; taint: boolean }[]; total: number; wallet: number };
  lostValue?: number;
}

const fmtTime = (sec: number): string => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const pct = (v: number): string => `${trim(v * 100)}%`;

export class Ui {
  private layers: HTMLElement[] = [];
  /** 창이 하나라도 떠 있는지가 바뀔 때 */
  onChange: (open: boolean) => void = () => {};

  constructor(private root: HTMLElement) {}

  get open(): boolean {
    return this.layers.length > 0;
  }

  private push(node: HTMLElement): () => void {
    this.layers.push(node);
    this.root.appendChild(node);
    this.onChange(true);
    return () => {
      const i = this.layers.indexOf(node);
      if (i < 0) return;
      this.layers.splice(i, 1);
      node.remove();
      this.onChange(this.layers.length > 0);
    };
  }

  closeAll(): void {
    for (const node of this.layers.splice(0)) node.remove();
    this.onChange(false);
  }

  private on(node: ParentNode, selector: string, fn: (target: HTMLElement) => void): void {
    node.querySelectorAll<HTMLElement>(selector).forEach((target) => target.addEventListener('click', () => fn(target)));
  }

  // ---- 공통 --------------------------------------------------------------

  confirm(title: string, text: string, yes: string, no = '취소'): Promise<boolean> {
    return new Promise((resolve) => {
      const node = el(`
        <div class="overlay">
          <div class="panel">
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(text)}</p>
            <div class="row">
              <button class="ui-btn" data-act="no">${escapeHtml(no)}</button>
              <button class="ui-btn danger" data-act="yes">${escapeHtml(yes)}</button>
            </div>
          </div>
        </div>`);
      const close = this.push(node);
      this.on(node, '[data-act="yes"]', () => (close(), resolve(true)));
      this.on(node, '[data-act="no"]', () => (close(), resolve(false)));
    });
  }

  /** 수상한 보따리: 어떻게 챙길지 고른다. 고른 선택지의 id를 돌려준다 */
  find(f: Find): Promise<FindOption['id']> {
    return new Promise((resolve) => {
      const node = el(`
        <div class="overlay find">
          <div class="find-head">${valuableIcon(f.item.id)}<div><h2>${escapeHtml(f.title)}</h2><p>${escapeHtml(f.text)}</p></div></div>
          <div class="cards">${f.options
            .map((o) => `<button class="card choice ${o.risky ? 'risky' : ''}" data-opt="${o.id}"><span class="card-kind">${o.risky ? '위험' : '안전'}</span><b class="card-name">${escapeHtml(o.label)}</b><span class="card-desc">${escapeHtml(o.desc)}</span></button>`)
            .join('')}</div>
        </div>`);
      const close = this.push(node);
      this.on(node, '[data-opt]', (t) => (close(), resolve(t.dataset.opt as FindOption['id'])));
    });
  }

  /**
   * 가방이 가득 찼을 때: 가방의 물건과 새로 얻은 물건 가운데 버릴 것을 고른다.
   * 버릴 물건의 번호를 돌려준다 (가방 칸 번호. 새 물건을 버리면 가방 길이와 같은 번호)
   */
  bagFull(run: RunState, incoming: BagItem): Promise<number> {
    return new Promise((resolve) => {
      const all = [...run.bag, incoming];
      const node = el(`
        <div class="overlay find">
          <div class="find-head"><div><h2>가방이 가득 찼습니다</h2><p>${db.P('bag.slots')}칸이 모두 찼습니다. 하나를 버려야 합니다. 버린 물건은 되찾을 수 없습니다.</p></div></div>
          <div class="cards">${all
            .map((it, i) => {
              const d = db.valuable(it.id);
              return `<button class="card choice bag-card vt-${d.tier}" data-i="${i}"><span class="card-kind">${i === run.bag.length ? '새로 얻은 것' : `가방 ${i + 1}번`}<em>${TIER_NAME[d.tier]}</em></span>${valuableIcon(it.id)}<b class="card-name">${escapeHtml(d.name)}</b><span class="card-desc">${valueOf(it)} 은화${it.taint ? ` · 오염 (${escapeHtml(db.curseDesc(it.taint))})` : ''}</span><span class="drop-label">이것을 버린다</span></button>`;
            })
            .join('')}</div>
        </div>`);
      const close = this.push(node);
      this.on(node, '[data-i]', (t) => (close(), resolve(Number(t.dataset.i))));
    });
  }

  /** 결과를 알리는 짧은 창 */
  notice(title: string, text: string, icon = ''): Promise<void> {
    return new Promise((resolve) => {
      const node = el(`
        <div class="overlay">
          <div class="panel notice">${icon}<h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p>
            <div class="row"><button class="ui-btn primary" data-act="ok">확인</button></div>
          </div>
        </div>`);
      const close = this.push(node);
      this.on(node, '[data-act="ok"]', () => (close(), resolve()));
    });
  }

  private teamRow(run: RunState): string {
    return `<div class="team-row">${run.team
      .map((m) => {
        const def = db.char(m.id);
        const max = computeStats(run, def).maxHp;
        const hp = m.dead ? 0 : m.hp < 0 ? max : m.hp;
        return `<div class="team-mini ${m.dead ? 'dead' : ''}" data-attr="${def.attr}">
          <span class="sc-portrait">${portraitSvg(def)}</span>
          <b>${def.name}</b>
          <span class="bar hp"><i style="width:${(hp / max) * 100}%"></i></span>
          <small>${m.dead ? '전투 불능' : `${Math.round(hp)} / ${max}`}</small>
        </div>`;
      })
      .join('')}
      <div class="team-mini"><span class="sc-portrait">${petSvg(db.pet(run.petId))}</span><b>${db.pet(run.petId).name}</b></div>
    </div>`;
  }

  // ---- 로비 --------------------------------------------------------------

  lobby(save: SaveData): Promise<LobbyAction> {
    return new Promise((resolve) => {
      const run = save.run;
      const max = db.P('deck.max');
      const decks = save.decks
        .map((d) => {
          const date = new Date(d.savedAt);
          return `
          <div class="deck">
            <div class="deck-faces">${d.team.map((id) => `<i>${portraitSvg(db.char(id))}</i>`).join('')}<i>${petSvg(db.pet(d.petId))}</i></div>
            <div class="deck-info">
              <b>팀 점수 ${d.score}</b>
              <span>${d.outcome === 'boss' ? '보스 격파' : `캠프 탈출 · 섹터 ${d.cleared}`} · ${date.getMonth() + 1}/${date.getDate()}</span>
            </div>
            <button class="ui-btn small primary" data-go="${d.id}">도전</button>
            <button class="ui-btn small" data-view="${d.id}">보기</button>
            <button class="ui-btn small" data-del="${d.id}">삭제</button>
          </div>`;
        })
        .join('');
      const node = el(`
        <div class="screen lobby"${asset('ui/lobby_bg') ? ` style="--lobby-bg:url(${asset('ui/lobby_bg')})"` : ''}>
          <div class="lobby-main">
            <div class="lobby-title">
              <small>시즌 1 · 그믐밤의 구도심</small>
              <h1>괴담 조사</h1>
              <p>프로토타입 — 시즌 런 + 파티덱 컨텐츠</p>
            </div>
            <div class="lobby-actions">
              <button class="ui-btn primary" data-act="new">새 조사 시작</button>
              ${run ? `<button class="ui-btn" data-act="resume">이어하기 · 섹터 ${run.sector}${run.bonus ? ' (보너스 맵)' : ''}</button>` : ''}
            </div>
            <p class="hint">키보드: 이동 WASD · 공격 J · 회피 K · 액티브 L · 궁극기 I · 펫 O · 교체 1 2 3 · 상호작용 F</p>
          </div>
          <div class="lobby-decks">
            <h3>저장된 조사 팀 <small>${save.decks.length} / ${max}</small><span class="wallet" title="던전에서 들고 나온 귀중품을 바꾼 재화">은화 <b>${save.wallet}</b></span></h3>
            <div class="deck-list">${
              decks ||
              '<p class="empty">아직 저장된 조사 팀이 없습니다.<br>캠프에서 탈출하거나 보스를 격파하면 그때의 팀이 저장됩니다.<br>전멸하면 저장되지 않습니다.</p>'
            }</div>
          </div>
        </div>`);
      const close = this.push(node);
      this.on(node, '[data-act="new"]', () => (close(), resolve({ type: 'new' })));
      this.on(node, '[data-act="resume"]', () => (close(), resolve({ type: 'resume' })));
      this.on(node, '[data-go]', (t) => (close(), resolve({ type: 'challenge', id: t.dataset.go! })));
      this.on(node, '[data-view]', (t) => {
        const deck = save.decks.find((d) => d.id === t.dataset.view);
        if (deck) void this.deckView(deck);
      });
      this.on(node, '[data-del]', async (t) => {
        if (await this.confirm('조사 팀 삭제', '이 조사 팀을 삭제합니다. 되돌릴 수 없습니다.', '삭제')) {
          close();
          resolve({ type: 'deleteDeck', id: t.dataset.del! });
        }
      });
    });
  }

  private deckView(deck: Deck): Promise<void> {
    return this.team(runFromDeck(deck), null, null, `저장된 조사 팀 · 팀 점수 ${deck.score}`).then(() => undefined);
  }

  // ---- 파티덱 컨텐츠 --------------------------------------------------------

  /** 저장된 조사 팀으로 도전할 컨텐츠와 난이도를 고른다. 닫으면 null */
  challengeSelect(deck: Deck, save: SaveData): Promise<Challenge | null> {
    return new Promise((resolve) => {
      const levels = db.P('raid.levels');
      const raidButtons = Array.from({ length: levels }, (_, i) => {
        const level = i + 1;
        const best = save.records[recordKey(deck.id, { kind: 'raid', level })];
        const recommend = raidRecommend(level);
        return `<button class="ch-level ${deck.score < recommend ? 'hard' : ''}" data-raid="${level}">
          <b>난이도 ${level}</b>
          <small>권장 팀 점수 ${recommend}</small>
          <em>${best === undefined ? '기록 없음' : `최고 ${fmtTime(best)} · ${raidGrade(best)}등급`}</em>
        </button>`;
      }).join('');
      const waveBest = save.records[recordKey(deck.id, { kind: 'wave' })];
      const node = el(`
        <div class="overlay">
          <div class="panel wide">
            <div class="team-head"><h2>파티덱 컨텐츠</h2><span>이 조사 팀의 팀 점수 <b>${deck.score}</b></span></div>
            ${this.teamRow(runFromDeck(deck))}
            <div class="ch-cols">
              <div class="ch-box">
                <h3>${RAID_NAME} <small>강화된 괴이 1체와 타임어택 · 제한 시간 ${fmtTime(db.P('raid.timeLimit'))}</small></h3>
                <div class="ch-levels">${raidButtons}</div>
              </div>
              <div class="ch-box">
                <h3>${WAVE_NAME} <small>${fmtTime(db.P('wave.duration'))} 동안 몰려오는 괴이를 버틴다</small></h3>
                <p>${waveBest === undefined ? '기록 없음' : `최고 점수 <b>${waveBest}</b>`}</p>
                <button class="ui-btn primary" data-act="wave">도전</button>
              </div>
            </div>
            <div class="row"><button class="ui-btn" data-act="back">닫기</button></div>
          </div>
        </div>`);
      const close = this.push(node);
      this.on(node, '[data-raid]', (t) => (close(), resolve({ kind: 'raid', level: Number(t.dataset.raid) })));
      this.on(node, '[data-act="wave"]', () => (close(), resolve({ kind: 'wave' })));
      this.on(node, '[data-act="back"]', () => (close(), resolve(null)));
    });
  }

  challengeResult(info: ChallengeResultInfo): Promise<'retry' | 'lobby'> {
    return new Promise((resolve) => {
      const node = el(`
        <div class="overlay">
          <div class="panel">
            <h2>${escapeHtml(info.title)}</h2>
            <p>${escapeHtml(info.text)}</p>
            <div class="stats">${info.stats
              .map(([name, value]) => `<div><b>${escapeHtml(value)}</b><span>${escapeHtml(name)}</span></div>`)
              .join('')}</div>
            ${info.record ? '<div class="score"><span>신기록</span></div>' : ''}
            <div class="row">
              <button class="ui-btn" data-act="lobby">로비로</button>
              <button class="ui-btn primary" data-act="retry">다시 도전</button>
            </div>
          </div>
        </div>`);
      const close = this.push(node);
      this.on(node, '[data-act="retry"]', () => (close(), resolve('retry')));
      this.on(node, '[data-act="lobby"]', () => (close(), resolve('lobby')));
    });
  }

  // ---- 팀 편성 ------------------------------------------------------------

  formation(bossWeak: Attr): Promise<{ team: string[]; petId: string } | null> {
    return new Promise((resolve) => {
      const roster = db.charList.filter((c) => KITS[c.id]);
      const picked: string[] = roster.slice(0, 3).map((c) => c.id);
      let petId = db.petList[0].id;
      let focus = roster[0].id;

      const node = el(`
        <div class="screen formation">
          <div class="form-head">
            <button class="ui-btn small" data-act="back">‹ 로비</button>
            <h2>조사 팀 편성</h2>
            <span class="boss-weak" data-attr="${bossWeak}">이번 괴이의 약점 · ${ATTR_LABEL[bossWeak]}</span>
          </div>
          <div class="form-body">
            <div class="form-left">
              <h3>캐릭터 <small>3명을 고른다. 고른 순서가 교체 순서다</small></h3>
              <div class="roster"></div>
              <h3>펫 <small>1마리</small></h3>
              <div class="pets"></div>
            </div>
            <div class="form-detail"></div>
          </div>
          <div class="form-foot">
            <span class="form-status"></span>
            <button class="ui-btn primary" data-act="start">조사 시작</button>
          </div>
        </div>`);
      const close = this.push(node);
      const rosterEl = q(node, '.roster');
      const petsEl = q(node, '.pets');
      const detailEl = q(node, '.form-detail');
      const startBtn = q<HTMLButtonElement>(node, '[data-act="start"]');

      const render = (): void => {
        rosterEl.innerHTML = roster
          .map((c) => {
            const order = picked.indexOf(c.id);
            return `<button class="pick ${order >= 0 ? 'on' : ''} ${focus === c.id ? 'focus' : ''}" data-char="${c.id}" data-attr="${c.attr}">
              <span class="sc-portrait">${portraitSvg(c)}</span>
              <b>${c.name}</b><small>${charTags(c)}</small>
              ${order >= 0 ? `<i class="order">${order + 1}</i>` : ''}
              ${c.attr === bossWeak ? '<i class="weak-mark">약점</i>' : ''}
            </button>`;
          })
          .join('');
        petsEl.innerHTML = db.petList
          .map(
            (p) => `<button class="pick pet ${petId === p.id ? 'on' : ''}" data-pet="${p.id}">
              <span class="sc-portrait">${petSvg(p)}</span><b>${p.name}</b><small>${escapeHtml(db.petDesc(p.id))}</small>
              ${petId === p.id ? '<i class="order">✓</i>' : ''}
            </button>`,
          )
          .join('');
        const c = db.char(focus);
        detailEl.innerHTML = `
          <div class="detail-head" data-attr="${c.attr}">
            <span class="sc-portrait">${portraitSvg(c)}</span>
            <div><b>${c.name}</b><small>${charTags(c)} · ${escapeHtml(c.weapon)}</small><p>${escapeHtml(c.desc)}</p></div>
          </div>
          <dl class="skills">
            ${(['basic', 'active', 'ult', 'passive'] as const)
              .map((slot) => {
                const s = db.skill(c.id, slot);
                const label = { basic: '기본 공격', active: '액티브', ult: '궁극기', passive: '패시브' }[slot];
                const cd = slot === 'active' ? ` <small>쿨타임 ${s.cooldown}초</small>` : '';
                return `<dt><em>${label}</em>${escapeHtml(s.name)}${cd}</dt><dd>${escapeHtml(db.skillDesc(c.id, slot))}</dd>`;
              })
              .join('')}
          </dl>
          <div class="plans"><em>고유 성장</em>${db.upgradeList
            .filter((u) => u.category === 'unique' && u.owner === c.id)
            .map((u) => `<span title="${escapeHtml(db.upgradeDesc(u.id))}">${escapeHtml(u.name)}</span>`)
            .join('')}</div>`;
        q(node, '.form-status').textContent =
          picked.length === 3 ? `편성 완료 · 펫 ${db.pet(petId).name}` : `캐릭터를 ${3 - picked.length}명 더 골라 주세요`;
        startBtn.disabled = picked.length !== 3;

        this.on(rosterEl, '[data-char]', (t) => {
          const id = t.dataset.char!;
          focus = id;
          const i = picked.indexOf(id);
          if (i >= 0) picked.splice(i, 1);
          else if (picked.length < 3) picked.push(id);
          render();
        });
        this.on(petsEl, '[data-pet]', (t) => {
          petId = t.dataset.pet!;
          render();
        });
      };
      render();
      this.on(node, '[data-act="back"]', () => (close(), resolve(null)));
      this.on(node, '[data-act="start"]', () => {
        if (picked.length !== 3) return;
        close();
        resolve({ team: [...picked], petId });
      });
    });
  }

  // ---- 업그레이드 선택 (3택 1) -------------------------------------------

  /** 선택지를 보여 주고, 고른 보상을 런에 적용한다. 건너뛰면 괴담 조각을 준다 */
  reward(run: RunState, choices: Reward[], title: string, sub: string): Promise<void> {
    return new Promise((resolve) => {
      const skip = db.P('reward.skipShards');
      const node = el(`<div class="overlay reward"></div>`);
      const close = this.push(node);
      const finish = (): void => {
        close();
        resolve();
      };
      const showChoices = (): void => {
        node.innerHTML = `
          <div class="ov-head"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(sub)}</p></div>
          <div class="cards">${choices
            .map((c, i) =>
              c.type === 'upgrade'
                ? `<button class="${upgradeCardClass(c.id)}" data-i="${i}">${upgradeCard(run, c.id)}</button>`
                : `<button ${equipCardAttrs(c.item)} data-i="${i}">${equipCard(c.item)}</button>`,
            )
            .join('')}</div>
          <div class="row"><button class="ui-btn" data-act="skip">건너뛰기 (괴담 조각 +${skip})</button></div>`;
        this.on(node, '[data-i]', async (t) => {
          const choice = choices[Number(t.dataset.i)];
          if (choice.type === 'upgrade') {
            applyReward(run, choice);
            finish();
            return;
          }
          const charId = await this.equipTarget(run, choice.item);
          if (charId) {
            applyReward(run, choice, charId);
            finish();
          }
        });
        this.on(node, '[data-act="skip"]', () => {
          run.shards += skip;
          finish();
        });
      };
      showChoices();
    });
  }

  /** 장비를 장착할 캐릭터를 고른다. 취소하면 null */
  equipTarget(run: RunState, item: EquipItem): Promise<string | null> {
    return new Promise((resolve) => {
      const slotName = SLOT_LABEL[item.slot];
      const node = el(`
        <div class="overlay reward">
          <div class="ov-head">
            <h2>장착할 캐릭터</h2>
            <p>${slotName} "${escapeHtml(equipName(item))}" — 이미 장비가 있으면 기존 장비는 괴담 조각으로 환산됩니다</p>
          </div>
          <div class="targets">${run.team
            .map((m) => {
              const def = db.char(m.id);
              const cur = run.equipment[m.id]?.[item.slot];
              return `<button class="target" data-char="${m.id}" data-attr="${def.attr}">
                <span class="sc-portrait">${portraitSvg(def)}</span>
                <b>${def.name}</b><small>${charTags(def)}</small>
                ${equipLine(cur, slotName)}
                ${cur ? `<small class="refund">교체 시 괴담 조각 +${db.rarity(cur.rarity).refund}</small>` : ''}
              </button>`;
            })
            .join('')}</div>
          <div class="row"><button class="ui-btn" data-act="back">‹ 다시 고르기</button></div>
        </div>`);
      const close = this.push(node);
      this.on(node, '[data-char]', (t) => (close(), resolve(t.dataset.char!)));
      this.on(node, '[data-act="back"]', () => (close(), resolve(null)));
    });
  }

  // ---- 경로 선택 ----------------------------------------------------------

  route(run: RunState, options: RouteOption[]): Promise<RouteOption> {
    return new Promise((resolve) => {
      const next = db.sector(run.sector);
      const track = db.sectors
        .filter((s) => s.type !== 'bonus')
        .map((s) => {
          const state = s.index < run.sector ? 'done' : s.index === run.sector ? 'next' : '';
          return `<i class="node ${state} ${s.type === 'boss' ? 'boss' : ''}" title="${escapeHtml(s.name)}">${s.type === 'boss' ? '괴이' : s.index}</i>${
            s.camp ? '<i class="camp-mark" title="체크포인트 캠프">캠프</i>' : ''
          }`;
        })
        .join('');
      const node = el(`
        <div class="overlay route">
          <div class="ov-head"><h2>경로 선택</h2><p>다음: 섹터 ${next.index} · ${escapeHtml(next.name)}</p></div>
          <div class="track">${track}</div>
          <div class="cards">${options
            .map(
              (o, i) => `<button class="card route-card grade-${o.grade}" data-i="${i}">
                <span class="card-kind">${o.bonus ? '보너스 맵' : `위험 등급 ${'★'.repeat(o.grade)}`}</span>
                <b class="card-name">${escapeHtml(o.name)}</b>
                <span class="card-desc">${escapeHtml(o.desc)}</span>
                ${o.route && o.route.score > 0 ? `<span class="card-lv">팀 점수 +${o.route.score}</span>` : ''}
              </button>`,
            )
            .join('')}</div>
        </div>`);
      const close = this.push(node);
      this.on(node, '[data-i]', (t) => (close(), resolve(options[Number(t.dataset.i)])));
    });
  }

  // ---- 체크포인트 캠프 ------------------------------------------------------

  camp(run: RunState, openShop: () => Promise<void>): Promise<'continue' | 'extract'> {
    return new Promise((resolve) => {
      let rested = false;
      const node = el(`<div class="overlay camp"><div class="panel wide"></div></div>`);
      const close = this.push(node);
      const panel = q(node, '.panel');
      const render = (): void => {
        const score = teamScore(run).total;
        panel.innerHTML = `
          <h2>체크포인트 캠프</h2>
          <p>여기서 탈출하면 지금의 빌드가 조사 팀으로 저장됩니다. 계속 가다 전멸하면 모두 잃습니다.</p>
          ${this.teamRow(run)}
          <div class="camp-score">현재 팀 점수 <b>${score}</b> · 괴담 조각 <b>${run.shards}</b> · 다음 섹터 ${run.sector}</div>
          <div class="row wrap">
            <button class="ui-btn" data-act="rest" ${rested ? 'disabled' : ''}>${
              rested ? '휴식 완료' : `휴식 (체력 ${db.P('camp.restHeal')}% 회복, 전투 불능 복귀)`
            }</button>
            <button class="ui-btn" data-act="shop">상점</button>
            <button class="ui-btn" data-act="info">팀 정보</button>
            <button class="ui-btn danger" data-act="extract">탈출 (조사 팀 저장)</button>
            <button class="ui-btn primary" data-act="continue">계속 조사</button>
          </div>`;
        this.on(panel, '[data-act="rest"]', () => {
          if (rested) return;
          rested = true;
          campRest(run);
          render();
        });
        this.on(panel, '[data-act="shop"]', async () => {
          await openShop();
          render();
        });
        this.on(panel, '[data-act="info"]', () => void this.team(run, null, null));
        this.on(panel, '[data-act="extract"]', async () => {
          const ok = await this.confirm(
            '탈출',
            `지금의 팀(팀 점수 ${score})을 조사 팀으로 저장하고 조사를 끝냅니다.`,
            '탈출한다',
          );
          if (ok) {
            close();
            resolve('extract');
          }
        });
        this.on(panel, '[data-act="continue"]', () => (close(), resolve('continue')));
      };
      render();
    });
  }

  // ---- 상점 (성장 구입) -----------------------------------------------------

  /** @param heal 응급 처치를 샀을 때 팀을 회복시키는 방법 (섹터 안과 밖이 다르다) */
  shop(run: RunState, items: ShopItem[], heal: () => void): Promise<void> {
    return new Promise((resolve) => {
      const node = el(`<div class="overlay reward shop"></div>`);
      const close = this.push(node);
      const render = (): void => {
        node.innerHTML = `
          <div class="ov-head"><h2>상점</h2><p>보유 괴담 조각 <b>${run.shards}</b></p></div>
          <div class="cards">${items
            .map((it, i) => {
              const buy = it.sold
                ? '<span class="price sold">구입 완료</span>'
                : `<span class="price ${run.shards < it.price ? 'poor' : ''}">괴담 조각 ${it.price}</span>`;
              if (it.kind === 'upgrade') {
                return `<button class="${upgradeCardClass(it.id)}" data-i="${i}" ${it.sold ? 'disabled' : ''}>${upgradeCard(run, it.id)}${buy}</button>`;
              }
              if (it.kind === 'equip') {
                return `<button ${equipCardAttrs(it.item)} data-i="${i}" ${it.sold ? 'disabled' : ''}>${equipCard(it.item)}${buy}</button>`;
              }
              return `<button class="card" data-i="${i}" ${it.sold ? 'disabled' : ''}>
                <span class="card-kind">보급</span><b class="card-name">응급 처치</b>
                <span class="card-desc">살아 있는 팀원 전원 체력 ${db.P('shop.heal')}% 회복</span>${buy}</button>`;
            })
            .join('')}</div>
          <div class="row"><button class="ui-btn primary" data-act="close">나가기</button></div>`;
        this.on(node, '[data-i]', async (t) => {
          const it = items[Number(t.dataset.i)];
          if (it.sold || run.shards < it.price) return;
          if (it.kind === 'equip') {
            const charId = await this.equipTarget(run, it.item);
            if (!charId) return;
            run.shards -= it.price;
            applyReward(run, { type: 'equip', item: it.item }, charId);
          } else if (it.kind === 'upgrade') {
            run.shards -= it.price;
            applyReward(run, { type: 'upgrade', id: it.id });
          } else {
            run.shards -= it.price;
            heal();
          }
          it.sold = true;
          render();
        });
        this.on(node, '[data-act="close"]', () => (close(), resolve()));
      };
      render();
    });
  }

  // ---- NPC 이벤트 ----------------------------------------------------------

  event(w: World, ev: NpcEvent, rng: Rng): Promise<EventResult> {
    return new Promise((resolve) => {
      const node = el(`
        <div class="overlay event">
          <div class="panel">
            <h2>${escapeHtml(ev.npc)}</h2>
            <p class="event-text">${escapeHtml(ev.text)}</p>
            <div class="choices">${ev.choices
              .map(
                (c, i) => `<button class="choice" data-i="${i}" ${c.disabled ? 'disabled' : ''}>
                  <b>${escapeHtml(c.label)}</b><span>${escapeHtml(c.detail)}</span></button>`,
              )
              .join('')}</div>
          </div>
        </div>`);
      const close = this.push(node);
      this.on(node, '[data-i]', (t) => {
        const res = ev.choices[Number(t.dataset.i)].pick(w, rng);
        if (!res.text) {
          close();
          resolve(res);
          return;
        }
        q(node, '.panel').innerHTML = `
          <h2>${escapeHtml(ev.npc)}</h2>
          <p class="event-text">${escapeHtml(res.text)}</p>
          <div class="row"><button class="ui-btn primary" data-act="ok">확인</button></div>`;
        this.on(node, '[data-act="ok"]', () => (close(), resolve(res)));
      });
    });
  }

  // ---- 팀 정보 (HUD ⑪) / 일시정지 ------------------------------------------

  /**
   * @param w 전투 중이면 그 월드 (현재 체력을 보여 준다)
   * @param debug 디버그 메뉴 동작. null이면 디버그·런 포기 버튼을 숨긴다 (보기 전용)
   * @returns 'abandon'이면 런 포기
   */
  team(
    run: RunState,
    w: World | null,
    debug: DebugActions | null,
    title = '조사 팀',
    abandon: AbandonText = ABANDON_RUN,
  ): Promise<'resume' | 'abandon'> {
    return new Promise((resolve) => {
      const node = el(`<div class="overlay team"><div class="panel wide team-panel"></div></div>`);
      const close = this.push(node);
      const panel = q(node, '.panel');
      let showDebug = false;

      const render = (): void => {
        const score = teamScore(run);
        const chars = run.team
          .map((ms, idx) => {
            const def = db.char(ms.id);
            const st = computeStats(run, def);
            const live = w?.party.members[idx];
            const hp = live ? live.hp : ms.dead ? 0 : ms.hp < 0 ? st.maxHp : ms.hp;
            const ups = db.upgradeList.filter((u) => u.category === 'unique' && u.owner === def.id && run.lv(u.id) > 0);
            const items = run.equipment[def.id] ?? {};
            return `
            <div class="team-char" data-attr="${def.attr}">
              <div class="tc-head">
                <span class="sc-portrait">${portraitSvg(def)}</span>
                <div><b>${def.name}</b><small>${charTags(def)}</small>
                  <span class="bar hp"><i style="width:${Math.max(0, (hp / st.maxHp) * 100)}%"></i></span></div>
              </div>
              <div class="tc-stats">
                <span>체력 <b>${Math.max(0, Math.round(hp))} / ${st.maxHp}</b></span>
                <span>공격력 <b>${Math.round(st.atk)}</b></span>
                <span>치명타 <b>${pct(st.critRate)}</b></span>
                <span>치명타 피해 <b>${pct(st.critDmg)}</b></span>
                <span>쿨타임 <b>${pct(st.cdr)}</b></span>
                <span>받는 피해 <b>${pct(st.dmgTaken)}</b></span>
              </div>
              <div class="tc-equip">${SLOTS.map((slot) => {
                const item = items[slot];
                if (!item) return `<div class="eq empty"><em>${SLOT_LABEL[slot]}</em> 비어 있음</div>`;
                const r = db.rarity(item.rarity);
                return `<div class="eq" style="--rc:${r.color}">
                  <em>${SLOT_LABEL[slot]}</em> <b>${escapeHtml(equipName(item))}</b> <small>${r.name}</small>
                  <p>${escapeHtml(equipSkillText(item))}</p>
                  <p class="opts">${item.opts.map((o) => escapeHtml(optionText(o.stat, o.v, slot))).join(' · ')}</p>
                </div>`;
              }).join('')}</div>
              <div class="tc-ups">${
                ups.length
                  ? ups
                      .map((u) => `<span title="${escapeHtml(db.upgradeDesc(u.id))}">${escapeHtml(u.name)} <b>Lv ${run.lv(u.id)}</b></span>`)
                      .join('')
                  : '<small>고유 성장 없음</small>'
              }</div>
            </div>`;
          })
          .join('');
        const shared = db.upgradeList
          .filter((u) => u.category !== 'unique' && run.lv(u.id) > 0)
          .map(
            (u) =>
              `<span title="${escapeHtml(db.upgradeDesc(u.id))}"><em>${escapeHtml(upgradeOwnerText(u))}</em> ${escapeHtml(u.name)} <b>Lv ${run.lv(u.id)}</b></span>`,
          )
          .join('');
        const relics = [
          run.relics.atk ? `공격력 +${run.relics.atk * db.P('relic.atk')}%` : '',
          run.relics.hp ? `최대 체력 +${run.relics.hp * db.P('relic.hp')}%` : '',
          run.relics.crit ? `치명타 확률 +${run.relics.crit * db.P('relic.crit')}%` : '',
        ]
          .filter(Boolean)
          .join(' · ');
        const pet = db.pet(run.petId);
        panel.innerHTML = `
          <div class="team-head">
            <h2>${escapeHtml(title)}</h2>
            <span>팀 점수 <b>${score.total}</b> · 괴담 조각 <b>${run.shards}</b> · 괴이 약점 <b>${ATTR_LABEL[run.bossWeak]}</b></span>
          </div>
          <div class="team-cols">${chars}</div>
          <div class="team-shared">
            <div><em class="lbl">펫</em> <b>${pet.name}</b> — ${escapeHtml(db.petDesc(pet.id))}</div>
            <div class="tc-ups"><em class="lbl">시즌 · 펫 스킬</em> ${shared || '<small>없음</small>'}</div>
            ${relics ? `<div><em class="lbl">괴담의 잔재</em> ${relics}</div>` : ''}
            <div class="bag"><em class="lbl">가방 ${run.bag.length} / ${db.P('bag.slots')}</em>
              ${run.bag.map((it, i) => `<span class="bag-item vt-${db.valuable(it.id).tier}">${valuableIcon(it.id)}<b>${escapeHtml(db.valuable(it.id).name)}</b>${it.taint ? `<i title="${escapeHtml(db.curseDesc(it.taint))}">오염</i>` : ''}<small>${valueOf(it)} 은화</small>${w ? `<button class="ui-btn small" data-drop="${i}">버리기</button>` : ''}</span>`).join('') || '<small>비어 있음</small>'}
              ${run.bag.length ? `<small class="bag-sum">나가면 은화 ${bagValue(run)}</small>` : ''}
            </div>
            ${run.curses.length ? `<div class="curses"><em class="lbl">저주</em> ${run.curses.map((id) => `<span title="${escapeHtml(db.curseDesc(id))}">${escapeHtml(db.curse(id).name)} <small>${escapeHtml(db.curseDesc(id))}</small></span>`).join('')}</div>` : ''}
          </div>
          ${
            showDebug && debug
              ? `<div class="debug">
                  <button class="ui-btn small" data-dbg="invuln">무적 켜기/끄기</button>
                  <button class="ui-btn small" data-dbg="autoAim">근거리 자동 조준 ${debug?.autoAimOn() ? '켜짐' : '꺼짐'}</button>
                  <button class="ui-btn small" data-dbg="clearSector">섹터 클리어</button>
                  <button class="ui-btn small" data-dbg="reward">보상 받기</button>
                  <button class="ui-btn small" data-dbg="shards">괴담 조각 +200</button>
                  <button class="ui-btn small" data-dbg="ult">궁극기 충전</button>
                  <button class="ui-btn small" data-dbg="reveal">지도 공개</button>
                  <button class="ui-btn small" data-dbg="heal">전원 회복</button>
                </div>`
              : ''
          }
          <div class="row">
            ${debug ? `<button class="ui-btn danger" data-act="abandon">${escapeHtml(abandon.label)}</button><button class="ui-btn" data-act="debug">디버그</button>` : ''}
            <button class="ui-btn primary" data-act="resume">${debug ? '계속' : '닫기'}</button>
          </div>`;

        this.on(panel, '[data-act="resume"]', () => (close(), resolve('resume')));
        this.on(panel, '[data-act="debug"]', () => {
          showDebug = !showDebug;
          render();
        });
        this.on(panel, '[data-act="abandon"]', async () => {
          const ok = await this.confirm(abandon.title, abandon.text, '포기한다');
          if (ok) {
            close();
            resolve('abandon');
          }
        });
        this.on(panel, '[data-drop]', (t) => {
          // 가방의 물건을 버린다 (오염된 물건을 버리면 그 저주도 풀린다)
          bagDiscard(run, Number(t.dataset.drop));
          w?.refreshTeam();
          render();
        });
        this.on(panel, '[data-dbg]', (t) => {
          const kind = t.dataset.dbg as keyof DebugActions;
          if (!debug) return;
          if (kind === 'invuln') {
            t.textContent = debug.invuln() ? '무적 켜짐' : '무적 꺼짐';
            return;
          }
          if (kind === 'autoAim') {
            t.textContent = debug.autoAim() ? '근거리 자동 조준 켜짐' : '근거리 자동 조준 꺼짐';
            return;
          }
          if (kind === 'autoAimOn') return;
          // 화면 전환이 따르는 동작은 창을 닫고 실행한다
          if (kind === 'clearSector' || kind === 'reward') {
            close();
            resolve('resume');
            debug[kind]();
            return;
          }
          debug[kind]();
          render();
        });
      };
      render();
    });
  }

  // ---- 상세 맵 (HUD ⑧) ----------------------------------------------------

  map(w: World): Promise<void> {
    return new Promise((resolve) => {
      const node = el(`
        <div class="overlay fullmap">
          <canvas></canvas>
          <div class="row"><button class="ui-btn primary" data-act="close">닫기</button></div>
        </div>`);
      const close = this.push(node);
      drawFullMap(q<HTMLCanvasElement>(node, 'canvas'), w);
      this.on(node, '[data-act="close"]', () => (close(), resolve()));
    });
  }

  // ---- 런 결과 --------------------------------------------------------------

  result(info: ResultInfo): Promise<void> {
    return new Promise((resolve) => {
      const run = info.run;
      const s = teamScore(run);
      const node = el(`
        <div class="overlay">
          <div class="panel wide">
            <h2>${escapeHtml(info.title)}</h2>
            <p>${escapeHtml(info.text)}</p>
            ${this.teamRow(run)}
            <div class="stats">
              <div><b>${run.cleared} / ${db.lastSector}</b><span>클리어한 섹터</span></div>
              <div><b>${fmtTime(run.time)}</b><span>조사 시간</span></div>
              <div><b>${run.kills}</b><span>처치</span></div>
            </div>
            <div class="result-cols">
            <div class="score ${info.saved ? '' : 'lost'}">
              <span>${info.saved ? '팀 점수' : '잃어버린 팀 점수'}</span><b>${s.total}</b>
              <small>스킬 성장 ${s.upgrades} · 장비 ${s.equipment} · 섹터 ${s.sectors} · 경로 ${s.routes} · 보스 ${s.boss}</small>
            </div>
            ${
              info.exchange && info.exchange.items.length
                ? `<div class="exchange">
                    <em class="lbl">들고 나온 귀중품</em>
                    <ul>${info.exchange.items.map((it) => `<li class="vt-${it.tier}"><span>${escapeHtml(it.name)}${it.taint ? ' <i>오염</i>' : ''}</span><b>${it.value}</b></li>`).join('')}</ul>
                    <div class="exchange-total"><span>은화</span><b>+${info.exchange.total}</b><small>보유 ${info.exchange.wallet}</small></div>
                  </div>`
                : info.lostValue
                  ? `<div class="exchange lost"><em class="lbl">잃어버린 귀중품</em><div class="exchange-total"><span>은화</span><b>-${info.lostValue}</b><small>가방째 잃었다</small></div></div>`
                  : ''
            }
            </div>
            <div class="row">
              ${info.saved ? '<button class="ui-btn" data-act="view">팀 보기</button>' : ''}
              <button class="ui-btn primary" data-act="ok">로비로</button>
            </div>
          </div>
        </div>`);
      const close = this.push(node);
      this.on(node, '[data-act="view"]', () => void this.team(run, null, null));
      this.on(node, '[data-act="ok"]', () => (close(), resolve()));
    });
  }
}
