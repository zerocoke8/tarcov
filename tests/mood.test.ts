// 화면 분위기 검사 (기획서 7.15절): 맵 그림 세트마다 화면을 어둡게 물들이는 수치와, 전체 세기를 반영하는 계산.
// 셰이더 자체는 브라우저에서만 돌므로 여기서는 셰이더에 넘기는 값만 본다 (화면은 tools/smoke.mjs 가 확인한다).
import { describe, expect, it } from 'vitest';
import { db } from '../src/data/tables';
import { moodLook } from '../src/render/mood';

/** 게임에서 쓰는 맵 그림 세트 전부 (시즌의 섹터와 도전 모드의 전투장) */
const scenes = [...new Set([...db.allSectors.map((s) => s.scene), ...db.challenges.map((c) => c.scene).filter(Boolean)])];

describe('화면 분위기', () => {
  it('게임에서 쓰는 모든 맵 그림 세트에 분위기가 정해져 있다', () => {
    for (const scene of scenes) expect(db.mood(scene), scene).not.toBeNull();
    expect(db.mood('없는 세트')).toBeNull();
  });

  it('어둡게 하되, 먼 곳의 몬스터와 공격 예고가 보일 만큼은 남긴다', () => {
    for (const scene of scenes) {
      const m = db.mood(scene)!;
      // 먼 곳은 캐릭터 둘레보다 어둡다
      expect(m.dark, scene).toBeLessThan(m.lit);
      expect(m.dark, scene).toBeGreaterThanOrEqual(0.4);
      expect(m.sat, scene).toBeGreaterThanOrEqual(0.5);
      expect(m.sat, scene).toBeLessThanOrEqual(1);
      // 빛은 화면 한가운데의 전투 범위를 덮는다 (화면 세로의 1/4 이상)
      expect(m.inner, scene).toBeGreaterThanOrEqual(0.25);
      expect(m.outer, scene).toBeGreaterThan(m.inner);
      expect(m.vignette, scene).toBeLessThanOrEqual(0.6);
    }
  });

  it('시즌 2의 맵은 시즌 1의 골목보다 더 많이 물들인다 (원래 밝고 발랄한 그림이어서)', () => {
    const alley = db.mood('alley')!;
    for (const scene of ['oz_field', 'oz_forest', 'oz_stage']) {
      expect(db.mood(scene)!.dark, scene).toBeLessThan(alley.dark);
      expect(db.mood(scene)!.sat, scene).toBeLessThan(alley.sat);
    }
  });

  it('전체 세기: 0이면 끄고, 100%면 표 그대로, 그 사이는 고르게 섞는다', () => {
    const def = db.mood('oz_field')!;
    expect(moodLook(def, 0)).toBeNull();
    expect(moodLook(null, 1)).toBeNull();
    const full = moodLook(def, 1)!;
    expect(full.sat).toBeCloseTo(def.sat);
    expect(full.dark).toBeCloseTo(def.dark);
    expect(full.vignette).toBeCloseTo(def.vignette);
    expect(full.tint[2]).toBeCloseTo((def.tint & 0xff) / 255);
    const half = moodLook(def, 0.5)!;
    expect(half.dark).toBeCloseTo((1 + def.dark) / 2);
    expect(half.sat).toBeCloseTo((1 + def.sat) / 2);
    expect(half.vignette).toBeCloseTo(def.vignette / 2);
    // 색은 흰색(물들이지 않음)과 섞인다
    expect(half.tint[0]).toBeCloseTo((1 + ((def.tint >> 16) & 0xff) / 255) / 2);
  });

  it('세기를 올려도 화면이 까맣게 되지는 않는다', () => {
    const look = moodLook(db.mood('oz_forest')!, 9)!;
    expect(look.dark).toBeGreaterThanOrEqual(0.2);
    expect(look.sat).toBeGreaterThanOrEqual(0);
    expect(look.vignette).toBeLessThanOrEqual(1);
    for (const c of [...look.tint, ...look.warm]) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });

  it('지금의 세기는 켜져 있다', () => {
    expect(db.P('mood.strength')).toBeGreaterThan(0);
  });
});
