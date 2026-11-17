// 섹터의 고정 지형(바닥, 벽)과 무작위 배치된 엄폐 오브젝트를 그린다.
// 비스듬한 탑다운: 벽과 오브젝트는 위쪽으로 높이만큼 올려 그려 입체감을 준다.
import { Container, Graphics } from 'pixi.js';
import { shade } from '../core/math';
import { TILE } from '../game/world/layout';
import type { Prop, SectorPlan } from '../game/world/placement';

const WALL_H = 44;

const C = {
  void: 0x0c0b14,
  floor: 0x4b4569,
  grout: 0x3b3656,
  roof: 0x2b2842,
  roofEdge: 0x45406a,
  wallFace: 0x1c1a2d,
  window: 0xffd98a,
};

/** 칸 좌표로 정해지는 0~1 사이의 고정 난수 (같은 맵은 항상 같은 무늬가 나오게) */
function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function buildMapView(plan: SectorPlan, ground: Container, objects: Container): void {
  const { w, h, layout } = plan;
  const isWall = (x: number, y: number): boolean => x < 0 || y < 0 || x >= w || y >= h || layout.base[y * w + x] === 1;

  // --- 바닥 ---
  const floor = new Graphics();
  floor.rect(-TILE * 12, -TILE * 12, (w + 24) * TILE, (h + 24) * TILE).fill(C.roof);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isWall(x, y)) continue;
      const n = hash(x, y);
      floor.rect(x * TILE, y * TILE, TILE, TILE).fill(shade(C.floor, (n - 0.5) * 0.14));
    }
  }
  // 줄눈
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isWall(x, y)) continue;
      floor.rect(x * TILE, y * TILE, TILE, 2).fill({ color: C.grout, alpha: 0.7 });
      floor.rect(x * TILE, y * TILE, 2, TILE).fill({ color: C.grout, alpha: 0.7 });
      // 가끔 맨홀·얼룩
      const n = hash(x + 91, y + 17);
      if (n > 0.965) floor.circle((x + 0.5) * TILE, (y + 0.5) * TILE, 15).fill({ color: 0x2f2b47, alpha: 0.8 });
      else if (n < 0.05) floor.ellipse((x + 0.4) * TILE, (y + 0.6) * TILE, 20, 11).fill({ color: 0x3d3860, alpha: 0.6 });
    }
  }
  ground.addChild(floor);

  // --- 벽: 줄 단위로 묶어 세로 위치에 따라 앞뒤가 정해지게 한다 ---
  for (let y = 0; y < h; y++) {
    let any = false;
    const g = new Graphics();
    for (let x = 0; x < w; x++) {
      if (!isWall(x, y)) continue;
      any = true;
      const px = x * TILE;
      const top = y * TILE - WALL_H;
      g.rect(px, top, TILE, TILE).fill(C.roof);
      if (!isWall(x, y - 1)) g.rect(px, top, TILE, 3).fill(C.roofEdge);
      if (!isWall(x - 1, y)) g.rect(px, top, 3, TILE).fill(C.roofEdge);
      if (!isWall(x + 1, y)) g.rect(px + TILE - 3, top, 3, TILE).fill(C.roofEdge);
      if (!isWall(x, y + 1)) {
        // 아래쪽이 바닥이면 벽의 앞면이 보인다
        g.rect(px, top + TILE, TILE, WALL_H).fill(C.wallFace);
        g.rect(px, top + TILE, TILE, 3).fill(C.roofEdge);
        const n = hash(x + 7, y + 3);
        if (n > 0.72) {
          g.rect(px + 14, top + TILE + 12, 14, 16).fill({ color: C.window, alpha: 0.35 + n * 0.4 });
          if (n > 0.86) g.rect(px + 38, top + TILE + 12, 14, 16).fill({ color: C.window, alpha: 0.5 });
        }
      }
    }
    if (!any) {
      g.destroy();
      continue;
    }
    g.zIndex = (y + 1) * TILE;
    objects.addChild(g);
  }

  for (const p of plan.props) objects.addChild(drawProp(p));
}

/** 윗면과 앞면이 보이는 상자 */
function box(g: Graphics, x: number, y: number, w: number, d: number, hgt: number, top: number, front: number): void {
  g.rect(x, y + d - hgt, w, hgt).fill(front);
  g.rect(x, y - hgt, w, d).fill(top);
  g.rect(x, y - hgt, w, 2).fill({ color: 0xffffff, alpha: 0.12 });
}

