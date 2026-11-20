// 자동 공격 (기획서 3.9절). 켜 두면 주변의 적을 스스로 상대한다.
//
//  - 반경 안에 적이 있으면 닿는 자리까지 걸어가 기본 공격을 하고, 액티브 스킬이 준비되면 쓴다.
//  - 궁극기는 기본으로는 쓰지 않는다 (params.csv 의 auto.ult 로 바꿀 수 있다). 펫 스킬·교체·상호작용도 직접 한다.
//  - 직접 조작이 언제나 먼저다: D패드(이동), 공격 버튼, 회피를 누르는 동안에는 손을 뗀다. 조작이 끝나면 바로 다시 맡는다.
//  - 반경 안에 적이 없으면 제자리에 선다. 스스로 맵을 돌아다니지 않는다.
//
// 조작 입력을 바꿔 주는 방식이다: 플레이어의 입력을 받아 "자동이 대신 누른 입력"을 돌려준다.
// 그래서 공격·이동·스킬의 규칙은 손으로 할 때와 완전히 같다 (Party 는 자동인지 모른다).
import { db } from '../../data/tables';
import type { Enemy } from '../enemy/Enemy';
import { emptyInput, type InputState } from '../input';
import { FlowField } from '../world/flow';
import { TILE } from '../world/layout';
import type { World } from '../world/World';

/** 다가가는데도 이만큼(px)도 못 움직인 채 이 시간(초)이 지나면 걸린 것으로 보고 길을 따라 돌아간다 */
const STALL_DIST = 6;
const STALL_TIME = 0.35;
/** 걸렸을 때 길찾기만 따르는 시간(초) */
const DETOUR_TIME = 1.2;
/** 지금 상대하는 적을 다른 적보다 이만큼(px) 가깝게 쳐 준다 (대상이 자꾸 바뀌어 왔다 갔다 하지 않게) */
const STICKY = 70;

export class AutoPilot {
  /** 켜져 있는지 (HUD 의 AUTO 버튼) */
  on = false;
  /** 지금 상대하는 적. 없으면 null */
  target: Enemy | null = null;
  /** 지금 자동이 조작하고 있는지 (꺼져 있거나 직접 조작 중이면 false) */
  driving = false;

  private out: InputState = emptyInput();
  private world: World | null = null;
  private nav: FlowField | null = null;
  private dir = { x: 0, y: 0 };
  /** 멈춰서 치는 중인지. 치기 시작하는 거리와 계속 치는 거리를 다르게 둔다 */
  private striking = false;
  private lastX = 0;
  private lastY = 0;
  private stallT = 0;
  private detourT = 0;

  /**
   * 이번 프레임에 규칙 코드에 넘길 입력을 돌려준다.
   * @param input 플레이어의 입력 (월드 방향). 직접 조작 중이면 이것을 그대로 돌려준다
   */
  apply(w: World, input: InputState, dt: number): InputState {
    const p = w.party;
    if (this.world !== w) {
      this.world = w;
      this.nav = new FlowField(w.grid);
      this.target = null;
      this.striking = false;
      this.detourT = 0;
    }
    // 직접 조작이 먼저다
    const manual = input.dirActive || input.attack || input.actions.some((a) => a.type === 'dodge');
    if (!this.on || w.over || p.wiped || manual) {
      this.driving = false;
      this.striking = false;
      this.stallT = 0;
      if (!this.on) this.target = null;
      return input;
    }
    this.driving = true;

    const out = this.out;
    out.dirX = out.dirY = 0;
    out.dirActive = out.dirFree = false;
    out.attack = false;
    // 눌린 버튼(스킬·교체·상호작용)은 그대로 전한다. 처리한 쪽에서 비우므로 같은 배열을 쓴다
    out.actions = input.actions;

    const m = p.active;
    const range = m.range();
    const t = this.pick(w, range);
    this.target = t;
    if (!t) {
      // 반경 안에 적이 없다: 제자리에 선다
      this.striking = false;
      this.stallT = 0;
      return out;
    }

    const d = Math.hypot(t.x - p.x, t.y - p.y) - t.r;
    const reach = range * (this.striking ? 1 : db.pct('auto.reach'));
    if (d <= reach && w.clearShot(p.x, p.y, t.x, t.y)) {
      // 닿는다: 멈춰서 친다. 조준은 손으로 공격 버튼만 누를 때와 같다 (추천 타겟을 향한다)
      this.striking = true;
      this.stallT = 0;
      out.attack = true;
      if (!p.busy) {
        if (m.charges > 0 && d <= db.svOr(`${m.def.id}.active.autoRange`, range)) out.actions.push({ type: 'active' });
        else if (this.wantsUlt(w, range)) out.actions.push({ type: 'ult' });
      }
      return out;
    }

    // 닿지 않는다: 다가간다
    this.striking = false;
    this.approach(w, t, dt);
    return out;
  }

