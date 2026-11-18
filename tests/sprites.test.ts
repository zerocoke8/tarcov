// 스프라이트 재생 규칙 검사: 방향 고르기, 없는 동작 대신하기, 프레임 번호 계산.
// 그리고 public/sprites/ 에 등록된 시트가 게임이 읽을 수 있는 형태인지 확인한다.
import { describe, expect, it } from 'vitest';
import { DIR_ANGLE, frameAt, pickDir, resolveClip, type Dir8, type SheetData } from '../src/render/sprites/select';

const deg = (d: number): number => (d * Math.PI) / 180;

describe('방향 고르기', () => {
  it('2방향(SE, NE) + 좌우 반전으로 4방향을 표현한다', () => {
    const dirs: Dir8[] = ['SE', 'NE'];
    expect(pickDir(dirs, true, deg(45))).toEqual({ dir: 'SE', flip: false });
    expect(pickDir(dirs, true, deg(135))).toEqual({ dir: 'SE', flip: true });
    expect(pickDir(dirs, true, deg(-45))).toEqual({ dir: 'NE', flip: false });
    expect(pickDir(dirs, true, deg(-135))).toEqual({ dir: 'NE', flip: true });
  });

  it('정확히 옆을 볼 때는 뒷모습보다 앞모습을 쓴다', () => {
    const dirs: Dir8[] = ['NE', 'SE'];
    expect(pickDir(dirs, true, deg(0))).toEqual({ dir: 'SE', flip: false });
    expect(pickDir(dirs, true, deg(180))).toEqual({ dir: 'SE', flip: true });
    // 위쪽을 보다가 옆으로 돌아도 앞모습으로 돌아온다
    expect(pickDir(dirs, true, deg(0), { dir: 'NE', flip: false })).toEqual({ dir: 'SE', flip: false });
    expect(pickDir(dirs, true, deg(180), { dir: 'NE', flip: true })).toEqual({ dir: 'SE', flip: true });
    // 위쪽 사선은 뒷모습
    expect(pickDir(dirs, true, deg(-45), { dir: 'SE', flip: false })).toEqual({ dir: 'NE', flip: false });
  });

  it('8방향 그림이 다 있으면 반전하지 않는다', () => {
    const dirs = Object.keys(DIR_ANGLE) as Dir8[];
    for (const d of dirs) expect(pickDir(dirs, true, DIR_ANGLE[d])).toEqual({ dir: d, flip: false });
  });

  it('반전을 끄면 있는 그림 중 가장 가까운 것을 쓴다', () => {
    expect(pickDir(['SE', 'NE'], false, deg(180))).toMatchObject({ flip: false });
  });

  it('경계에서 방향이 떨리지 않는다 (지금 방향을 유지)', () => {
    const dirs: Dir8[] = ['SE', 'NE'];
    // 정확히 오른쪽(0도)은 SE와 NE의 한가운데
    const cur = pickDir(dirs, true, deg(20));
    expect(cur.dir).toBe('SE');
    expect(pickDir(dirs, true, deg(-5), cur)).toBe(cur);
    expect(pickDir(dirs, true, deg(-30), cur)).toEqual({ dir: 'NE', flip: false });
    // 아래(90도)는 SE와 뒤집은 SE의 한가운데
    expect(pickDir(dirs, true, deg(95), cur)).toBe(cur);
  });
});

describe('동작 고르기', () => {
  it('그림이 있는 동작은 그대로 쓴다', () => {
    expect(resolveClip({ Idle: 1, Move: 1 }, 'Move')).toBe('Move');
  });

  it('없는 동작은 가까운 동작으로 대신한다', () => {
    expect(resolveClip({ Idle: 1 }, 'Move')).toBe('Idle');
    expect(resolveClip({ Idle: 1, Move: 1 }, 'Escape')).toBe('Move');
    expect(resolveClip({ Idle: 1, BasicAttack: 1 }, 'Ultimate')).toBe('BasicAttack');
    expect(resolveClip({ Idle: 1, MonsterAttack: 1 }, 'Pattern')).toBe('MonsterAttack');
    expect(resolveClip({ Idle: 1, Hit: 1 }, 'Death')).toBe('Hit');
    expect(resolveClip({}, 'Idle')).toBeNull();
  });

  it('기본 공격은 연속기 단계별 그림을 돌려 쓴다', () => {
    const clips = { Idle: 1, BasicAttack1: 1, BasicAttack2: 1, BasicAttack3: 1 };
    expect([0, 1, 2, 3, 4].map((c) => resolveClip(clips, 'BasicAttack', c))).toEqual([
      'BasicAttack1',
      'BasicAttack2',
      'BasicAttack3',
      'BasicAttack1',
      'BasicAttack2',
    ]);
    expect(resolveClip({ Idle: 1, BasicAttack: 1 }, 'BasicAttack', 2)).toBe('BasicAttack');
  });
});

