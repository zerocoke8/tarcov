// 스프라이트 애니메이션 선택 규칙: 어떤 동작(클립)을, 어느 방향 그림으로, 몇 번째 프레임을 보여 줄지.
// PixiJS를 쓰지 않는 순수 계산이라 화면 없이 검사할 수 있다 (tests/sprites.test.ts).

/** 스프라이트 방향 이름. 화면 기준 (S = 아래쪽 = 카메라를 향함) */
export type Dir8 = 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE';

/** 프레임 1장: [시트 번호, x, y, w, h, 기준점 x, 기준점 y]. 기준점(발밑)은 프레임 왼쪽 위에서 잰 값이며 프레임 밖일 수 있다 */
export type FrameData = [page: number, x: number, y: number, w: number, h: number, ax: number, ay: number];

export interface ClipData {
  /** 반복 재생 여부. false면 한 번 재생하고 마지막 프레임에 머문다 */
  loop: boolean;
  /** 초당 프레임 수. 반복 동작의 재생 속도. 단발 동작은 길이가 정해지지 않았을 때만 쓴다 */
  fps: number;
  /** 단발 동작에서 타격이 들어가는 지점 (0~1). 규칙 쪽 타격 시점과 맞춘다 */
  impact?: number;
  /** 방향별 프레임 목록 */
  dirs: Partial<Record<Dir8, FrameData[]>>;
}

/** public/sprites/<id>/sheet.json 의 내용 (tools/art 가 만든다) */
export interface SheetData {
  version: 1;
  id: string;
  kind: 'char' | 'monster';
  /** 시트 1픽셀이 월드에서 차지하는 크기 */
  scale: number;
  /** 서 있을 때의 키 (월드 px). 머리 위 체력 바 위치에 쓴다 */
  height: number;
  /** 시트 이미지 파일 이름 */
  pages: string[];
  /** 오른쪽을 보는 그림을 뒤집어 왼쪽 방향으로 쓸지 */
  mirror: boolean;
  clips: Record<string, ClipData>;
}

const DEG = Math.PI / 180;
export const DIR_ANGLE: Record<Dir8, number> = {
  E: 0,
  SE: 45 * DEG,
  S: 90 * DEG,
  SW: 135 * DEG,
  W: 180 * DEG,
  NW: -135 * DEG,
  N: -90 * DEG,
  NE: -45 * DEG,
};
const MIRROR: Record<Dir8, Dir8> = { E: 'W', SE: 'SW', S: 'S', SW: 'SE', W: 'E', NW: 'NE', N: 'N', NE: 'NW' };

const angDist = (a: number, b: number): number => {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
};

export interface DirChoice {
  /** 사용할 그림의 방향 */
  dir: Dir8;
  /** 좌우로 뒤집어 그릴지 */
  flip: boolean;
}

/** 방향이 경계에서 떨리지 않도록, 지금 쓰는 방향보다 이만큼(rad) 이상 더 가까워야 바꾼다 */
const STICKY = 0.2;
/**
 * 앞모습(얼굴이 보이는 아래쪽 방향)을 이만큼(rad) 더 가깝게 쳐 준다.
 * 2방향 그림에서 정확히 옆(좌우)을 볼 때 앞모습과 뒷모습이 같은 거리가 되는데, 그때 앞모습을 쓰기 위한 값이다.
 */
const FRONT = 0.3;

/**
 * 바라보는 각도(rad, 0 = 오른쪽, PI/2 = 아래)에 가장 가까운 방향 그림을 고른다.
 * 그림이 없는 방향은 좌우 반전(mirror)으로 채운다. 2방향(SE, NE)만 있어도 4방향처럼 보인다.
 */
export function pickDir(available: readonly Dir8[], mirror: boolean, facing: number, current?: DirChoice | null): DirChoice {
  let best: DirChoice | null = null;
  let bestD = Infinity;
  let curD = Infinity;
  for (const dir of available) {
    const options: [DirChoice, number][] = [[{ dir, flip: false }, DIR_ANGLE[dir]]];
    const m = MIRROR[dir];
    if (mirror && m !== dir && !available.includes(m)) options.push([{ dir, flip: true }, DIR_ANGLE[m]]);
    for (const [choice, angle] of options) {
      const d = angDist(facing, angle) - (Math.sin(angle) > 0.01 ? FRONT : 0);
      if (current && current.dir === choice.dir && current.flip === choice.flip) curD = d;
      if (d < bestD - 1e-9) {
        bestD = d;
        best = choice;
      }
    }
  }
  if (!best) throw new Error('스프라이트에 방향 그림이 하나도 없습니다');
  if (current && curD <= bestD + STICKY) return current;
  return best;
}

/** 동작 그림이 아직 없을 때 대신 쓸 동작. 앞에서부터 있는 것을 쓴다 */
const FALLBACK: Record<string, string[]> = {
  Idle: [],
  Move: ['Idle'],
  Hit: ['Idle'],
  Stun: ['Hit', 'Idle'],
  Death: ['Hit', 'Idle'],
  Tag: ['Idle'],
  BasicAttack: ['Idle'],
  ActiveSkill: ['BasicAttack', 'Idle'],
  Ultimate: ['ActiveSkill', 'BasicAttack', 'Idle'],
  Escape: ['Move', 'Idle'],
  MonsterAttack: ['Idle'],
  Pattern: ['MonsterAttack', 'Idle'],
};

/**
 * 애니메이션 상태에 쓸 클립 이름을 정한다.
 * 기본 공격은 연속기 단계별 그림(BasicAttack1, BasicAttack2 …)이 있으면 그것을 돌려 쓴다.
 * 맞는 그림이 없으면 null (호출한 쪽에서 그리지 않는다).
 */
export function resolveClip(clips: Record<string, unknown>, anim: string, combo = 0): string | null {
  if (anim === 'BasicAttack') {
    let steps = 0;
    while (clips[`BasicAttack${steps + 1}`]) steps++;
    if (steps > 0) return `BasicAttack${(((combo % steps) + steps) % steps) + 1}`;
  }
  if (clips[anim]) return anim;
  for (const name of FALLBACK[anim] ?? ['Idle']) if (clips[name]) return name;
  return clips.Idle ? 'Idle' : null;
}

/**
 * 지금 보여 줄 프레임 번호.
 * - 반복 동작: 시간에 따라 fps로 돈다.
 * - 단발 동작: 규칙이 정한 길이(dur)에 맞춰 늘이거나 줄인다. 타격 시점(hitAt)을 알면 타격 프레임을 그 시점에 맞춘다.
 *   길이를 모르면 fps로 한 번 재생하고 마지막 프레임에 머문다.
 */
export function frameAt(clip: { loop: boolean; fps: number; impact?: number }, count: number, t: number, dur = 0, hitAt = 0): number {
  if (count <= 1) return 0;
  if (clip.loop) return Math.floor(Math.max(0, t) * clip.fps) % count;
  let k: number;
  if (dur > 0) {
    k = Math.min(1, Math.max(0, t / dur));
    const impact = clip.impact ?? 0;
    const kh = hitAt / dur;
    if (impact > 0 && impact < 1 && kh > 0 && kh < 1) {
      k = k < kh ? (k / kh) * impact : impact + ((k - kh) / (1 - kh)) * (1 - impact);
    }
  } else {
    k = Math.min(1, (Math.max(0, t) * clip.fps) / count);
  }
  return Math.min(count - 1, Math.floor(k * count));
}
