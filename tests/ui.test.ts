// 화면(UI) 그림 검사: 모든 캐릭터와 펫에 그림이 있는지, 그림이 있으면 도형 대신 그림이 쓰이는지.
import { describe, expect, it } from 'vitest';
import { db } from '../src/data/tables';
import { asset } from '../src/ui/assets';
import { ICON, petSvg, portraitSvg } from '../src/ui/portraits';

describe('화면 그림', () => {
  it('모든 캐릭터에 초상화가 있고, 초상화가 그림으로 나온다', () => {
    for (const c of db.charList) {
      expect(asset(`portraits/${c.id}`), `${c.name}의 초상화`).toBeTruthy();
      expect(portraitSvg(c)).toContain('<img');
    }
  });

  it('모든 펫에 그림이 있다', () => {
    for (const p of db.petList) {
      expect(asset(`ui/pet_${p.id}`), `${p.name}의 그림`).toBeTruthy();
      expect(petSvg(p)).toContain('<img');
    }
  });

  it('버튼과 장비 부위 아이콘이 그림으로 나온다', () => {
    for (const key of ['attack', 'dodge', 'active', 'ult', 'interact', 'weapon', 'armor', 'acc'] as const) {
      expect(ICON[key], `${key} 아이콘`).toContain('<img');
    }
  });

  it('없는 그림은 null 을 돌려준다 (부르는 쪽에서 도형으로 대신한다)', () => {
    expect(asset('portraits/nobody')).toBeNull();
  });
});
