// 에트나 — A급 / 리더 / 실체 / 대검
// 기본 공격: 대검 3연격 (부채꼴 근접 범위) · 액티브: 검기 사출 · 궁극기: 붕괴 일섬
//
// 고유 성장 중 능력치만 바뀌는 것(쾌속 검기, 난전의 발놀림, 대검 확장, 일격필살의 쿨타임)은 run/stats.ts에 있다.
import { deg } from '../../../core/math';
import { db } from '../../../data/tables';
import type { World } from '../../world/World';
import type { Kit } from '../kit';
import { rushIn } from './entry';

const V = (k: string): number => db.sv(`serin.${k}`);
const COLOR = 0xffc2c9;

/** 일격필살: 검기·궁극기 피해 배율 */
const heavy = (w: World): number => 1 + (w.run.lv('serin_heavy') * db.upgrade('serin_heavy').v1) / 100;

export const serin: Kit = {
  color: COLOR,

  // 등장 기술 "강습": 적 앞으로 뛰어들며 대검을 크게 내려벤다
  entry(c) {
    const { w, p, m, aim } = c;
    const windup = V('entry.windup');
    rushIn(c, V('entry.standoff'), windup);
    // 크게 휘두르는 3타의 그림을 쓴다. 다음 기본 공격은 1타부터 다시 시작한다
    m.combo = 3;
    m.comboT = V('entry.lock') + 0.3;
    p.after(w, windup, () => {
      const reach = V('entry.reach');
      const arc = deg(V('entry.arc'));
      w.fx.play('entry.serin', p.x, p.y, { angle: aim, size: reach, arc, color: COLOR });
      w.fx.shake(4);
      w.meleeArc(p.x, p.y, aim, reach, arc, { m, mult: V('entry.dmg') / 100, kind: 'proc', knock: V('entry.knock') });
    });
    return V('entry.lock');
  },

  basic({ w, p, m, aim }) {
    const third = m.combo % 3 === 2;
    const aspd = m.aspd();
    const windup = V('basic.windup') / aspd;
    const interval = (third ? V('basic.interval3') : V('basic.interval')) / aspd;
    const reach = (third ? V('basic.reach3') : V('basic.reach')) * m.stats.range;
    const arc = deg(third ? V('basic.arc3') : V('basic.arc'));
    const mult = (third ? V('basic.dmg3') : V('basic.dmg1')) / 100;
    const knock = third ? V('basic.knock3') : V('basic.knock');

    p.force(aim, V('basic.lunge'), windup);
    p.after(w, windup, () => {
      if (db.P('fx.basicRange')) w.fx.slash(p.x, p.y, aim, reach, arc, COLOR, third);
      const n = w.meleeArc(p.x, p.y, aim, reach, arc, { m, mult, kind: 'basic', knock });
      if (third && n > 0) {
        w.fx.shake(3);
        // 패시브: 3타 적중 시 액티브 쿨타임 감소
        m.reduceCooldown(V('passive.cdr'));
      }
      // 검풍: 3타(Lv2는 매 타)에 관통 발사체 추가
      const wind = w.run.lv('serin_wind');
      if (wind >= 2 || (wind === 1 && third)) {
        const u = db.upgrade('serin_wind');
        w.shoot({
          angle: aim,
          speed: 800,
          range: u.v2,
          r: 22,
          look: 'wave',
          color: COLOR,
          pierce: -1,
          hit: { m, mult: u.v1 / 100, kind: 'basic' },
        });
      }
      // 전투 고양: 적중 시 공속·이속 증가
      const haste = w.run.lv('serin_haste');
      if (haste > 0 && n > 0) {
        const u = db.upgrade('serin_haste');
        const v = (haste * u.v1) / 100;
        m.addBuff({ id: 'serin_haste', label: '고양', dur: u.v2, aspd: v, speed: v });
      }
    });
    m.combo++;
    m.comboT = interval + 0.7;
    return interval;
  },

  active({ w, p, m, aim }) {
    p.after(w, V('active.windup'), () => {
      w.fx.play('serin.wave', p.x, p.y, { angle: aim, color: COLOR, size: 120, arc: deg(150) });
      // 다중 검기: 부채꼴로 여러 발
      const u = db.upgrade('serin_wave_count');
      const count = 1 + w.run.lv('serin_wave_count') * u.v1;
      const spread = deg(u.v2);
      for (let i = 0; i < count; i++) {
        w.shoot({
          angle: aim + (i - (count - 1) / 2) * spread,
          speed: V('active.speed'),
          range: V('active.range'),
          r: V('active.radius'),
          look: 'wave',
          color: COLOR,
          pierce: -1,
          hit: { m, mult: (V('active.dmg') / 100) * heavy(w), kind: 'active', knock: 60 },
        });
      }
    });
    return V('active.lock');
  },

  ult({ w, p, m, aim }) {
    // 붕괴 일섬: 대검을 내리꽂아 전방으로 길게 뻗는 균열을 낸다. 균열은 잠시 남아 그 위의 적을 계속 벤다.
    // (궁극기는 시전하면 끊기지 않는다)
    const len = V('ult.length');
    const half = V('ult.half');
    w.after(V('ult.windup'), () => {
      if (m.dead) return;
      const x1 = p.x;
      const y1 = p.y;
      const x2 = x1 + Math.cos(aim) * len;
      const y2 = y1 + Math.sin(aim) * len;
      w.fx.shake(12);
      // 균열이 앞으로 뻗어 나가며 불기둥이 솟는 연출
      w.fx.play('serin.ult', x1, y1, { x2, y2, size: half, color: COLOR });
      w.lineHit(x1, y1, x2, y2, half, { m, mult: (V('ult.dmg') / 100) * heavy(w), kind: 'ult', knock: 120, stun: V('ult.stun') });
      w.addZone({
        look: 'fissure',
        team: 'party',
        x: x1,
        y: y1,
        x2,
        y2,
        half: half * 0.7,
        r: 0,
        dur: V('ult.fissureDur'),
        color: COLOR,
        tick: V('ult.fissureTick'),
        onTick: (z) => {
          w.lineHit(z.x, z.y, z.x2 ?? z.x, z.y2 ?? z.y, z.half ?? half, { m, mult: (V('ult.fissureDmg') / 100) * heavy(w), kind: 'ult' });
        },
      });
    });
    return V('ult.lock');
  },
};