  /**
   * 상대할 적을 고른다. 가까운 적부터, 걸어서 갈 수 있는 적만.
   *  - 이쪽을 알아챈 적: 반경(auto.radius) 안. 사거리가 더 길면 사거리까지
   *  - 아직 알아채지 못한 적: 가까이(auto.near) 있을 때만
   */
  private pick(w: World, range: number): Enemy | null {
    const p = w.party;
    const radius = Math.max(db.P('auto.radius'), range);
    const near = db.P('auto.near');
    let best: Enemy | null = null;
    let bestScore = Infinity;
    for (const e of w.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y) - e.r;
      const limit = e.aggro ? radius : near;
      if (d > limit) continue;
      const score = d - (e === this.target ? STICKY : 0);
      if (score >= bestScore) continue;
      // 벽 너머의 적을 쫓아 멀리 돌아가지 않는다. 지금 자리에서 바로 칠 수 있으면 길은 따지지 않는다
      if (!(d <= range && w.clearShot(p.x, p.y, e.x, e.y))) {
        const steps = w.flow.steps(e.x, e.y);
        if (steps < 0 || steps * TILE > limit * 1.5 + TILE * 2) continue;
      }
      best = e;
      bestScore = score;
    }
    return best;
  }

  /** 적에게 다가가는 방향을 넣는다. 곧게 갈 수 있으면 곧게, 벽에 막히거나 걸리면 길을 따라 돌아간다 */
  private approach(w: World, t: Enemy, dt: number): void {
    const p = w.party;
    // 걸렸는지: 다가가는 중인데 거의 움직이지 못했다 (모서리, 엄폐 오브젝트)
    if (Math.hypot(p.x - this.lastX, p.y - this.lastY) > STALL_DIST) {
      this.lastX = p.x;
      this.lastY = p.y;
      this.stallT = 0;
    } else {
      this.stallT += dt;
      if (this.stallT >= STALL_TIME) {
        this.stallT = 0;
        this.detourT = DETOUR_TIME;
      }
    }
    this.detourT = Math.max(0, this.detourT - dt);

    let dx = t.x - p.x;
    let dy = t.y - p.y;
    if (this.detourT > 0 || !w.los(p.x, p.y, t.x, t.y)) {
      const nav = this.nav!;
      nav.compute(t.x, t.y);
      if (nav.dir(p.x, p.y, this.dir)) {
        dx = this.dir.x;
        dy = this.dir.y;
      }
    }
    const len = Math.hypot(dx, dy);
    if (len === 0) return;
    const out = this.out;
    out.dirX = dx / len;
    out.dirY = dy / len;
    out.dirActive = true;
  }

  /** 궁극기를 자동으로 쓸지 (params.csv 의 auto.ult) */
  private wantsUlt(w: World, range: number): boolean {
    const mode = db.P('auto.ult');
    const p = w.party;
    if (mode <= 0 || p.active.ult < db.P('ult.max')) return false;
    if (mode === 1) return true;
    // 강한 적(정예·특급·보스)이 반경 안에 있을 때만
    const radius = Math.max(db.P('auto.radius'), range);
    return w.enemies.some((e) => !e.dead && (e.boss || e.grade.grade >= 1) && Math.hypot(e.x - p.x, e.y - p.y) - e.r <= radius);
  }
}