function drawProp(p: Prop): Graphics {
  const g = new Graphics();
  const x0 = p.tx * TILE;
  const y0 = p.ty * TILE;
  const pw = p.tw * TILE;
  const ph = p.th * TILE;
  // 바닥 그림자
  g.rect(x0 + 4, y0 + 6, pw - 8, ph - 4).fill({ color: 0x000000, alpha: 0.28 });
  const v = p.variant;

  switch (p.kind) {
    case 'crate': {
      const top = [0x8d6c4b, 0x7c6a52, 0x96754a, 0x6f5d48][v % 4];
      box(g, x0 + 7, y0 + 8, pw - 14, ph - 16, 34, top, shade(top, -0.3));
      g.rect(x0 + 7, y0 + 8 - 34 + (ph - 16) / 2 - 1, pw - 14, 2).fill({ color: 0x000000, alpha: 0.2 });
      break;
    }
    case 'crates': {
      const a = [0x8d6c4b, 0x7c6a52, 0x96754a, 0x6f5d48][v % 4];
      const b = [0x7c6a52, 0x96754a, 0x6f5d48, 0x8d6c4b][v % 4];
      if (p.tw >= p.th) {
        box(g, x0 + 6, y0 + 9, pw / 2 - 8, ph - 18, 30, a, shade(a, -0.3));
        box(g, x0 + pw / 2 + 2, y0 + 7, pw / 2 - 8, ph - 14, 42, b, shade(b, -0.3));
      } else {
        box(g, x0 + 8, y0 + 7, pw - 16, ph / 2 - 10, 40, b, shade(b, -0.3));
        box(g, x0 + 6, y0 + ph / 2 + 4, pw - 12, ph / 2 - 12, 30, a, shade(a, -0.3));
      }
      break;
    }
    case 'barrel': {
      const top = [0x4f6f8a, 0x8a5a4f, 0x5a7a5f, 0x77708f][v % 4];
      g.rect(x0 + 14, y0 + 30 - 36, pw - 28, 36).fill(shade(top, -0.3));
      g.ellipse(x0 + pw / 2, y0 + 30, (pw - 28) / 2, 9).fill(shade(top, -0.3));
      g.ellipse(x0 + pw / 2, y0 + 30 - 36, (pw - 28) / 2, 9).fill(top);
      break;
    }
    case 'vending': {
      const body = [0x3a6ea5, 0xa5443a, 0x3a9a78, 0x7a56a8][v % 4];
      box(g, x0 + 9, y0 + 14, pw - 18, ph - 26, 64, shade(body, 0.1), body);
      // 불 켜진 진열창
      g.rect(x0 + 14, y0 + ph - 12 - 56, pw - 28, 30).fill({ color: 0xcfeeff, alpha: 0.85 });
      g.rect(x0 + 14, y0 + ph - 12 - 20, pw - 28, 6).fill({ color: 0x15131f, alpha: 0.7 });
      break;
    }
    case 'planter': {
      box(g, x0 + 6, y0 + 12, pw - 12, ph - 24, 18, 0x5d5a75, 0x45425c);
      for (let i = 0; i < p.tw * 2; i++) {
        const cx = x0 + 20 + i * ((pw - 40) / Math.max(1, p.tw * 2 - 1));
        g.circle(cx, y0 + ph / 2 - 24, 15).fill(i % 2 ? 0x3f7a55 : 0x4b8a5f);
      }
      break;
    }
    case 'container': {
      const top = [0x35607a, 0x8a3d3d, 0x3d7a52, 0x7a6a35][v % 4];
      box(g, x0 + 5, y0 + 8, pw - 10, ph - 14, 54, top, shade(top, -0.32));
      for (let i = 1; i < 6; i++) {
        g.rect(x0 + 5 + (i * (pw - 10)) / 6, y0 + ph - 6 - 54, 2, 54).fill({ color: 0x000000, alpha: 0.22 });
      }
      break;
    }
    case 'car': {
      const body = [0x6b6f80, 0x8a3a44, 0x3a5f8a, 0x8a7d3a][v % 4];
      // 차체
      g.roundRect(x0 + 6, y0 + 26, pw - 12, ph - 34, 14).fill(shade(body, -0.35));
      g.roundRect(x0 + 6, y0 + 4, pw - 12, ph - 34, 14).fill(body);
      // 지붕과 유리
      g.roundRect(x0 + 44, y0 - 10, pw - 88, ph - 44, 10).fill(shade(body, 0.12));
      g.roundRect(x0 + 50, y0 + ph - 60, pw - 100, 14, 4).fill({ color: 0x9fd8ff, alpha: 0.55 });
      // 전조등
      g.rect(x0 + 10, y0 + ph - 26, 10, 6).fill(0xffe9a8);
      g.rect(x0 + pw - 20, y0 + ph - 26, 10, 6).fill(0xff6b6b);
      break;
    }
    case 'pillar': {
      box(g, x0 + 10, y0 + 12, pw - 20, ph - 22, 74, 0x7a7696, 0x54506e);
      g.rect(x0 + 6, y0 + ph - 16, pw - 12, 8).fill(0x45425c);
      break;
    }
  }
  g.zIndex = y0 + ph - 4;
  return g;
}
