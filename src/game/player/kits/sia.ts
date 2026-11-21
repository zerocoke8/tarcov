// 키온 — A급 / 지원 / 형상 / 활
// 기본 공격: 단일 화살 투사체 · 액티브: 범위 화살비 · 궁극기: 만월의 화살
//
// 고유 성장 중 능력치만 바뀌는 것(화살비 강화의 쿨타임)은 run/stats.ts에 있다.
import { deg } from '../../../core/math';
import { db } from '../../../data/tables';
import type { World } from '../../world/World';
import type { Kit } from '../kit';
import type { Member } from '../Member';

const V = (k: string): number => db.sv(`sia.${k}`);
const COLOR = 0xbfd4ff;

/** 화살비를 (x, y)에 내린다. power는 위력 배율 */
function rain(w: World, m: Member, x: number, y: number, power: number): void {
  // 화살비 강화: 범위 증가
  const lv = w.run.lv('sia_rain');
  const r = V('active.radius') * (1 + (lv * db.upgrade('sia_rain').v1) / 100);
  w.addZone({
    look: 'rain',
    team: 'party',
    x,
    y,
    r,
    dur: V('active.duration'),
    color: COLOR,
    tick: V('active.tick'),
    onTick: (z) => {
      w.areaHit(z.x, z.y, z.r, { m, mult: (V('active.dmg') / 100) * power, kind: 'active' });
    },
  });
}

export const sia: Kit = {
  color: COLOR,

  // 등장 기술 "물러나며 쏘기": 뒤로 미끄러지며 적을 꿰뚫는 화살을 한 발 쏜다
  entry({ w, p, m, aim }) {
    // 겨눈 쪽 앞에서 나타나 제자리까지 물러난다 (보이기만 그렇다. 위치는 처음부터 제자리다)
    p.enterDir = aim + Math.PI;
    p.after(w, V('entry.windup'), () => {
      w.fx.play('entry.sia', p.x, p.y, { angle: aim, color: COLOR, at: 'weapon' });
      w.shoot({
        x: p.x + Math.cos(aim) * 18,
        y: p.y + Math.sin(aim) * 18,
        angle: aim,
        speed: V('entry.speed'),
        range: V('basic.range') * m.stats.range,
        r: V('entry.radius'),
        look: 'arrow',
        color: COLOR,
        weapon: true,
        pierce: -1,
        hit: { m, mult: V('entry.dmg') / 100, kind: 'proc', knock: V('entry.knock') },
      });
    });
    return V('entry.lock');
  },

  basic({ w, p, m, aim }) {
    const aspd = m.aspd();
    p.after(w, V('basic.windup') / aspd, () => {
      const run = w.run;
      const multi = db.upgrade('sia_multi');
      const count = 1 + run.lv('sia_multi') * multi.v1;
      const spread = deg(multi.v2);
      const pierce = run.lv('sia_pierce') * db.upgrade('sia_pierce').v1;
      const bounce = run.lv('sia_bounce') * db.upgrade('sia_bounce').v1;
      const markLv = run.lv('sia_mark');
      const mark = db.upgrade('sia_mark');
      for (let i = 0; i < count; i++) {
        w.shoot({
          x: p.x + Math.cos(aim) * 18,
          y: p.y + Math.sin(aim) * 18,
          angle: aim + (i - (count - 1) / 2) * spread,
          speed: V('basic.speed'),
          range: V('basic.range') * m.stats.range,
          r: V('basic.radius'),
          look: 'arrow',
          color: COLOR,
          weapon: true,
          pierce,
          bounce,
          hit: { m, mult: V('basic.dmg') / 100, kind: 'basic', knock: 20 },
          // 사냥 표식: 적중한 적이 받는 피해 증가
          onHitEnemy: markLv > 0 ? (e) => e.addDebuff('mark', mark.v2, (markLv * mark.v1) / 100) : undefined,
        });
      }
    });
    return V('basic.interval') / aspd;
  },

  active({ w, p, m, aim, target }) {
    // 조준된 적이 있으면 그 자리에, 없으면 조준 방향 앞쪽에 놓는다
    const x = target ? target.x : p.x + Math.cos(aim) * V('active.castRange');
    const y = target ? target.y : p.y + Math.sin(aim) * V('active.castRange');
    rain(w, m, x, y, 1);
    return V('active.lock');
  },

  ult({ w, p, m, aim }) {
    w.after(V('ult.windup'), () => {
      if (m.dead) return;
      w.fx.shake(8);
      w.fx.play('sia.ult.cast', p.x, p.y, { angle: aim, color: COLOR, at: 'weapon' });
      w.shoot({
        angle: aim,
        speed: V('ult.speed'),
        range: V('ult.range'),
        r: V('ult.radius'),
        look: 'bigarrow',
        color: COLOR,
        weapon: true,
        pierce: -1,
        wall: false,
        hit: { m, mult: V('ult.dmg') / 100, kind: 'ult', knock: 80 },
        onHitEnemy: (e) => e.addDebuff('mark', V('ult.markDur'), V('ult.mark') / 100),
      });
    });
    return V('ult.lock');
  },

  // 원호 사격: 오프 필드일 때 주기적으로 가장 가까운 적에게 화살비를 자동 발동
  update(w, m, dt, onField) {
    const lv = w.run.lv('sia_support');
    if (lv <= 0 || onField) return;
    const u = db.upgrade('sia_support');
    m.vars.support = (m.vars.support ?? 0) + dt;
    if (m.vars.support < u.v1 - u.v3 * (lv - 1)) return;
    const p = w.party;
    const t = w.nearestEnemy(p.x, p.y, 520, (e) => e.aggro);
    if (!t) return;
    m.vars.support = 0;
    rain(w, m, t.x, t.y, (u.v2 + V('support.powerPerLevel') * (lv - 1)) / 100);
    w.fx.label(t.x, t.y, '원호 사격', COLOR, 60);
  },

  // 패시브: 오프 필드일 때 필드 캐릭터의 치명타 확률 증가
  aura(_m, aura) {
    aura.crit += V('passive.crit') / 100;
  },
};
