// 캐릭터·몬스터 표시부의 규격.
// 지금은 도형 플레이스홀더(Placeholder*)가 이 규격을 구현한다. 스프라이트 애니메이션이 준비되면
// 같은 규격의 스프라이트 구현을 만들어 registry.ts에서 바꿔 끼우면 된다. 규칙 코드는 건드리지 않는다.
import type { Container } from 'pixi.js';
import type { CharDef } from '../../data/types';
import type { Enemy } from '../../game/enemy/Enemy';
import type { CharAnim } from '../../game/entities';

/** 표시부가 캐릭터를 그리는 데 필요한 정보 */
export interface CharPose {
  /** 애니메이션 상태 (기획서 5.4절의 이름) */
  anim: CharAnim;
  /** 그 상태가 시작된 뒤 지난 시간(초) */
  t: number;
  /** 그 상태의 전체 길이(초). 정해진 길이가 없으면 0 */
  dur: number;
  /** 그 상태에서 첫 타격이 나가는 시점(초). 없으면 0. 스프라이트의 타격 프레임을 여기에 맞춘다 */
  hitAt: number;
  /** 바라보는(조준하는) 방향(rad). 0 = 오른쪽, PI/2 = 아래 */
  facing: number;
  /** 지금 치고 있는 기본 공격이 연속기의 몇 번째 타격인지 (0부터) */
  combo: number;
  /** 피격 연출 남은 시간 (0보다 크면 Hit) */
  hitFlash: number;
  invuln: boolean;
}

export interface CharView {
  /** 발밑이 원점인 표시 객체 */
  readonly root: Container;
  /** 지금 그림이 보는 쪽 (1 = 오른쪽, -1 = 왼쪽). 무기 끝의 위치를 구할 때 쓴다 */
  readonly side: number;
  update(pose: CharPose, dt: number): void;
  /** 몸을 바닥에서 이만큼 띄운다 (px). 그림자는 바닥에 남는다. 위에서 떨어지며 등장할 때 쓴다 */
  setLift(h: number): void;
  destroy(): void;
}

export interface EnemyView {
  readonly root: Container;
  update(e: Enemy, dt: number): void;
  destroy(): void;
}

export type CharViewFactory = (def: CharDef) => CharView;
export type EnemyViewFactory = (e: Enemy) => EnemyView;
