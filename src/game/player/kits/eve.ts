// 이브 — A급 / 지원 / 실체 / 깃창
// 기본 공격: 직선 관통 찌르기 · 액티브: 전투 깃발 (범위 버프) · 궁극기: 진군 나팔
import { deg } from '../../../core/math';
import { db } from '../../../data/tables';
import type { World } from '../../world/World';
import type { Kit } from '../kit';
import type { Member } from '../Member';

const V = (k: string): number => db.sv(`eve.${k}`);
const COLOR = 0xa8f0c8;

function thrust(w: World, m: Member, aim: number, reach: number, mult: number): void {
  const p = w.party;
  const ex = p.x + Math.cos(aim) * reach;
  const ey = p.y + Math.sin(aim) * reach;
  if (db.P('fx.basicRange')) w.fx.slash(p.x, p.y, aim, reach, deg(18), COLOR, true);
  w.lineHit(p.x, p.y, ex, ey, V('basic.half'), { m, mult, kind: 'basic', knock: V('basic.knock') });
}

export const eve: Kit = {
  basic({ w, p, m, aim }) {
    const aspd = m.aspd();
    const windup = V('basic.windup') / aspd;
    const reach = V('basic.reach') * m.stats.range;
    p.force(aim, V('basic.lunge'), windup);
    p.after(w, windup, () => {
      thrust(w, m, aim, reach, V('basic.dmg') / 100);
      // 연속 찌르기: 몇 번마다 더 긴 추가 찌르기
      const lv = w.run.lv('eve_combo');
      if (lv <= 0) return;
      const u = db.upgrade('eve_combo');
      m.vars.thrust = (m.vars.thrust ?? 0) + 1;
      if (m.vars.thrust < u.v2) return;
      m.vars.thrust = 0;
      p.after(w, 0.12, () => thrust(w, m, aim, reach * 1.3, (lv * u.v1) / 100));
    });
    return V('basic.interval') / aspd;
  },

  active({ w, p, m }) {
    const run = w.run;
    const wideLv = run.lv('eve_flag_wide');
    const wide = db.upgrade('eve_flag_wide');
    const atk = (V('active.atk') + run.lv('eve_flag_atk') * db.upgrade('eve_flag_atk').v1) / 100;
    const guard = V('active.guard') / 100;
    const shotLv = run.lv('eve_flag_shot');
    const shot = db.upgrade('eve_flag_shot');
    let shotT = 0;
    const tick = 0.25;
    w.addZone({
      look: 'flag',
      team: 'party',
      x: p.x,
      y: p.y,
      r: V('active.radius') * (1 + (wideLv * wide.v1) / 100),
      dur: V('active.duration') + wideLv * wide.v2,
      color: COLOR,
      tick,
      onTick: (z) => {
        const party = w.party;
        // 범위 안에 있는 동안 필드 캐릭터 강화 (밖으로 나가면 곧 사라진다)
        if (Math.hypot(party.x - z.x, party.y - z.y) <= z.r) {
          party.active.addBuff({ id: 'eve_flag', label: '깃발', dur: 0.5, atk, guard });
        }
        // 깃발 포격
        if (shotLv <= 0) return;
        shotT += tick;
        if (shotT < shot.v2) return;
        shotT = 0;
        w.fx.ring(z.x, z.y, z.r, COLOR, 0.3);
        w.areaHit(z.x, z.y, z.r, { m, mult: (shotLv * shot.v1) / 100, kind: 'active' });
      },
    });
    return V('active.lock');
  },

  ult({ w, p, m }) {
    // 진군 나팔: 직접 피해 대신 팀 전체를 강화하고, 그동안 필드 캐릭터의 공격에 이브의 창이 함께 날아간다.
    // 교체한 뒤에도 이어지므로, 나팔을 불고 딜러로 바꿔 싸우는 것이 기본 쓰임이다
    w.after(V('ult.windup'), () => {
      if (m.dead) return;
      const dur = V('ult.buffDur');
      w.fx.ring(p.x, p.y, 220, COLOR, 0.5);
      w.fx.ring(p.x, p.y, 320, 0xffffff, 0.6);
      w.fx.shake(6);
      for (const mem of p.members) {
        if (mem.dead) continue;
        mem.addBuff({
          id: 'eve_ult',
          label: '진군',
          dur,
          atk: V('ult.atk') / 100,
          aspd: V('ult.aspd') / 100,
        });
      }
      w.addZone({
        look: 'storm',
        team: 'party',
        x: p.x,
        y: p.y,
        r: 64,
        dur,
        color: COLOR,
        follow: true,
        tick: V('ult.spearEvery'),
        onTick: () => {
          // 필드 캐릭터가 공격하는 동안에만 협공한다
          if (p.wiped || p.action !== 'attack') return;
          w.shoot({
            angle: p.facing,
            speed: V('ult.spearSpeed'),
            range: V('ult.spearRange'),
            r: 16,
            look: 'bigarrow',
            color: COLOR,
            pierce: -1,
            hit: { m, mult: V('ult.spearDmg') / 100, kind: 'ult' },
          });
        },
      });
    });
    return V('ult.lock');
  },

  // 인계: 교체해 나갈 때 다음 캐릭터의 공격력 증가
  onSwapOut(w, _m, next) {
    const lv = w.run.lv('eve_handover');
    if (lv <= 0) return;
    const u = db.upgrade('eve_handover');
    next.addBuff({ id: 'eve_handover', label: '인계', dur: u.v2, atk: (lv * u.v1) / 100 });
  },

  // 패시브 "사기": 오프 필드일 때 필드 캐릭터의 궁극기 게이지 획득 증가
  aura(_m, aura) {
    aura.ultGain += V('passive.ult') / 100;
  },
};
