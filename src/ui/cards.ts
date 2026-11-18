// 스킬 성장·장비·캐릭터를 보여 주는 카드 조각 (보상 선택, 상점, 팀 정보에서 함께 쓴다)
import { db } from '../data/tables';
import { ATTR_LABEL, POS_LABEL, SLOT_LABEL, type CharDef, type Position, type UpgradeDef } from '../data/types';
import { equipName, equipSkillText, optionText } from '../game/run/equipment';
import type { EquipItem, RunState } from '../game/run/RunState';
import { escapeHtml } from './dom';
import { ICON, portraitSvg } from './portraits';

const TIER_NAME = ['', '일반', '희귀', '영웅'];

export function upgradeOwnerText(u: UpgradeDef): string {
  if (u.category === 'unique') return `고유 · ${db.char(u.owner).name}`;
  if (u.category === 'pet') return '펫 스킬';
  return u.owner === 'team' ? '시즌 · 팀' : `시즌 · ${POS_LABEL[u.owner as Position]}`;
}

/** 스킬 성장 카드의 안쪽 내용 */
export function upgradeCard(run: RunState, id: string): string {
  const u = db.upgrade(id);
  const lv = run.lv(id);
  const portrait = u.category === 'unique' ? `<i class="card-face">${portraitSvg(db.char(u.owner))}</i>` : '';
  return `
    <span class="card-kind">${portrait}${escapeHtml(upgradeOwnerText(u))}<em>${TIER_NAME[u.tier]}</em></span>
    <span class="card-plan">${escapeHtml(u.plan)}</span>
    <b class="card-name">${escapeHtml(u.name)}</b>
    <span class="card-lv">Lv ${lv} → <b>${Math.min(u.max, lv + 1)}</b> <small>/ ${u.max}</small></span>
    <span class="card-desc">${escapeHtml(db.upgradeDesc(id))}</span>`;
}

/** 장비 카드의 안쪽 내용 */
export function equipCard(item: EquipItem): string {
  const r = db.rarity(item.rarity);
  return `
    <span class="card-kind">${ICON[item.slot] ? `<i class="card-slot">${ICON[item.slot]}</i>` : ''}${SLOT_LABEL[item.slot]} 장비<em>${r.name}</em></span>
    <span class="card-plan">장비 스킬 Lv ${item.rarity}</span>
    <b class="card-name">${escapeHtml(equipName(item))}</b>
    <span class="card-desc">${escapeHtml(equipSkillText(item))}</span>
    <span class="card-opts">${item.opts.map((o) => `<i>${escapeHtml(optionText(o.stat, o.v, item.slot))}</i>`).join('')}</span>`;
}

export function upgradeCardClass(id: string): string {
  return `card tier-${db.upgrade(id).tier}`;
}

export function equipCardAttrs(item: EquipItem): string {
  return `class="card equip" style="--rc:${db.rarity(item.rarity).color}"`;
}

/** 장비 한 줄 요약 (팀 정보, 장착 대상 선택) */
export function equipLine(item: EquipItem | undefined, slot: string): string {
  if (!item) return `<span class="eq-line empty"><em>${slot}</em>비어 있음</span>`;
  const r = db.rarity(item.rarity);
  return `<span class="eq-line" style="--rc:${r.color}" title="${escapeHtml(equipSkillText(item))}">
    <em>${slot}</em><b>${escapeHtml(equipName(item))}</b><small>${r.name}</small></span>`;
}

export function charTags(c: CharDef): string {
  return `${c.grade}급 · ${POS_LABEL[c.position]} · ${ATTR_LABEL[c.attr]}`;
}
