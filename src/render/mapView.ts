// 섹터의 고정 지형(바닥, 벽)과 무작위 배치된 엄폐 오브젝트를 그린다.
// 비스듬한 탑다운: 벽과 오브젝트는 위쪽으로 높이만큼 올려 그려 입체감을 준다.
// 맵 그림(public/scenery/)이 읽혀 있으면 그림으로, 없으면 도형으로 그린다.
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js';
import { shade } from '../core/math';
import { TILE } from '../game/world/layout';
import type { Prop, SectorPlan } from '../game/world/placement';
import { scenery, type Scenery, type SceneryItem } from './scenery';

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

/**
 * @param glowTex 부드러운 빛 번짐 텍스처 (불 켜진 창문·자판기 주변의 빛에 쓴다)
 */
export function buildMapView(plan: SectorPlan, ground: Container, objects: Container, glowTex: Texture): void {
  const sc = scenery.get();
  if (sc) buildArtMap(plan, ground, objects, sc, glowTex);
  else buildShapeMap(plan, ground, objects);
}

// ---- 그림으로 그리는 맵 --------------------------------------------------------

/** 바닥 장식이 놓이는 칸의 비율 */
const FLOOR_DECAL_RATE = 0.085;
/** 벽 앞면에 장식(창문, 문 등)이 붙는 칸의 비율 */
const WALL_DECAL_RATE = 0.55;

function lightPool(tex: Texture, x: number, y: number, color: number, sx: number, sy: number, alpha: number): Sprite {
  const g = new Sprite(tex);
  g.anchor.set(0.5);
  g.position.set(x, y);
  g.scale.set(sx, sy);
  g.tint = color;
  g.alpha = alpha;
  g.blendMode = 'add';
  return g;
}

