// 로아 — S급 / 지원 / 자연 / 부적
// 기본 공격: 유도 부적 · 액티브: 정화 결계 (회복 + 피해) · 궁극기: 백귀 진혼
import { deg } from '../../../core/math';
import { db } from '../../../data/tables';
import type { Kit } from '../kit';

const V = (k: string): number => db.sv(`roa.${k}`);
const COLOR = 0xffe9a8;

export const roa: Kit = {
  color: COLOR,

  // 등장 기술 "부적 강림": 부적이 먼저 날아와 꽂히고 그 자리에 나타나, 유도 부적을 부채꼴로 날린다
  entryStyle: 'blink',
  entry({ w, p, m, aim, target }) {
    const windup = V('entry.windup');
    w.fx.play('entry.roa', p.x, p.y, { color: COLOR, dur: windup });
    p.after(w, windup, () => {
      const count = V('entry.count');
      const spread = deg(V('entry.spread'));
      for (let i = 0; i < count; i++) {
        w.shoot({
          x: p.x + Math.cos(aim) * 18,
          y: p.y + Math.sin(aim) * 18,
          angle: aim + (i - (count - 1) / 2) * spread,
          speed: V('basic.speed'),
          range: V('basic.range') * m.stats.range,
          r: V('basic.radius'),
          look: 'talisman',
          color: COLOR,
          weapon: true,
          homing: V('basic.turn'),
          target,
          hit: { m, mult: V('entry.dmg') / 100, kind: 'proc', knock: V('entry.knock') },
        });
      }
    });
    return V('entry.lock');
  },

  basic({ w, p, m, aim, target }) {
    const aspd = m.aspd();
    p.after(w, V('basic.windup') / aspd, () => {
      const run = w.run;
      const multi = db.upgrade('roa_multi');
      const count = 1 + run.lv('roa_multi') * multi.v1;
      const spread = deg(multi.v2);
      const chain = run.lv('roa_chain');
      const cu = db.upgrade('roa_chain');
      for (let i = 0; i < count; i++) {
        w.shoot({
          x: p.x + Math.cos(aim) * 18,
          y: p.y + Math.sin(aim) * 18,
          angle: aim + (i - (count - 1) / 2) * spread,
          speed: V('basic.speed'),
          range: V('basic.range') * m.stats.range,
          r: V('basic.radius'),
          look: 'talisman',
          color: COLOR,
          weapon: true,
          homing: V('basic.turn'),
          target,
          hit: { m, mult: V('basic.dmg') / 100, kind: 'basic', knock: 10 },
          // 연쇄 부적: 전이 상태의 다른 적에게 이어진다
          onHitEnemy:
            chain > 0
              ? (e) => {
                  const done = new Set([e]);
                  let from = e;
                  for (let n = 0; n < chain; n++) {
                    const next = w.nearestEnemy(from.x, from.y, cu.v2, (o) => !done.has(o) && o.hasDebuff('shock'));
                    if (!next) break;
                    done.add(next);
                    w.fx.bolt(from.x, from.y, next.x, next.y, COLOR, from.r, next.r);
                    w.hit(next, { m, mult: ((V('basic.dmg') / 100) * cu.v1) / 100, kind: 'proc', noCrit: true }, from.x, from.y);
                    from = next;
                  }
                }
              : undefined,
        });
      }
    });
    return V('basic.interval') / aspd;
  },

  active({ w, p, m, aim, target }) {
    const run = w.run;
    const wideLv = run.lv('roa_ward_wide');
    const wide = db.upgrade('roa_ward_wide');
    const r = V('active.radius') * (1 + (wideLv * wide.v1) / 100);
    const tick = V('active.tick');
    const healPerSec = (V('active.heal') + run.lv('roa_heal') * db.upgrade('roa_heal').v1) / 100;
    w.addZone({
      look: 'ward',
      team: 'party',
      x: target ? target.x : p.x + Math.cos(aim) * V('active.castRange'),
      y: target ? target.y : p.y + Math.sin(aim) * V('active.castRange'),
      r,
      dur: V('active.duration') + wideLv * wide.v2,
      color: COLOR,
      tick,
      onTick: (z) => {
        // 결계 안의 적에게 피해 (자연 속성이므로 전이가 붙는다), 필드 캐릭터 회복
        w.areaHit(z.x, z.y, z.r, { m, mult: V('active.dmg') / 100, kind: 'active' });
        const party = w.party;
        if (Math.hypot(party.x - z.x, party.y - z.y) <= z.r) {
          w.heal(party.active, party.active.stats.maxHp * healPerSec * tick);
        }
      },
    });
    return V('active.lock');
  },

  ult({ w, p, m }) {
    // 백귀 진혼: 팀을 회복·강화하고, 주변의 모든 적에게 혼령 표식을 붙인다. 표식은 잠시 뒤 한꺼번에 터진다.
    // 범위 폭발이 아니라 표식이 붙은 적만 맞으므로, 적이 어디에 흩어져 있든 같다
    w.after(V('ult.windup'), () => {
      if (m.dead) return;
      const range = V('ult.range');
      const delay = V('ult.delay');
      w.fx.play('roa.ult.cast', p.x, p.y, { size: range, color: COLOR });
      for (const mem of p.members) {
        if (mem.dead) continue;
        w.heal(mem, (mem.stats.maxHp * V('ult.heal')) / 100);
        mem.addBuff({ id: 'roa_ult', label: '진혼', dur: V('ult.buffDur'), atk: V('ult.buff') / 100, key: true });
      }
      const marked = w.enemies.filter((e) => !e.dead && Math.hypot(e.x - p.x, e.y - p.y) <= range + e.r);
      for (const e of marked) {
        w.fx.label(e.x, e.y, '혼령', COLOR, e.r * 2 + 14);
        w.fx.play('roa.ult.mark', e.x, e.y, { size: e.r, dur: delay, color: COLOR });
      }
      w.after(delay, () => {
        let any = false;
        for (const e of marked) {
          if (e.dead) continue;
          any = true;
          w.fx.play('roa.ult.boom', e.x, e.y, { size: e.r, color: COLOR });
          w.hit(e, { m, mult: V('ult.dmg') / 100, kind: 'ult' });
        }
        if (any) w.fx.shake(8);
      });
    });
    return V('ult.lock');
  },

  // 수호 부적: 오프 필드일 때 필드 캐릭터를 조금씩 회복시킨다
  update(w, _m, dt, onField) {
    if (onField) return;
    const lv = w.run.lv('roa_guard');
    if (lv <= 0) return;
    const a = w.party.active;
    a.heal(((a.stats.maxHp * lv * db.upgrade('roa_guard').v1) / 100) * dt);
  },

  // 패시브 "가호": 오프 필드일 때 필드 캐릭터가 받는 피해 감소
  aura(_m, aura) {
    aura.guard += V('passive.guard') / 100;
  },
};
