// 섹터 한 판의 전투 월드. 파티·몬스터·투사체·범위 효과·상호작용 오브젝트를 모두 갖고 규칙을 진행한다.
// 화면은 그리지 않는다. 표시부가 이 객체의 상태를 읽어 그리고, 일회성 이펙트만 fx로 요청한다.
import { angDiff } from '../../core/math';
import type { Rng } from '../../core/rng';
import { db } from '../../data/tables';
import { AI } from '../enemy/ai';
import { Enemy } from '../enemy/Enemy';
import {
  nullFx,
  type Barrier,
  type FxApi,
  type HitSpec,
  type Pack,
  type Projectile,
  type Team,
  type Thing,
  type ThingKind,
  type Zone,
} from '../entities';
import type { InputState } from '../input';
import { Pet } from '../pet/Pet';
import { KITS } from '../player/kits';
import { Member } from '../player/Member';
import { Party } from '../player/Party';
import type { RunState } from '../run/RunState';
import type { PackSpawn, SectorSetup } from '../run/sector';
import { distToSegment, lineOfSight, moveCircle, nearestFree, resolveCircle, solidAtPx, type Grid } from './collision';
import { FlowField } from './flow';
import { TILE } from './layout';
import type { SectorPlan } from './placement';

export type FinishResult = 'clear' | 'wipe' | 'timeout';

export interface WorldEvents {
  onFinish?(result: FinishResult): void;
  /** 보상 상자·수색 오브젝트·NPC에 반응했을 때 */
  onThing?(t: Thing): void;
  onPackCleared?(pack: Pack, x: number, y: number): void;
}

export interface ShootOpts {
  x?: number;
  y?: number;
  angle: number;
  speed: number;
  range: number;
  r: number;
  look: string;
  color: number;
  hit: HitSpec;
  pierce?: number;
  bounce?: number;
  homing?: number;
  target?: Enemy | null;
  splash?: { r: number; mult: number };
  wall?: boolean;
  onHitEnemy?: (e: Enemy) => void;
}

export interface ZoneOpts {
  look: string;
  team: Team;
  x: number;
  y: number;
  r: number;
  dur: number;
  color: number;
  x2?: number;
  y2?: number;
  half?: number;
  owner?: Enemy | null;
  follow?: boolean;
  tick?: number;
  onTick?: (z: Zone) => void;
  onEnd?: (z: Zone) => void;
}

export interface QuestInfo {
  mode: 'sector' | 'raid' | 'wave';
  /** 남은 시간(초). 제한 시간이 없으면 -1 */
  timeLeft: number;
  waveStage: number;
  score: number;
  /** 보스 섹터인지 */
  boss: boolean;
  hasGate: boolean;
  gateCleared: boolean;
  exitOpen: boolean;
  packsCleared: number;
  packsTotal: number;
  searched: number;
  searchTotal: number;
}

export class World {
  readonly run: RunState;
  readonly setup: SectorSetup;
  readonly plan: SectorPlan;
  readonly grid: Grid;
  readonly rng: Rng;
  readonly party: Party;
  readonly pet: Pet;
  readonly flow: FlowField;

  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  zones: Zone[] = [];
  barriers: Barrier[] = [];
  things: Thing[] = [];
  packs: Pack[] = [];
  /** 이번 프레임에 사라진 것들. 표시부가 가져가서 화면에서 지운다 */
  gone: { view?: unknown }[] = [];

  fx: FxApi = nullFx;
  events: WorldEvents = {};

  time = 0;
  over: FinishResult | null = null;
  /** 지나간 칸 (미니맵용) */
  explored: Uint8Array;
  exploredVersion = 0;
  stats = { kills: 0, dealt: 0, taken: 0, shards: 0, searched: 0 };
  /** 괴이 범람: 현재 웨이브 단계(0부터)와 점수 */
  waveStage = 0;
  score = 0;
  private waveT = 1.5;
  /** 디버그: 피해를 받지 않는다 */
  cheatInvuln = false;
  /** 근거리 캐릭터도 자동 조준을 쓰게 하는 시험용 옵션 (디버그 메뉴) */
  autoAimAll = false;
  /** 지금 상호작용할 수 있는 오브젝트 (닿는 거리 안에서 가장 가까운 하나). 없으면 null */
  nearThing: Thing | null = null;
  /** 팀 공통 장비 스킬 "탐지 귀걸이"의 단계 (0 없음, 1 수색·NPC, 2 +몬스터, 3 +출구) */
  radar = 0;

  private timers: { t: number; fn: () => void }[] = [];
  private nextId = 1;
  private lastTile = -1;
  private exitThing: Thing | null = null;

  constructor(run: RunState, setup: SectorSetup, rng: Rng) {
    this.run = run;
    this.setup = setup;
    this.plan = setup.plan;
    this.grid = { w: this.plan.w, h: this.plan.h, solid: this.plan.solid };
    this.rng = rng;
    this.explored = new Uint8Array(this.plan.w * this.plan.h);

    const members = run.team.map((s) => {
      const kit = KITS[s.id];
      if (!kit) throw new Error(`캐릭터 "${s.id}"의 스킬 구현이 없습니다`);
      return new Member(db.char(s.id), kit, s, run);
    });
    this.party = new Party(members, this.plan.start.x, this.plan.start.y);
    this.pet = new Pet(run.petId, this.party.x, this.party.y);
    this.flow = new FlowField(this.grid);

    for (const sp of setup.spawns) this.spawnPack(sp);
    if (this.plan.exit) {
      const hasGate = this.packs.some((p) => p.gate);
      this.exitThing = this.addThing('exit', this.plan.exit.x, this.plan.exit.y, 40);
      this.exitThing.locked = hasGate;
    }
    const reach = db.P('search.radius');
    for (const l of setup.loot) this.addThing(l.kind, l.x, l.y, reach);
    if (setup.npc) this.addThing('npc', setup.npc.x, setup.npc.y, reach);
    this.radar = run.teamSkillRarity('c_radar');
    this.reveal();
  }

