// 로아 — S급 / 지원 / 자연 / 부적
// 기본 공격: 유도 부적 · 액티브: 정화 결계 (회복 + 피해) · 궁극기: 백귀 진혼
import { deg } from '../../../core/math';
import { db } from '../../../data/tables';
import type { Kit } from '../kit';

const V = (k: string): number => db.sv(`roa.${k}`);
const COLOR = 0xffe9a8;

export const roa: Kit = {
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
                    w.fx.bolt(from.x, from.y - from.r, next.x, next.y - next.r, COLOR);
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
    w.after(V('ult.windup'), () => {
      if (m.dead) return;
      const range = V('ult.range');
      w.fx.ring(p.x, p.y, range, COLOR, 0.6);
      w.fx.blast(p.x, p.y, 200, COLOR, 0.5);
      w.fx.shake(8);
      for (const mem of p.members) {
        if (mem.dead) continue;
        w.heal(mem, (mem.stats.maxHp * V('ult.heal')) / 100);
        mem.addBuff({ id: 'roa_ult', label: '진혼', dur: V('ult.buffDur'), atk: V('ult.buff') / 100 });
      }
      w.areaHit(p.x, p.y, range, { m, mult: V('ult.dmg') / 100, kind: 'ult' });
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
