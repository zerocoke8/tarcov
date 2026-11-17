// 미니맵(HUD ⑧)과 상세 맵. 지나간 곳만 밝혀진다.
import type { World } from '../game/world/World';
import { TILE } from '../game/world/layout';

const COLOR = {
  bg: '#0f0e19',
  floor: '#6d6893',
  wall: '#2a2740',
  prop: '#454162',
  party: '#ffffff',
  enemy: '#ff5a6a',
  exit: '#7fe3ff',
  exitLocked: '#8a86a3',
  chest: '#ffd45a',
  search: '#7dff9b',
  npc: '#fff2a8',
};

function thingColor(kind: string, locked: boolean): string {
  if (kind === 'exit') return locked ? COLOR.exitLocked : COLOR.exit;
  if (kind === 'chest') return COLOR.chest;
  if (kind === 'npc') return COLOR.npc;
  return COLOR.search;
}

/**
 * 맵을 그린다.
 * @param cell 한 칸의 픽셀 크기
 * @param ox,oy 캔버스 왼쪽 위에 놓일 월드 칸 좌표 (소수 가능)
 */
function drawMap(ctx: CanvasRenderingContext2D, w: World, cell: number, ox: number, oy: number, cw: number, ch: number): void {
  const plan = w.plan;
  const base = plan.layout.base;
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, cw, ch);
  const x0 = Math.max(0, Math.floor(ox));
  const y0 = Math.max(0, Math.floor(oy));
  const x1 = Math.min(plan.w - 1, Math.ceil(ox + cw / cell));
  const y1 = Math.min(plan.h - 1, Math.ceil(oy + ch / cell));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * plan.w + x;
      if (!w.explored[i]) continue;
      ctx.fillStyle = base[i] === 1 ? COLOR.wall : plan.solid[i] ? COLOR.prop : COLOR.floor;
      ctx.fillRect(Math.floor((x - ox) * cell), Math.floor((y - oy) * cell), Math.ceil(cell), Math.ceil(cell));
    }
  }
  const dot = (wx: number, wy: number, r: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc((wx / TILE - ox) * cell, (wy / TILE - oy) * cell, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const seen = (wx: number, wy: number): boolean =>
    w.explored[Math.floor(wy / TILE) * plan.w + Math.floor(wx / TILE)] === 1;

  // 팀 공통 장비 스킬 "탐지 귀걸이": 가 보지 않은 곳의 것도 표시한다 (1 수색·NPC, 2 +몬스터, 3 +출구)
  const radar = w.radar;
  for (const t of w.things) {
    if (t.done && t.kind !== 'exit') continue;
    const detected = t.kind === 'exit' ? radar >= 3 : t.kind !== 'chest' && radar >= 1;
    if (!detected && !seen(t.x, t.y)) continue;
    dot(t.x, t.y, Math.max(2.5, cell * 0.55), thingColor(t.kind, t.locked));
  }
  for (const e of w.enemies) {
    if (e.dead || (radar < 2 && !seen(e.x, e.y))) continue;
    dot(e.x, e.y, Math.max(1.8, cell * (e.def.size === 'S' ? 0.35 : 0.6)), COLOR.enemy);
  }
  // 현재 위치와 방향
  const p = w.party;
  const px = (p.x / TILE - ox) * cell;
  const py = (p.y / TILE - oy) * cell;
  const s = Math.max(4, cell * 0.9);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(p.facing);
  ctx.fillStyle = COLOR.party;
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.7, s * 0.7);
  ctx.lineTo(-s * 0.3, 0);
  ctx.lineTo(-s * 0.7, -s * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export class Minimap {
  private ctx: CanvasRenderingContext2D;
  private size = 150;

  constructor(private canvas: HTMLCanvasElement) {
    canvas.width = canvas.height = this.size;
    this.ctx = canvas.getContext('2d')!;
  }

  /** 플레이어를 가운데 두고 주변만 그린다 */
  draw(w: World): void {
    const cell = 5.5;
    const span = this.size / cell;
    drawMap(this.ctx, w, cell, w.party.x / TILE - span / 2, w.party.y / TILE - span / 2, this.size, this.size);
  }
}

/** 상세 맵: 맵 전체를 캔버스에 맞춰 그린다 */
export function drawFullMap(canvas: HTMLCanvasElement, w: World): void {
  const plan = w.plan;
  const maxW = 900;
  const maxH = 520;
  const cell = Math.floor(Math.min(maxW / plan.w, maxH / plan.h));
  canvas.width = plan.w * cell;
  canvas.height = plan.h * cell;
  drawMap(canvas.getContext('2d')!, w, cell, 0, 0, canvas.width, canvas.height);
}