describe('프레임 번호', () => {
  it('반복 동작은 fps로 돈다', () => {
    const clip = { loop: true, fps: 10 };
    expect(frameAt(clip, 8, 0)).toBe(0);
    expect(frameAt(clip, 8, 0.35)).toBe(3);
    expect(frameAt(clip, 8, 0.85)).toBe(0);
  });

  it('단발 동작은 규칙이 정한 길이에 맞춰 늘어나고 마지막 프레임에 머문다', () => {
    const clip = { loop: false, fps: 12 };
    expect(frameAt(clip, 6, 0, 0.6)).toBe(0);
    expect(frameAt(clip, 6, 0.3, 0.6)).toBe(3);
    expect(frameAt(clip, 6, 0.6, 0.6)).toBe(5);
    expect(frameAt(clip, 6, 9, 0.6)).toBe(5);
  });

  it('타격 프레임을 규칙의 타격 시점에 맞춘다', () => {
    // 10장 가운데 타격은 5번째(0.5), 규칙상 타격은 0.8초 동작의 0.2초
    const clip = { loop: false, fps: 12, impact: 0.5 };
    expect(frameAt(clip, 10, 0.1, 0.8, 0.2)).toBe(2);
    expect(frameAt(clip, 10, 0.2, 0.8, 0.2)).toBe(5);
    expect(frameAt(clip, 10, 0.5, 0.8, 0.2)).toBe(7);
    // 타격 시점을 모르면 고르게 재생한다
    expect(frameAt(clip, 10, 0.2, 0.8, 0)).toBe(2);
  });

  it('프레임별 시점이 있으면 원래 동작의 빠르기대로 넘긴다', () => {
    // 휘두르는 순간(0.4~0.5)에 프레임이 몰려 있는 6장짜리 동작
    const clip = { loop: false, fps: 20 };
    const times = [0, 0.4, 0.44, 0.48, 0.52, 1];
    const at = (k: number): number => frameAt(clip, 6, k, 1, 0, times);
    expect(at(0)).toBe(0);
    expect(at(0.19)).toBe(0);
    expect(at(0.21)).toBe(1);
    expect(at(0.43)).toBe(2);
    expect(at(0.47)).toBe(3);
    expect(at(0.51)).toBe(4);
    expect(at(0.75)).toBe(4);
    expect(at(0.77)).toBe(5);
    expect(at(1)).toBe(5);
    // 타격 지점(0.46)을 규칙의 타격 시점(전체의 20%)에 맞추면, 휘두르는 프레임이 그 시점 앞뒤에 온다
    const hit = { loop: false, fps: 20, impact: 0.46 };
    expect(frameAt(hit, 6, 0.2, 1, 0.2, times)).toBe(3);
    expect(frameAt(hit, 6, 0.1, 1, 0.2, times)).toBe(1);
  });

  it('길이를 모르는 단발 동작은 fps로 한 번 재생한다', () => {
    const clip = { loop: false, fps: 10 };
    expect(frameAt(clip, 5, 0.25)).toBe(2);
    expect(frameAt(clip, 5, 3)).toBe(4);
  });
});

describe('등록된 스프라이트 시트', () => {
  const sheets = import.meta.glob<SheetData>('/public/sprites/*/sheet.json', { eager: true, import: 'default' });
  const index = Object.values(import.meta.glob<Record<string, { kind: string; v: string }>>('/public/sprites/index.json', { eager: true, import: 'default' }))[0] ?? {};

  it('index.json 과 시트 폴더가 일치한다', () => {
    const ids = Object.keys(sheets).map((p) => p.split('/').at(-2));
    expect(ids.sort()).toEqual(Object.keys(index).sort());
  });

  for (const [path, sheet] of Object.entries(sheets)) {
    it(`${sheet.id}: 게임이 읽을 수 있는 형태다`, () => {
      expect(path).toContain(`/${sheet.id}/`);
      expect(sheet.version).toBe(1);
      expect(sheet.scale).toBeGreaterThan(0);
      expect(sheet.height).toBeGreaterThan(0);
      expect(sheet.clips.Idle, 'Idle 동작은 반드시 있어야 한다').toBeTruthy();
      for (const [name, clip] of Object.entries(sheet.clips)) {
        expect(clip.fps, name).toBeGreaterThan(0);
        const dirs = Object.entries(clip.dirs);
        expect(dirs.length, `${name}: 방향`).toBeGreaterThan(0);
        for (const [d, frames] of dirs) {
          expect(DIR_ANGLE[d as Dir8], `${name}: 방향 이름 ${d}`).toBeDefined();
          expect(frames!.length, `${name} ${d}: 프레임`).toBeGreaterThan(0);
          for (const [page, x, y, w, h] of frames!) {
            expect(page).toBeLessThan(sheet.pages.length);
            expect(Math.min(x, y)).toBeGreaterThanOrEqual(0);
            expect(Math.min(w, h)).toBeGreaterThan(0);
          }
        }
      }
    });
  }
});