function buildArtMap(plan: SectorPlan, ground: Container, objects: Container, sc: Scenery, glowTex: Texture): void {
  const { w, h, layout } = plan;
  const isWall = (x: number, y: number): boolean => x < 0 || y < 0 || x >= w || y >= h || layout.base[y * w + x] === 1;
  const lights = new Container();

  // --- 바닥: 질감 한 장을 맵 전체에 반복해 깐다. 벽 칸은 지붕과 벽 앞면이 덮는다 ---
  ground.addChild(new Graphics().rect(-TILE * 12, -TILE * 12, (w + 24) * TILE, (h + 24) * TILE).fill(0x0b0a14));
  const floor = new TilingSprite({ texture: sc.ground, width: w * TILE, height: h * TILE });
  floor.tileScale.set(sc.groundSize / sc.ground.width);
  ground.addChild(floor);

  // 벽 바로 아래 바닥에 드리우는 그림자
  const shadow = new Graphics();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isWall(x, y) || !isWall(x, y - 1)) continue;
      shadow.rect(x * TILE, y * TILE, TILE, 10).fill({ color: 0x000000, alpha: 0.32 });
      shadow.rect(x * TILE, y * TILE + 10, TILE, 12).fill({ color: 0x000000, alpha: 0.18 });
      shadow.rect(x * TILE, y * TILE + 22, TILE, 14).fill({ color: 0x000000, alpha: 0.08 });
    }
  }
  ground.addChild(shadow);

  // 바닥 장식 (맨홀, 균열, 물웅덩이 …): 칸 좌표로 정해지므로 같은 맵은 항상 같은 자리에 놓인다
  if (sc.floorDecals.length) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (isWall(x, y) || hash(x + 91, y + 17) > FLOOR_DECAL_RATE) continue;
        // 바로 왼쪽·위 칸에 이미 장식이 있으면 겹쳐 보이므로 건너뛴다
        if ((!isWall(x - 1, y) && hash(x + 90, y + 17) <= FLOOR_DECAL_RATE) || (!isWall(x, y - 1) && hash(x + 91, y + 16) <= FLOOR_DECAL_RATE)) continue;
        const it = sc.floorDecals[Math.floor(hash(x + 5, y + 9) * sc.floorDecals.length)];
        // 한 칸보다 넓은 장식은 옆 칸도 바닥일 때만 놓는다
        if (it.w > TILE && (isWall(x + 1, y) || isWall(x - 1, y))) continue;
        const d = new Sprite(it.texture);
        d.anchor.set(0.5);
        d.width = it.w;
        d.height = it.h;
        d.position.set((x + 0.5) * TILE + (hash(x + 3, y + 31) - 0.5) * 18, (y + 0.5) * TILE + (hash(x + 41, y + 2) - 0.5) * 18);
        d.alpha = 0.9;
        ground.addChild(d);
      }
    }
  }
  ground.addChild(lights);

  // --- 벽: 줄 단위로 묶어 세로 위치에 따라 앞뒤가 정해지게 한다 ---
  const rn = sc.roof.length;
  const wn = sc.wall.length;
  for (let y = 0; y < h; y++) {
    let row: Container | null = null;
    const trim = new Graphics();
    const fronts: Sprite[] = [];
    for (let x = 0; x < w; x++) {
      if (!isWall(x, y)) continue;
      row ??= new Container();
      const px = x * TILE;
      const top = y * TILE - WALL_H;
      const roof = new Sprite(sc.roof[y % rn][x % rn]);
      roof.position.set(px, top);
      roof.width = TILE + 0.5;
      roof.height = TILE + 0.5;
      row.addChild(roof);
      // 지붕 가장자리 (난간)
      if (!isWall(x, y - 1)) trim.rect(px, top, TILE, 4).fill({ color: 0x5a5d80, alpha: 0.9 });
      if (!isWall(x - 1, y)) trim.rect(px, top, 4, TILE).fill({ color: 0x4a4d6e, alpha: 0.9 });
      if (!isWall(x + 1, y)) trim.rect(px + TILE - 4, top, 4, TILE).fill({ color: 0x4a4d6e, alpha: 0.9 });
      if (isWall(x, y + 1)) continue;

      // 아래쪽이 바닥이면 벽의 앞면이 보인다
      const face = new Sprite(sc.wall[x % wn]);
      face.position.set(px, top + TILE);
      face.width = TILE + 0.5;
      face.height = WALL_H;
      fronts.push(face);
      trim.rect(px, top + TILE - 3, TILE, 4).fill({ color: 0x6a6d92, alpha: 0.95 });
      trim.rect(px, top + TILE + 1, TILE, 7).fill({ color: 0x000000, alpha: 0.3 });
      trim.rect(px, top + TILE + WALL_H - 3, TILE, 3).fill({ color: 0x000000, alpha: 0.28 });

      if (!sc.wallDecals.length || hash(x + 7, y + 3) > WALL_DECAL_RATE) continue;
      const it = sc.wallDecals[Math.floor(hash(x + 13, y + 29) * sc.wallDecals.length)];
      const fit = Math.min(1, (WALL_H - 6) / it.h, (TILE - 6) / it.w);
      const dw = it.w * fit;
      const dh = it.h * fit;
      const d = new Sprite(it.texture);
      d.width = dw;
      d.height = dh;
      // 문과 셔터는 바닥에 붙이고, 나머지는 벽 가운데에 둔다
      const onGround = /door|shutter/.test(it.id);
      d.position.set(px + (TILE - dw) / 2, top + TILE + (onGround ? WALL_H - dh : (WALL_H - dh) / 2 + 1));
      fronts.push(d);
      if (it.glow !== null) {
        // 불 켜진 창문: 창 주변과 앞 바닥에 빛이 번진다
        fronts.push(lightPool(glowTex, px + TILE / 2, top + TILE + WALL_H / 2, it.glow, 0.55, 0.45, 0.3));
        lights.addChild(lightPool(glowTex, px + TILE / 2, (y + 1) * TILE + 30, it.glow, 1.25, 0.8, 0.26));
      }
    }
    if (!row) {
      trim.destroy();
      continue;
    }
    row.addChild(...fronts, trim);
    row.zIndex = (y + 1) * TILE;
    objects.addChild(row);
  }

  for (const p of plan.props) {
    const list = sc.props[`${p.kind}:${p.tw}x${p.th}`];
    if (!list?.length) {
      objects.addChild(drawProp(p));
      continue;
    }
    objects.addChild(artProp(p, list[p.variant % list.length], glowTex, lights));
  }
}

function artProp(p: Prop, it: SceneryItem, glowTex: Texture, lights: Container): Container {
  const x0 = p.tx * TILE;
  const y0 = p.ty * TILE;
  const pw = p.tw * TILE;
  const ph = p.th * TILE;
  const base = y0 + ph - 5;
  const c = new Container();
  c.addChild(new Graphics().ellipse(x0 + pw / 2, base - 3, pw * 0.46, Math.max(9, ph * 0.2)).fill({ color: 0x000000, alpha: 0.34 }));
  const s = new Sprite(it.texture);
  s.anchor.set(0.5, 1);
  s.width = it.w;
  s.height = it.h;
  s.position.set(x0 + pw / 2, base);
  c.addChild(s);
  if (it.glow !== null) lights.addChild(lightPool(glowTex, x0 + pw / 2, base + 6, it.glow, 1.5, 0.9, 0.3));
  c.zIndex = y0 + ph - 4;
  return c;
}

// ---- 도형으로 그리는 맵 (맵 그림이 없을 때) -----------------------------------

function buildShapeMap(plan: SectorPlan, ground: Container, objects: Container): void {
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