  // ---- 진행 ---------------------------------------------------------------

  update(dt: number, input: InputState): void {
    if (this.over) return;
    this.time += dt;
    this.runTimers(dt);
    // 상호작용 버튼은 파티 행동(공격·회피)과 별개로 처리한다
    if (input.actions.some((a) => a.type === 'interact')) {
      input.actions = input.actions.filter((a) => a.type !== 'interact');
      this.interact();
      if (this.over) return;
    }
    this.party.update(this, input, dt);
    // 안전장치: 어떤 이유로든 파티가 벽 안에 들어가 있으면 밖으로 빼낸다
    resolveCircle(this.grid, this.party);
    this.pet.update(this, dt);
    this.flow.compute(this.party.x, this.party.y);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.updateBarriers(dt);
    this.updateThings(dt);
    this.reveal();
    if (this.over) return;
    if (this.setup.mode === 'wave') this.updateWave(dt);
    else if (this.setup.timeLimit > 0 && this.time >= this.setup.timeLimit) this.finish('timeout');
  }

  /** delay초 뒤에 실행. 행동 취소와 무관하게 반드시 실행된다 (취소돼야 하면 Party.after를 쓴다) */
  after(delay: number, fn: () => void): void {
    this.timers.push({ t: delay, fn });
  }

  private runTimers(dt: number): void {
    const due: (() => void)[] = [];
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const t = this.timers[i];
      t.t -= dt;
      if (t.t <= 0) {
        this.timers.splice(i, 1);
        due.push(t.fn);
      }
    }
    for (let i = due.length - 1; i >= 0; i--) due[i]();
  }

  finish(result: FinishResult): void {
    if (this.over) return;
    this.over = result;
    if (result === 'clear') {
      // 시즌 스킬 "밤이슬": 섹터 클리어 시 팀 체력 회복
      const lv = this.run.lv('s_regen');
      if (lv > 0) {
        const pct = (lv * db.upgrade('s_regen').v1) / 100;
        for (const m of this.party.members) m.heal(m.stats.maxHp * pct);
      }
    }
    for (const m of this.party.members) m.save();
    this.run.kills += this.stats.kills;
    this.run.time += this.time;
    this.events.onFinish?.(result);
  }

  /** 스킬 성장·장비가 바뀐 뒤 전투 중인 캐릭터들의 능력치를 다시 계산한다 */
  refreshTeam(): void {
    for (const m of this.party.members) m.refresh(this.run);
    this.radar = this.run.teamSkillRarity('c_radar');
  }

  quest(): QuestInfo {
    const gate = this.packs.find((p) => p.gate);
    const search = this.things.filter((t) => t.kind !== 'exit' && t.kind !== 'chest' && t.kind !== 'npc');
    return {
      mode: this.setup.mode,
      timeLeft: this.setup.timeLimit > 0 ? Math.max(0, this.setup.timeLimit - this.time) : -1,
      waveStage: this.waveStage,
      score: Math.floor(this.score),
      boss: this.setup.def.type === 'boss',
      hasGate: !!gate,
      gateCleared: !gate || gate.cleared,
      exitOpen: !!this.exitThing && !this.exitThing.locked,
      packsCleared: this.packs.filter((p) => p.cleared).length,
      packsTotal: this.packs.length,
      searched: search.filter((t) => t.done).length,
      searchTotal: search.length,
    };
  }

  // ---- 몬스터 -------------------------------------------------------------

  spawnPack(sp: PackSpawn): Pack {
    const pack: Pack = {
      id: this.nextId++,
      x: sp.x,
      y: sp.y,
      gate: sp.gate,
      quality: sp.quality,
      members: [],
      alive: 0,
      aggro: false,
      cleared: false,
    };
    const spread = db.P('enemy.packSpread');
    sp.members.forEach((sm, i) => {
      let x = sp.x;
      let y = sp.y;
      if (sp.members.length > 1) {
        for (let tries = 0; tries < 8; tries++) {
          const a = (i / sp.members.length) * Math.PI * 2 + this.rng.range(-0.4, 0.4);
          const d = this.rng.range(spread * 0.4, spread);
          const cx = sp.x + Math.cos(a) * d;
          const cy = sp.y + Math.sin(a) * d;
          if (!solidAtPx(this.grid, cx, cy) && lineOfSight(this.grid, sp.x, sp.y, cx, cy)) {
            x = cx;
            y = cy;
            break;
          }
        }
      }
      const e = this.spawnEnemy(sm.def.id, sm.grade, x, y);
      e.pack = pack;
      pack.members.push(e);
      pack.alive++;
    });
    this.packs.push(pack);
    return pack;
  }

  spawnEnemy(monsterId: string, grade: number, x: number, y: number): Enemy {
    const pos = nearestFree(this.grid, x, y);
    const def = db.monster(monsterId);
    // 보스의 체력·공격력은 테이블 값을 그대로 쓴다 (섹터 깊이 보정 없음)
    const big = def.size === 'L';
    const e = new Enemy(
      this.nextId++,
      def,
      db.grade(grade),
      pos.x,
      pos.y,
      big ? this.setup.bossHpMult : this.setup.hpMult,
      big ? this.setup.bossAtkMult : this.setup.atkMult,
    );
    // 무리가 한꺼번에 같은 박자로 공격하지 않게 첫 공격 시점을 흩는다 (시드를 따르는 난수)
    e.cd = this.rng.range(0, 0.6);
    // 보스의 약점 속성은 런마다 다르다
    if (e.boss) e.weak = this.run.bossWeak;
    resolveCircle(this.grid, e);
    this.enemies.push(e);
    return e;
  }

  /** 한 마리가 알아채면 무리 전체가 반응한다 */
  aggro(e: Enemy): void {
    e.aggro = true;
    const pack = e.pack;
    if (!pack || pack.aggro) return;
    pack.aggro = true;
    for (const m of pack.members) m.aggro = true;
  }

  private updateEnemies(dt: number): void {
    const p = this.party;
    const aggroRange = db.P('enemy.aggroRange');
    let anyGone = false;
    for (const e of this.enemies) {
      if (e.dead) {
        e.deathT -= dt;
        e.animT += dt;
        if (e.deathT <= 0) anyGone = true;
        continue;
      }
      e.tickTimers(dt);
      if (e.kx !== 0 || e.ky !== 0) {
        moveCircle(this.grid, e, e.kx * dt, e.ky * dt);
        const k = Math.max(0, 1 - dt * 9);
        e.kx *= k;
        e.ky *= k;
        if (Math.abs(e.kx) + Math.abs(e.ky) < 4) e.kx = e.ky = 0;
      }
      // 출혈: 0.5초마다 지속 피해
      const bleed = e.debuff('bleed');
      if (bleed) {
        e.vars.bleedT = (e.vars.bleedT ?? 0) + dt;
        if (e.vars.bleedT >= 0.5) {
          e.vars.bleedT -= 0.5;
          this.dot(e, bleed.v * bleed.stacks * 0.5);
          if (e.dead) continue;
        }
      }
      if (e.stunT > 0) {
        e.stunT -= dt;
        e.setAnim('Stun');
        continue;
      }
      if (!e.aggro) {
        const d = Math.hypot(p.x - e.x, p.y - e.y);
        if (d < aggroRange && this.los(e.x, e.y, p.x, p.y)) this.aggro(e);
        else {
          e.setAnim('Idle');
          continue;
        }
      }
      if (e.state === 'idle') e.state = 'move';
      (AI[e.def.ai] ?? AI.chaser)(this, e, dt);
    }

    // 서로 겹치지 않게 밀어내기
    const list = this.enemies;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.dead) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (b.dead) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const min = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min) continue;
        const d = Math.sqrt(d2) || 0.01;
        // 한 프레임에 조금씩만 벌린다 (크게 밀면 벽 속으로 들어갈 수 있다)
        const push = Math.min(6, (min - d) / 2);
        const ux = dx / d;
        const uy = dy / d;
        // 슈퍼 아머(중형 이상)는 밀리지 않는다
        const wa = a.superArmor ? 0 : b.superArmor ? 2 : 1;
        const wb = b.superArmor ? 0 : a.superArmor ? 2 : 1;
        a.x -= ux * push * wa;
        a.y -= uy * push * wa;
        b.x += ux * push * wb;
        b.y += uy * push * wb;
      }
    }
    for (const e of list) {
      if (e.dead) continue;
      // 플레이어와 겹치지 않게 (몬스터만 밀린다)
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const min = e.r + p.r;
      const d2 = dx * dx + dy * dy;
      if (d2 < min * min && !(e.state === 'act')) {
        const d = Math.sqrt(d2) || 0.01;
        const px = (dx / d) * (min - d);
        const py = (dy / d) * (min - d);
        // 밀어낼 때도 벽을 뚫지 않게 충돌을 따지며 옮긴다
        if (e.superArmor) {
          // 큰 몬스터는 밀리지 않으므로 플레이어가 밀려난다
          moveCircle(this.grid, p, -px, -py);
        } else {
          moveCircle(this.grid, e, px, py);
        }
      }
      for (const b of this.barriers) {
        if (b.dead) continue;
        const bd = distToSegment(e.x, e.y, b.x1, b.y1, b.x2, b.y2);
        if (bd >= e.r + b.half) continue;
        // 방벽에서 플레이어 반대쪽(자기가 온 쪽)으로 밀어낸다
        const mx = (b.x1 + b.x2) / 2;
        const my = (b.y1 + b.y2) / 2;
        const nx = -(b.y2 - b.y1);
        const ny = b.x2 - b.x1;
        const nl = Math.hypot(nx, ny) || 1;
        const side = (e.x - mx) * nx + (e.y - my) * ny >= 0 ? 1 : -1;
        const push = e.r + b.half - bd;
        moveCircle(this.grid, e, (nx / nl) * side * push, (ny / nl) * side * push);
      }
      resolveCircle(this.grid, e);
    }

    if (anyGone) {
      this.enemies = this.enemies.filter((e) => {
        if (e.dead && e.deathT <= 0) {
          this.gone.push(e);
          return false;
        }
        return true;
      });
    }
  }

  /** 괴이 범람: 시간이 지날수록 강한 무리가 가장자리에서 몰려온다 */
  private updateWave(dt: number): void {
    const P = db.P;
    const maxStage = Math.max(...db.waves.map((w) => w.stage));
    this.waveStage = Math.min(maxStage, Math.floor(this.time / P('wave.stageTime')));
    this.score += dt * P('wave.scorePerSecond');
    if (this.time >= P('wave.duration')) {
      this.score += P('wave.clearBonus');
      this.finish('clear');
      return;
    }
    this.waveT -= dt;
    if (this.waveT > 0) return;
    let alive = 0;
    for (const e of this.enemies) if (!e.dead) alive++;
    if (alive >= P('wave.maxAlive')) return;
    const stage = this.waveStage;
    this.waveT = Math.max(2, P('wave.spawnEvery') * (1 - 0.08 * stage));
    const group = this.rng.weighted(
      db.waves.filter((w) => w.stage <= stage),
      (w) => w.weight * (1 + w.stage),
    );
    if (!group || !this.plan.waves.length) return;
    // 플레이어에게서 떨어진 출현 지점을 고른다
    const p = this.party;
    const far = this.plan.waves.filter((s) => Math.hypot(s.x - p.x, s.y - p.y) > 320);
    const spot = this.rng.pick(far.length ? far : this.plan.waves);
    this.fx.ring(spot.x, spot.y, 90, 0xff4d5e, 0.5);
    const hp = 1 + stage * db.pct('wave.hpPerStage');
    const atk = 1 + stage * db.pct('wave.atkPerStage');
    for (const m of group.members) {
      for (let i = 0; i < m.count; i++) {
        const e = this.spawnEnemy(m.id, m.grade, spot.x + this.rng.range(-50, 50), spot.y + this.rng.range(-50, 50));
        e.maxHp = Math.round(e.maxHp * hp);
        e.hp = e.maxHp;
        e.atk *= atk;
        e.aggro = true;
      }
    }
  }

  // ---- 탐색 ---------------------------------------------------------------

  los(x1: number, y1: number, x2: number, y2: number): boolean {
    return lineOfSight(this.grid, x1, y1, x2, y2);
  }

  /**
   * 투사체가 벽 모서리에 걸리지 않고 지나갈 수 있는지. 가운데 선뿐 아니라 양옆으로 조금 떨어진 선도 막히지 않아야 한다.
   * (가운데만 보면 모서리 틈으로 보이기만 하는 적을 겨눠, 쏴도 닿지 않는 일이 생긴다)
   */
  clearShot(x1: number, y1: number, x2: number, y2: number, margin = 10): boolean {
    if (!this.los(x1, y1, x2, y2)) return false;
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 1) return true;
    const nx = (-(y2 - y1) / len) * margin;
    const ny = ((x2 - x1) / len) * margin;
    return this.los(x1 + nx, y1 + ny, x2 + nx, y2 + ny) && this.los(x1 - nx, y1 - ny, x2 - nx, y2 - ny);
  }

  /** 추천 타겟: 사거리 안에서 가려지지 않은(쏘면 닿는) 가장 가까운 적 */
  findTarget(x: number, y: number, range: number): Enemy | null {
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d - e.r > range || d >= bestD) continue;
      if (!this.clearShot(x, y, e.x, e.y)) continue;
      best = e;
      bestD = d;
    }
    return best;
  }

  /** 가려짐을 따지지 않는 가장 가까운 적 */
  nearestEnemy(x: number, y: number, range: number, filter?: (e: Enemy) => boolean): Enemy | null {
    let best: Enemy | null = null;
    let bestD = range;
    for (const e of this.enemies) {
      if (e.dead || (filter && !filter(e))) continue;
      const d = Math.hypot(e.x - x, e.y - y) - e.r;
      if (d < bestD) {
        best = e;
        bestD = d;
      }
    }
    return best;
  }

  partyInCircle(x: number, y: number, r: number): boolean {
    const p = this.party;
    return Math.hypot(p.x - x, p.y - y) <= r + p.r * 0.5;
  }

  partyInLine(x1: number, y1: number, x2: number, y2: number, half: number): boolean {
    const p = this.party;
    return distToSegment(p.x, p.y, x1, y1, x2, y2) <= half + p.r * 0.5;
  }

  // ---- 피해 ---------------------------------------------------------------

  /** 적 한 마리에게 타격을 준다. (fromX, fromY)는 넉백의 기준점 */
  hit(e: Enemy, h: HitSpec, fromX?: number, fromY?: number): number {
    if (e.dead || e.invuln) return 0;
    const m = h.m;
    const party = this.party;
    let dmg = (m ? m.atk() : party.avgAtk()) * h.mult;
    let crit = false;
    let weak = false;
    if (m) {
      const st = m.stats;
      if (h.kind === 'basic') dmg *= st.basicDmg;
      else if (h.kind === 'active') dmg *= st.activeDmg;
      else if (h.kind === 'ult') dmg *= st.ultDmg;
      if (h.kind !== 'equip') {
        dmg *= st.allDmg * m.traitMult() * (m.kit.dmgMult?.(this, m, e, h) ?? 1);
        if (!h.noCrit && this.rng.chance(m.critRate())) {
          crit = true;
          dmg *= st.critDmg;
        }
      }
      if (e.weak === m.def.attr) {
        weak = true;
        dmg *= db.pct('weak.mult');
      }
      // 시즌 스킬 "처형자": 타격 포지션의 정예·보스 대상 피해 증가
      if (m.def.position === 'striker' && (e.grade.grade > 0 || e.boss) && h.kind !== 'equip') {
        const lv = this.run.lv('s_striker2');
        if (lv > 0) dmg *= 1 + (lv * db.upgrade('s_striker2').v1) / 100;
      }
    }
    dmg *= e.vulnerability();
    dmg = Math.max(1, Math.round(dmg * this.rng.range(0.95, 1.05)));

    this.stats.dealt += Math.min(e.hp, dmg);
    e.hp -= dmg;
    e.hitFlash = 0.12;
    this.aggro(e);

    if (h.knock && !e.superArmor) {
      const ox = fromX ?? party.x;
      const oy = fromY ?? party.y;
      const dx = e.x - ox;
      const dy = e.y - oy;
      const d = Math.hypot(dx, dy) || 1;
      e.kx += (dx / d) * h.knock * 6;
      e.ky += (dy / d) * h.knock * 6;
    }
    if (h.stun) e.stun(h.stun);

    this.fx.number(e.x, e.y - e.r - 18, dmg, crit ? 'crit' : weak ? 'weak' : 'dmg');

    if (m) {
      if (h.kind !== 'equip') this.applyTrait(m, e, h);
      if (h.kind !== 'ult' && h.kind !== 'equip') party.gainUlt(h.mult * db.P('ult.gainPer100'));
      h.onHit?.(e, dmg);
      m.kit.onHit?.(this, m, e, h, dmg);
      // 무기 장비 스킬: 필드에 있는 착용자의 기본 공격·액티브·궁극기가 맞았을 때
      if (m.onField && (h.kind === 'basic' || h.kind === 'active' || h.kind === 'ult')) {
        m.eqHit(this, e, h, dmg, crit);
      }
    }
    if (e.hp <= 0) this.kill(e, m);
    return dmg;
  }

  /** 지속 피해 (출혈 등). 치명타·속성 계산 없이 그대로 들어간다 */
  dot(e: Enemy, amount: number): void {
    if (e.dead || e.invuln) return;
    const dmg = Math.max(1, Math.round(amount));
    this.stats.dealt += Math.min(e.hp, dmg);
    e.hp -= dmg;
    this.fx.number(e.x, e.y - e.r - 18, dmg, 'dmg');
    if (e.hp <= 0) this.kill(e, null);
  }

  /** 범위 안의 적을 피해 없이 밀어내고 기절시킨다 */
  shove(x: number, y: number, r: number, knock: number, stun: number): void {
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d = Math.hypot(dx, dy);
      if (d > r + e.r) continue;
      if (!e.superArmor) {
        e.kx += (dx / (d || 1)) * knock * 6;
        e.ky += (dy / (d || 1)) * knock * 6;
      }
      if (stun > 0) e.stun(stun);
    }
  }

  /** 속성 특성 (기획서 5.1절) */
  private applyTrait(m: Member, e: Enemy, h: HitSpec): void {
    const attr = m.def.attr;
    if (attr === 'form') {
      m.formStacks = Math.min(m.formMax(), m.formStacks + 1);
      m.formT = db.P('attr.form.duration');
    } else if (attr === 'nature') {
      const had = e.hasDebuff('shock');
      e.addDebuff('shock', db.P('attr.nature.duration'));
      if (had && h.kind === 'basic' && e.chainIcd <= 0) {
        e.chainIcd = db.P('attr.nature.icd');
        const bonus = m.kit.natureChain?.(this) ?? { extraTargets: 0, bonus: 0 };
        const range = db.P('attr.nature.chainRange');
        const mult = h.mult * db.pct('attr.nature.chainRatio') * (1 + bonus.bonus);
        const done = new Set<Enemy>([e]);
        for (let i = 0; i <= bonus.extraTargets; i++) {
          const other = this.nearestEnemy(e.x, e.y, range, (o) => !done.has(o));
          if (!other) break;
          done.add(other);
          this.fx.bolt(e.x, e.y - e.r, other.x, other.y - other.r, 0xa8f5ff);
          this.hit(other, { m, mult, kind: 'proc', noCrit: true }, e.x, e.y);
        }
      }
    }
  }

  /** 부채꼴 근접 범위 타격. 맞은 적의 수를 돌려준다 */
  meleeArc(x: number, y: number, angle: number, reach: number, arc: number, h: HitSpec): number {
    const targets: Enemy[] = [];
    for (const e of [...this.enemies]) {
      if (e.dead) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d = Math.hypot(dx, dy);
      if (d - e.r > reach) continue;
      // 몸이 닿을 만큼 가까우면 각도와 무관하게 맞는다
      if (d > e.r + 24 && Math.abs(angDiff(angle, Math.atan2(dy, dx))) > arc / 2) continue;
      if (!this.los(x, y, e.x, e.y)) continue;
      targets.push(e);
    }
    return this.cleave(targets, h, x, y, h.kind === 'basic');
  }

  /**
   * 한 번의 근접 타격이 여러 적을 칠 때의 피해 분배.
   * 기본 공격은 가까운 적부터 차례로 피해가 줄어든다 (params.csv 의 basic.cleaveFalloff, basic.cleaveMin).
   * 무리에 둘러싸인 근접 캐릭터의 화력이 적의 수만큼 불어나는 것을 막기 위한 규칙이다.
   */
  private cleave(targets: Enemy[], h: HitSpec, x: number, y: number, falloff: boolean): number {
    if (!falloff || targets.length < 2) {
      for (const e of targets) this.hit(e, h, x, y);
      return targets.length;
    }
    targets.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
    const step = db.P('basic.cleaveFalloff') / 100;
    const min = db.P('basic.cleaveMin') / 100;
    let k = 1;
    for (const e of targets) {
      this.hit(e, k === 1 ? h : { ...h, mult: h.mult * k }, x, y);
      k = Math.max(min, k * step);
    }
    return targets.length;
  }

  /** 원형 범위 타격. 맞은 적의 수를 돌려준다 */
  areaHit(x: number, y: number, r: number, h: HitSpec, fromX?: number, fromY?: number, except?: Enemy): number {
    const targets: Enemy[] = [];
    for (const e of [...this.enemies]) {
      if (e.dead || e === except) continue;
      if (Math.hypot(e.x - x, e.y - y) > r + e.r) continue;
      targets.push(e);
    }
    // 원형 범위는 근접 기본 공격(h.cleave)일 때만 피해를 나눈다. 폭발·장판·스킬은 나누지 않는다
    return this.cleave(targets, h, fromX ?? x, fromY ?? y, !!h.cleave);
  }

  /** 선형 범위 타격 (찌르기 등) */
  lineHit(x1: number, y1: number, x2: number, y2: number, half: number, h: HitSpec): number {
    const targets: Enemy[] = [];
    for (const e of [...this.enemies]) {
      if (e.dead) continue;
      if (distToSegment(e.x, e.y, x1, y1, x2, y2) > half + e.r) continue;
      targets.push(e);
    }
    return this.cleave(targets, h, x1, y1, h.kind === 'basic');
  }

  kill(e: Enemy, killer: Member | null, silent = false): void {
    if (e.dead) return;
    e.dead = true;
    e.hp = 0;
    e.deathT = 0.4;
    e.interrupt();
    e.setAnim('Death');
    this.stats.kills++;
    if (!silent) {
      const shards = Math.round(e.def.shards * e.grade.shardMult * this.setup.shardMult);
      if (shards > 0) this.addShards(shards, e.x, e.y - e.r);
      this.party.gainUlt(db.P('ult.gainPerKill'));
    }
    this.fx.sparks(e.x, e.y - e.r * 0.5, e.def.color, 8);
    for (const m of this.party.members) {
      if (!m.dead) m.kit.onKill?.(this, m, e, killer);
    }
    if (!silent && !this.party.wiped) this.party.active.eqKill(this, e);
    if (!silent && this.setup.mode === 'wave') {
      this.score += e.def.shards * e.grade.shardMult * db.P('wave.scorePerShard');
    }

    const pack = e.pack;
    if (pack && !pack.cleared) {
      pack.alive--;
      if (pack.alive <= 0) {
        pack.cleared = true;
        if (this.setup.def.type === 'boss' && pack.gate) {
          // 보스 격파: 잠시 뒤 섹터 종료
          if (this.setup.mode === 'sector') this.run.bossKilled = true;
          this.fx.shake(14);
          this.after(1.6, () => this.finish('clear'));
        } else {
          if (pack.gate && this.exitThing) {
            this.exitThing.locked = false;
            this.fx.label(this.party.x, this.party.y - 96, '출구가 열렸다', 0x9be8ff);
          }
          // 무리를 전멸시킨 자리에 보상 상자가 생긴다
          const pos = nearestFree(this.grid, e.x, e.y);
          this.addThing('chest', pos.x, pos.y, db.P('search.radius') * 0.8, pack.quality);
        }
        this.events.onPackCleared?.(pack, e.x, e.y);
      }
    }
  }

  /** 파티(필드 캐릭터)가 피해를 받는다. 실제로 맞았으면 true */
  hurt(amount: number, _src: Enemy | null = null): boolean {
    const p = this.party;
    if (p.wiped || this.over) return false;
    if (p.invulnT > 0) {
      if (p.dodging) p.evaded(this);
      return false;
    }
    if (p.hitInvulnT > 0 || this.cheatInvuln) return false;
    const m = p.active;
    let dmg = Math.max(1, Math.round(amount * m.damageTaken()));
    if (m.shield > 0) {
      const absorbed = Math.min(m.shield, dmg);
      m.shield -= absorbed;
      dmg -= absorbed;
    }
    m.hp -= dmg;
    this.stats.taken += dmg;
    p.hitInvulnT = db.P('hit.invuln');
    p.hitFlash = 0.18;
    if (dmg > 0) this.fx.number(p.x, p.y - 70, dmg, 'hurt');
    this.fx.shake(5);
    // 방어구 장비 스킬: 치명적 피해를 버티는 효과 → 피격 시 효과 순으로 본다
    if (m.hp <= 0 && !m.eqFatal(this)) {
      p.memberDown(this);
      return true;
    }
    m.eqHurt(this, dmg, _src && !_src.dead ? _src : null);
    return true;
  }

  heal(m: Member, amount: number): void {
    const healed = m.heal(amount);
    if (healed >= 1 && m.onField) this.fx.number(this.party.x, this.party.y - 70, Math.round(healed), 'heal');
  }

  addShards(n: number, x: number, y: number): void {
    // 팀 공통 장비 스킬 "수집가의 심볼": 괴담 조각 획득량 증가
    const rarity = this.run.teamSkillRarity('c_collector');
    if (rarity > 0) n *= 1 + (db.equipSkill('c_collector').v1 * db.rarity(rarity).skillMult) / 100;
    n = Math.round(n);
    if (n <= 0) return;
    this.run.shards += n;
    this.stats.shards += n;
    this.fx.number(x, y, n, 'shard');
  }

  // ---- 투사체 -------------------------------------------------------------

  shoot(o: ShootOpts): Projectile {
    const p: Projectile = {
      id: this.nextId++,
      team: 'party',
      x: o.x ?? this.party.x,
      y: o.y ?? this.party.y,
      vx: Math.cos(o.angle) * o.speed,
      vy: Math.sin(o.angle) * o.speed,
      r: o.r,
      left: o.range,
      look: o.look,
      color: o.color,
      hit: o.hit,
      pierce: o.pierce ?? 0,
      bounce: o.bounce ?? 0,
      homing: o.homing ?? 0,
      target: o.target ?? null,
      splash: o.splash,
      wall: o.wall ?? true,
      seen: new Set(),
      onHitEnemy: o.onHitEnemy,
      dead: false,
    };
    this.projectiles.push(p);
    return p;
  }

  shootEnemy(owner: Enemy | null, angle: number, speed: number, range: number, r: number, dmg: number): Projectile {
    const p: Projectile = {
      id: this.nextId++,
      team: 'enemy',
      x: owner ? owner.x + Math.cos(angle) * owner.r : 0,
      y: owner ? owner.y + Math.sin(angle) * owner.r : 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r,
      left: range,
      look: 'enemyOrb',
      color: 0xff5f7a,
      dmg,
      owner,
      pierce: 0,
      bounce: 0,
      homing: 0,
      wall: true,
      seen: new Set(),
      dead: false,
    };
    this.projectiles.push(p);
    return p;
  }

  private updateProjectiles(dt: number): void {
    const party = this.party;
    let anyDead = false;
    for (const p of this.projectiles) {
      if (p.dead) {
        anyDead = true;
        continue;
      }
      const speed = Math.hypot(p.vx, p.vy) || 1;
      if (p.homing > 0) {
        if (!p.target || p.target.dead) p.target = this.nearestEnemy(p.x, p.y, 420, (e) => !p.seen.has(e.id));
        if (p.target) {
          const cur = Math.atan2(p.vy, p.vx);
          const want = Math.atan2(p.target.y - p.y, p.target.x - p.x);
          const turn = Math.max(-p.homing * dt, Math.min(p.homing * dt, angDiff(cur, want)));
          p.vx = Math.cos(cur + turn) * speed;
          p.vy = Math.sin(cur + turn) * speed;
        }
      }
      let travel = speed * dt;
      const stepLen = Math.max(10, p.r);
      while (travel > 0 && !p.dead) {
        const s = Math.min(stepLen, travel);
        travel -= s;
        p.x += (p.vx / speed) * s;
        p.y += (p.vy / speed) * s;
        p.left -= s;
        if (p.wall && solidAtPx(this.grid, p.x, p.y)) {
          this.fx.sparks(p.x, p.y, p.color, 3);
          p.dead = true;
          break;
        }
        if (p.team === 'party') {
          for (const e of this.enemies) {
            if (e.dead || p.seen.has(e.id)) continue;
            const rr = e.r + p.r;
            const dx = e.x - p.x;
            const dy = e.y - p.y;
            if (dx * dx + dy * dy > rr * rr) continue;
            p.seen.add(e.id);
            this.hit(e, p.hit!, p.x - p.vx, p.y - p.vy);
            p.onHitEnemy?.(e);
            if (p.splash) {
              this.fx.blast(p.x, p.y, p.splash.r, p.color, 0.2);
              this.areaHit(
                p.x,
                p.y,
                p.splash.r,
                { m: p.hit!.m, mult: p.hit!.mult * p.splash.mult, kind: 'proc', noCrit: true },
                p.x,
                p.y,
                e,
              );
            }
            if (p.pierce === 0) {
              if (p.bounce > 0) {
                p.bounce--;
                const next = this.nearestEnemy(p.x, p.y, 340, (o) => !p.seen.has(o.id));
                if (next) {
                  const a = Math.atan2(next.y - p.y, next.x - p.x);
                  p.vx = Math.cos(a) * speed;
                  p.vy = Math.sin(a) * speed;
                  p.left = Math.max(p.left, 360);
                } else p.dead = true;
              } else p.dead = true;
              break;
            }
            if (p.pierce > 0) p.pierce--;
          }
        } else {
          for (const b of this.barriers) {
            if (!b.dead && distToSegment(p.x, p.y, b.x1, b.y1, b.x2, b.y2) <= b.half + p.r) {
              this.fx.sparks(p.x, p.y, 0xffd9a0, 5);
              p.dead = true;
              break;
            }
          }
          if (p.dead) break;
          const rr = party.r * 0.7 + p.r;
          const dx = party.x - p.x;
          const dy = party.y - p.y;
          if (dx * dx + dy * dy <= rr * rr) {
            // 무적 중에는 그대로 지나간다
            if (this.hurt(p.dmg ?? 0, p.owner ?? null)) p.dead = true;
            else if (party.hitInvulnT > 0 && !party.dodging) p.dead = true;
          }
        }
        if (p.left <= 0) p.dead = true;
      }
      if (p.dead) anyDead = true;
    }
    if (anyDead) {
      this.projectiles = this.projectiles.filter((p) => {
        if (p.dead) this.gone.push(p);
        return !p.dead;
      });
    }
  }

  // ---- 범위 효과 ----------------------------------------------------------

  addZone(o: ZoneOpts): Zone {
    const z: Zone = { ...o, id: this.nextId++, t: 0, tickT: 0, dead: false };
    this.zones.push(z);
    return z;
  }

  /** 적의 원형 공격 예고. dur초 뒤 onFire가 실행된다. 예고를 건 몬스터가 죽거나 기절하면 취소된다 */
  telegraphCircle(owner: Enemy | null, x: number, y: number, r: number, dur: number, onFire: () => void): Zone {
    const z = this.addZone({ look: 'tele', team: 'enemy', x, y, r, dur, color: 0xff4d5e, owner, onEnd: onFire });
    if (owner) owner.tele = z;
    return z;
  }

  /** 적의 선형 공격 예고 */
  telegraphLine(
    owner: Enemy | null,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    half: number,
    dur: number,
    onFire: () => void,
  ): Zone {
    const z = this.addZone({
      look: 'teleLine',
      team: 'enemy',
      x: x1,
      y: y1,
      x2,
      y2,
      half,
      r: half,
      dur,
      color: 0xff4d5e,
      owner,
      onEnd: onFire,
    });
    if (owner) owner.tele = z;
    return z;
  }

  private updateZones(dt: number): void {
    let anyDead = false;
    for (const z of this.zones) {
      if (!z.dead) {
        if (z.owner && (z.owner.dead || z.owner.stunT > 0)) {
          z.dead = true;
          if (z.owner.tele === z) z.owner.tele = null;
        } else {
          if (z.follow) {
            z.x = this.party.x;
            z.y = this.party.y;
          }
          z.t += dt;
          if (z.tick && z.onTick) {
            z.tickT += dt;
            while (z.tickT >= z.tick && !z.dead) {
              z.tickT -= z.tick;
              z.onTick(z);
            }
          }
          if (z.t >= z.dur && !z.dead) {
            z.dead = true;
            if (z.owner && z.owner.tele === z) z.owner.tele = null;
            z.onEnd?.(z);
          }
        }
      }
      if (z.dead) anyDead = true;
    }
    if (anyDead) {
      this.zones = this.zones.filter((z) => {
        if (z.dead) this.gone.push(z);
        return !z.dead;
      });
    }
  }

  addBarrier(x1: number, y1: number, x2: number, y2: number, half: number, dur: number): Barrier {
    const b: Barrier = { id: this.nextId++, x1, y1, x2, y2, half, t: 0, dur, dead: false };
    this.barriers.push(b);
    return b;
  }

  private updateBarriers(dt: number): void {
    if (!this.barriers.length) return;
    for (const b of this.barriers) {
      b.t += dt;
      if (b.t >= b.dur) b.dead = true;
    }
    this.barriers = this.barriers.filter((b) => {
      if (b.dead) this.gone.push(b);
      return !b.dead;
    });
  }

  // ---- 상호작용 오브젝트 --------------------------------------------------

  addThing(kind: ThingKind, x: number, y: number, r: number, quality = 1, data?: unknown): Thing {
    const t: Thing = { id: this.nextId++, kind, x, y, r, progress: 0, locked: false, done: false, quality, data };
    this.things.push(t);
    return t;
  }

  /** 수색을 마쳤을 때의 보상 (기획서 7.2절 수색 오브젝트) */
  private onSearch(t: Thing): void {
    const def = db.object(t.kind);
    const rng = this.rng;
    switch (t.kind) {
      case 'crate':
        this.addShards(rng.int(def.v1, def.v2) * this.setup.shardMult, t.x, t.y - 30);
        break;
      case 'medkit':
        for (const m of this.party.members) this.heal(m, (m.stats.maxHp * def.v1) / 100);
        this.fx.label(t.x, t.y - 50, `팀 체력 +${def.v1}%`, 0x7dff9b);
        break;
      case 'relic': {
        const kind = rng.pick(['atk', 'hp', 'crit'] as const);
        this.run.relics[kind]++;
        this.refreshTeam();
        const text = { atk: '공격력', hp: '최대 체력', crit: '치명타 확률' }[kind];
        this.fx.label(t.x, t.y - 50, `${text} +${db.P(`relic.${kind}`)}%`, 0xc79bff);
        break;
      }
      case 'sealed': {
        // 봉인 상자: 정예가 낀 무리가 나타난다. 처치하면 희귀 이상 보상 상자
        const templates = db.packs.filter(
          (p) => this.setup.def.index >= p.minSector && this.setup.def.index <= p.maxSector,
        );
        const tpl = rng.weighted(templates, (p) => p.weight);
        if (!tpl) break;
        const members = tpl.members.flatMap((m) =>
          Array.from({ length: m.count }, () => ({ def: db.monster(m.id), grade: m.grade })),
        );
        members[0].grade = Math.max(1, members[0].grade);
        const pack = this.spawnPack({ x: t.x, y: t.y, gate: false, quality: 2, members });
        for (const e of pack.members) this.aggro(e);
        this.fx.label(t.x, t.y - 50, '봉인이 풀렸다!', 0xff7a8a);
        this.fx.ring(t.x, t.y, 120, 0xff7a8a, 0.5);
        break;
      }
      default:
        break;
    }
  }

  private updateThings(dt: number): void {
    const p = this.party;
    // 팀 공통 장비 스킬 "수집가의 심볼": 수색 시간 절반
    const searchTime = db.P('search.time') * (this.run.teamSkillRarity('c_collector') > 0 ? 0.5 : 1);
    const reach = db.P('interact.reach');
    let nearest: Thing | null = null;
    let nearestD = Infinity;
    for (const t of this.things) {
      if (t.done) continue;
      const d = Math.hypot(p.x - t.x, p.y - t.y);
      const near = d <= t.r + p.r + reach;
      if (near && !t.locked && !p.wiped && d < nearestD) {
        nearest = t;
        nearestD = d;
      }
      if (t.kind === 'exit' || t.kind === 'chest' || t.kind === 'npc') continue;
      if (t.searching && near) {
        // 수색: 시작한 뒤 근처에 머무르면 진행된다
        t.progress += dt / searchTime;
        if (t.progress >= 1) {
          t.progress = 1;
          t.done = true;
          t.searching = false;
          this.stats.searched++;
          this.onSearch(t);
          this.events.onThing?.(t);
        }
      } else {
        // 벗어나면 수색이 풀리고 진행도가 되돌아간다
        t.searching = false;
        if (t.progress > 0) t.progress = Math.max(0, t.progress - dt * 2);
      }
    }
    this.nearThing = nearest && !nearest.done ? nearest : null;
  }

  /**
   * 가까이 있는 오브젝트와 상호작용을 시작한다 (HUD의 상호작용 버튼).
   * 출구·보상 상자·NPC는 바로 발동하고, 수색 오브젝트는 수색을 시작한다. 할 수 있는 것이 없으면 false.
   */
  interact(): boolean {
    const t = this.nearThing;
    if (!t || t.done || t.locked || this.over) return false;
    if (t.kind === 'exit') {
      t.done = true;
      this.nearThing = null;
      this.finish('clear');
    } else if (t.kind === 'chest' || t.kind === 'npc') {
      t.done = true;
      this.nearThing = null;
      this.events.onThing?.(t);
    } else t.searching = true;
    return true;
  }

  // ---- 탐험 기록 ----------------------------------------------------------

  private reveal(): void {
    const { w, h } = this.plan;
    const tx = Math.floor(this.party.x / TILE);
    const ty = Math.floor(this.party.y / TILE);
    const tile = ty * w + tx;
    if (tile === this.lastTile) return;
    this.lastTile = tile;
    const R = 8;
    for (let y = Math.max(0, ty - R); y <= Math.min(h - 1, ty + R); y++) {
      for (let x = Math.max(0, tx - R); x <= Math.min(w - 1, tx + R); x++) {
        if ((x - tx) * (x - tx) + (y - ty) * (y - ty) <= R * R) this.explored[y * w + x] = 1;
      }
    }
    this.exploredVersion++;
  }

  /** 지도 전체 공개 (NPC 이벤트·디버그용) */
  revealAll(): void {
    this.explored.fill(1);
    this.exploredVersion++;
  }
}
