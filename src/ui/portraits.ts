// 캐릭터·펫 초상화와 버튼 아이콘.
// src/assets/ 에 그림이 있으면 그 그림을, 없으면 색 정보로 그린 도형(SVG)을 돌려준다.
import { numToHex, shade } from '../core/math';
import type { CharDef, PetDef } from '../data/types';
import { asset, assetImg } from './assets';

export function portraitSvg(def: CharDef): string {
  const c = def.colors;
  const art = asset(`portraits/${def.id}`);
  // 배경은 머리색을 어둡게 한 색으로 깔아 캐릭터마다 구분되게 한다
  if (art) return `<img class="art-img" src="${art}" alt="" draggable="false" style="background:radial-gradient(circle at 50% 35%, ${numToHex(shade(c.hair, -0.35))}, ${numToHex(shade(c.hair, -0.72))})">`;
  const hair = numToHex(c.hair);
  const hair2 = numToHex(c.hair2);
  const outfit = numToHex(c.outfit);
  const skin = numToHex(c.skin);
  const eye = numToHex(c.eye);
  const bg = numToHex(shade(c.hair, -0.62));

  let back = '';
  let deco = '';
  switch (def.hairStyle) {
    case 'long':
      back = `<rect x="9" y="9" width="46" height="62" rx="19" fill="${hair}"/>`;
      deco = `<path d="M22 6 L32 12 L22 17 Z M42 6 L32 12 L42 17 Z" fill="${outfit}"/>`;
      break;
    case 'bob':
      back = `<rect x="9" y="9" width="46" height="42" rx="19" fill="${hair}"/>`;
      deco = `<circle cx="52" cy="15" r="6.5" fill="${hair2}"/><rect x="48" y="20" width="8" height="3.5" fill="#22222a"/>`;
      break;
    case 'twintail':
      back = `<rect x="10" y="9" width="44" height="36" rx="18" fill="${hair}"/>
        <ellipse cx="9" cy="48" rx="6.5" ry="11" fill="${hair2}"/><ellipse cx="55" cy="48" rx="6.5" ry="11" fill="${hair2}"/>`;
      deco = `<path d="M31 11 L37 0 L37 11 Z" fill="${hair}"/>`;
      break;
    case 'pony':
      back = `<rect x="10" y="9" width="44" height="36" rx="18" fill="${hair}"/><ellipse cx="55" cy="40" rx="6" ry="18" fill="${hair2}"/>`;
      break;
    default:
      back = `<rect x="11" y="9" width="42" height="32" rx="17" fill="${hair}"/>`;
  }

  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="64" height="64" fill="${bg}"/>
    ${back}
    <path d="M10 66 Q32 42 54 66 Z" fill="${outfit}"/>
    <circle cx="32" cy="32" r="17" fill="${skin}"/>
    <path d="M13.5 31 Q13 10 32 10 Q51 10 50.5 31 Q46 22 40 27 Q36 20 32 27 Q28 20 24 27 Q18 22 13.5 31 Z" fill="${hair}"/>
    <ellipse cx="25" cy="34.5" rx="3.1" ry="4.1" fill="${eye}"/>
    <ellipse cx="39" cy="34.5" rx="3.1" ry="4.1" fill="${eye}"/>
    <circle cx="26.1" cy="33" r="1.2" fill="#fff"/>
    <circle cx="40.1" cy="33" r="1.2" fill="#fff"/>
    <ellipse cx="19.5" cy="40.5" rx="3.3" ry="1.7" fill="#ff93a4" opacity=".55"/>
    <ellipse cx="44.5" cy="40.5" rx="3.3" ry="1.7" fill="#ff93a4" opacity=".55"/>
    <path d="M29.5 42.5 Q32 44.6 34.5 42.5" stroke="#b9736b" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    ${deco}
  </svg>`;
}

export function petSvg(def: PetDef): string {
  const art = asset(`ui/pet_${def.id}`);
  if (art) return `<img class="art-img pet-img" src="${art}" alt="" draggable="false" style="background:radial-gradient(circle at 50% 40%, ${numToHex(shade(def.color, -0.4))}, ${numToHex(shade(def.color, -0.75))})">`;
  const body = numToHex(def.color);
  const dark = numToHex(shade(def.color, -0.35));
  const light = numToHex(shade(def.color, 0.35));
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M16 20 L10 4 L27 14 Z M48 20 L54 4 L37 14 Z" fill="${dark}"/>
    <rect x="12" y="12" width="40" height="46" rx="19" fill="${body}"/>
    <rect x="12" y="36" width="40" height="22" rx="11" fill="${light}"/>
    <circle cx="25" cy="30" r="2.6" fill="#15131f"/><circle cx="39" cy="30" r="2.6" fill="#15131f"/>
    <path d="M28 36 Q32 39 36 36" stroke="#15131f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  </svg>`;
}

/** 버튼 아이콘의 도형 판 (currentColor로 칠해진다). 그림이 없을 때 쓴다 */
const ICON_SVG = {
  interact:
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 2.5a1.6 1.6 0 0 1 1.6 1.6v6.2l.8-.2V5.6a1.6 1.6 0 0 1 3.2 0v4.2l.8-.1V7.1a1.5 1.5 0 0 1 3 0v3.3l.6-.1a1.5 1.5 0 0 1 1.7 1.5v3.9c0 3.5-2.6 6.3-6.3 6.3h-1.900c-2.200 0-3.800-.9-5-2.700L3.700 14.100a1.600 1.600 0 0 1 2.600-1.800l1.100 1.400V4.100A1.600 1.600 0 0 1 9 2.500z"/></svg>',
  attack: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 2 L22 4.5 L10.5 16 L8 16 L8 13.5 Z M7 14.5 L9.5 17 L6.5 20 L5.3 18.8 L3.5 20.5 L2 19 L3.7 17.2 L2.5 16 L5.5 13 Z" fill="currentColor"/></svg>`,
  dodge: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 4 L21 12 L13 20 L13 15 L8 15 L8 9 L13 9 Z M3 9 L6 9 L6 15 L3 15 Z" fill="currentColor"/></svg>`,
  active: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 L5 13.5 L11 13.5 L10 22 L19 9.5 L13 9.5 Z" fill="currentColor"/></svg>`,
  ult: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5 L14.8 8.6 L22.5 9 L16.5 13.9 L18.5 21.3 L12 17.1 L5.5 21.3 L7.5 13.9 L1.5 9 L9.2 8.6 Z" fill="currentColor"/></svg>`,
};

/** 버튼·장비 아이콘. 그림(src/assets/ui/icon_*.webp)이 있으면 그림을 쓴다 */
export const ICON = {
  interact: assetImg('ui/icon_interact', ICON_SVG.interact, 'icon-img'),
  attack: assetImg('ui/icon_attack', ICON_SVG.attack, 'icon-img'),
  dodge: assetImg('ui/icon_dodge', ICON_SVG.dodge, 'icon-img'),
  active: assetImg('ui/icon_active', ICON_SVG.active, 'icon-img'),
  ult: assetImg('ui/icon_ult', ICON_SVG.ult, 'icon-img'),
  weapon: assetImg('ui/icon_weapon', '', 'icon-img'),
  armor: assetImg('ui/icon_armor', '', 'icon-img'),
  // 장비 부위 이름(Slot)과 같은 키를 쓴다
  acc: assetImg('ui/icon_accessory', '', 'icon-img'),
  shard: assetImg('ui/icon_shard', '', 'icon-img'),
};
