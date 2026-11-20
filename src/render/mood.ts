// 화면 분위기: 맵 그림 세트마다 화면을 얼마나 어둡고 빛바래게 물들일지 정한다 (data/moods.csv).
// 여기에는 수치만 있다 (그리는 쪽은 moodFilter.ts). 화면 없이 검사할 수 있게 그리기 라이브러리를 쓰지 않는다.
import { clamp } from '../core/math';
import type { MoodDef } from '../data/types';

/** 셰이더에 넘기는 값. 색은 0~1의 [빨강, 초록, 파랑] */
export interface MoodLook {
  sat: number;
  dark: number;
  lit: number;
  tint: [number, number, number];
  warm: [number, number, number];
  inner: number;
  outer: number;
  vignette: number;
  keep: number;
}

function rgb(color: number, k: number): [number, number, number] {
  // 세기가 약할수록 흰색(물들이지 않음)에 가깝다
  const ch = (shift: number): number => 1 + (((color >> shift) & 0xff) / 255 - 1) * k;
  return [ch(16), ch(8), ch(0)];
}

/**
 * 표의 분위기에 전체 세기를 반영한다.
 * @param strength 0이면 끈다(null), 1이면 표에 적힌 그대로. 그 사이는 "물들이지 않은 화면"과 고르게 섞는다
 */
export function moodLook(def: MoodDef | null, strength: number): MoodLook | null {
  const k = clamp(strength, 0, 1.5);
  if (!def || k <= 0) return null;
  const toward = (v: number): number => 1 + (v - 1) * k;
  return {
    sat: Math.max(0, toward(def.sat)),
    // 아무리 세게 걸어도 먼 곳의 몬스터와 공격 예고가 보일 만큼은 남긴다
    dark: clamp(toward(def.dark), 0.2, 1),
    lit: clamp(toward(def.lit), 0.2, 1.2),
    tint: rgb(def.tint, Math.min(1, k)),
    warm: rgb(def.warm, Math.min(1, k)),
    inner: def.inner,
    outer: def.outer,
    vignette: clamp(def.vignette * k, 0, 1),
    keep: clamp(def.keep, 0, 1),
  };
}
