// 전투에 등장하는 것들의 공통 자료형.
// 규칙 코드(game/)는 화면을 직접 그리지 않는다. 상태만 바꾸고, 표시부(render/)가 그 상태를 읽어 그린다.
// 그래서 플레이스홀더 도형을 나중에 스프라이트로 바꿔도 이 폴더의 코드는 그대로 쓴다.
import type { Enemy } from './enemy/Enemy';
import type { Member } from './player/Member';

/** 캐릭터 애니메이션 상태 (기획서 5.4절). 스프라이트 시트도 이 이름으로 묶는다. */
export type CharAnim =
  | 'Idle'
  | 'Move'
  | 'Hit'
  | 'Stun'
  | 'Death'
  | 'Tag'
  | 'BasicAttack'
  | 'ActiveSkill'
  | 'Ultimate'
  | 'Escape';

/** 몬스터 애니메이션 상태 (기획서 8.4절) */
export type MonsterAnim = 'Idle' | 'Move' | 'Hit' | 'Stun' | 'Death' | 'MonsterAttack' | 'Pattern';

export type DmgKind = 'basic' | 'active' | 'ult' | 'pet' | 'equip' | 'proc';
export type Team = 'party' | 'enemy';

/** 적에게 주는 한 번의 타격 */
export interface HitSpec {
  /** 공격한 캐릭터. null이면 펫처럼 팀 평균 공격력을 쓴다 */
  m: Member | null;
  /** 공격력 대비 배율 (1 = 100%) */
  mult: number;
  kind: DmgKind;
  /** 넉백 세기 */
  knock?: number;
  /** 기절 시간(초) */
  stun?: number;
  noCrit?: boolean;
  /** 원형 범위 타격(areaHit)에서도 근접 기본 공격처럼 가까운 적부터 피해를 줄여 나갈지 */
  cleave?: boolean;
  onHit?: (e: Enemy, dmg: number) => void;
}

export interface Projectile {
  id: number;
  team: Team;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** 남은 비행 거리(px) */
  left: number;
  /** 표시 종류: bullet / arrow / wave / orb / bigarrow ... */
  look: string;
  color: number;
  /** 아군 투사체의 타격 정보 */
  hit?: HitSpec;
  /** 적 투사체의 피해량 */
  dmg?: number;
  owner?: Enemy | null;
  /** 남은 관통 횟수. -1이면 무한 */
  pierce: number;
  /** 남은 튕김 횟수 (적중 후 가까운 다른 적으로) */
  bounce: number;
  /** 유도 회전 속도(rad/초). 0이면 직진 */
  homing: number;
  target?: Enemy | null;
  /** 적중 지점 주변 폭발 */
  splash?: { r: number; mult: number };
  /** 벽에 막히는지 */
  wall: boolean;
  seen: Set<number>;
  onHitEnemy?: (e: Enemy) => void;
  dead: boolean;
  view?: unknown;
}

/** 일정 시간 유지되는 범위 효과. 적의 공격 예고(tele)도 여기에 속한다. */
export interface Zone {
  id: number;
  /** 표시 종류: tele / teleLine / heal / slow / rain / storm / ward ... */
  look: string;
  team: Team;
  x: number;
  y: number;
  r: number;
  /** 선형 범위일 때의 끝점과 반폭 */
  x2?: number;
  y2?: number;
  half?: number;
  t: number;
  dur: number;
  color: number;
  /** 예고를 건 몬스터. 죽거나 기절하면 예고가 취소된다 */
  owner?: Enemy | null;
  /** true면 매 프레임 파티 위치를 따라간다 */
  follow?: boolean;
  tick?: number;
  tickT: number;
  onTick?: (z: Zone) => void;
  onEnd?: (z: Zone) => void;
  dead: boolean;
  view?: unknown;
}

/** 방벽: 적 투사체를 막고 적의 진로를 방해한다 */
export interface Barrier {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  half: number;
  t: number;
  dur: number;
  dead: boolean;
  view?: unknown;
}

export type ThingKind = 'exit' | 'chest' | 'crate' | 'medkit' | 'relic' | 'sealed' | 'npc' | 'stash';

/** 다가가면 반응하는 것 (출구, 보상 상자, 수색 오브젝트, NPC) */
export interface Thing {
  id: number;
  kind: ThingKind;
  x: number;
  y: number;
  /** 반응 거리 */
  r: number;
  /** 수색 진행도 0~1 */
  progress: number;
  /** 상호작용 버튼을 눌러 수색을 시작했는지. 범위를 벗어나면 풀린다 */
  searching?: boolean;
  locked: boolean;
  done: boolean;
  /** 보상 품질 등 종류별 부가 값 */
  quality: number;
  data?: unknown;
  view?: unknown;
}

export interface Pack {
  id: number;
  x: number;
  y: number;
  gate: boolean;
  /** 보상 품질 (1 일반, 2 희귀 이상, 3 영웅 이상) */
  quality: number;
  members: Enemy[];
  alive: number;
  aggro: boolean;
  cleared: boolean;
}

export type NumKind = 'dmg' | 'crit' | 'weak' | 'heal' | 'hurt' | 'shard';

/** 규칙 코드가 표시부에 요청하는 일회성 이펙트 */
export interface FxApi {
  /** 근접 베기 궤적 */
  slash(x: number, y: number, angle: number, reach: number, arc: number, color: number, heavy?: boolean): void;
  /** 퍼지는 고리 */
  ring(x: number, y: number, r: number, color: number, dur?: number): void;
  /** 채워진 폭발 */
  blast(x: number, y: number, r: number, color: number, dur?: number): void;
  sparks(x: number, y: number, color: number, count?: number): void;
  /** 두 점을 잇는 번개 */
  bolt(x1: number, y1: number, x2: number, y2: number, color: number): void;
  /** 하늘에서 떨어지는 낙뢰·화살 */
  strike(x: number, y: number, color: number): void;
  number(x: number, y: number, value: number, kind: NumKind): void;
  label(x: number, y: number, text: string, color: number): void;
  shake(power: number): void;
}

export const nullFx: FxApi = {
  slash() {},
  ring() {},
  blast() {},
  sparks() {},
  bolt() {},
  strike() {},
  number() {},
  label() {},
  shake() {},
};
