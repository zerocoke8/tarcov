// 마름모(아이소메트릭) 화면의 맵을 그린다: 기울여 깐 바닥, 입체로 세운 벽, 벽 위의 구조물, 엄폐 오브젝트.
// 규칙 코드가 쓰는 맵(네모 격자)은 기존 화면과 똑같고, 여기서 보는 방식만 다르다 (render/proj.ts).
//
// 벽의 높이는 표시부가 정한다 (render/isoWalls.ts): 뒤쪽에 걸어 다니는 바닥이 없는 벽은 높이 세우고,
// 뒤쪽 가까이에 바닥이 있는 벽은 낮게 자른다. 그래서 무엇도 높은 벽에 가려지지 않는다.
// 벽 위에 서는 나무·건물도 뒤쪽의 바닥을 가리지 않는 자리에만 놓는다.
//
// 그림: 바닥·길·바닥 장식·엄폐 오브젝트는 기존 맵 그림(render/scenery.ts)을 그대로 쓰고,
// 높은 벽의 앞면과 구조물은 마름모 맵 그림(render/isoArt.ts)을 쓴다. 맵 그림이 없으면 도형으로 그린다.
import { Container, Graphics, Matrix, Sprite, TilingSprite, type Texture } from 'pixi.js';
import { shade } from '../core/math';
import { TILE } from '../game/world/layout';
import type { Prop, SectorPlan } from '../game/world/placement';
import { isoArt, type IsoArt, type IsoStruct } from './isoArt';
import { buildIsoWalls, ISO_LIFT, ISO_REACH, ISO_SX, ISO_SY, type IsoWalls } from './isoWalls';
import { ISO_A, ISO_B } from './proj';
import { scenery, type SceneryItem } from './scenery';

const T = TILE;
const SX = ISO_SX;
const SY = ISO_SY;
const LIFT = ISO_LIFT;
const REACH = ISO_REACH;
/** 벽 앞면 질감을 아래에서부터 얼마나 쓰는지: 낮은 벽은 밑동만 */
const FACE_PART = [0, 0.26, 1];
/** 맵 바깥으로 바닥 질감을 얼마나 더 까는지 (칸) */
const APRON = 34;

/** 바닥 장식이 놓이는 칸의 비율, 높은 벽 앞면에 장식이 붙는 칸의 비율 */
const FLOOR_DECAL_RATE = 0.085;
const WALL_DECAL_RATE = 0.3;

export interface IsoMapView {
  /** 필드 캐릭터(월드 좌표)를 가리는 오브젝트를 비쳐 보이게 한다 */
  update(px: number, py: number, dt: number): void;
}

/** 캐릭터를 가릴 수 있는 것: 화면에서 차지하는 상자와 앞뒤 순서 */
interface Cover {
  obj: Container;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  depth: number;
}

/** 칸 좌표로 정해지는 0~1 사이의 고정 난수 (같은 맵은 항상 같은 모습이 나오게) */
function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** 두 색을 섞는다 (t = 0이면 a, 1이면 b) */
function mixColor(a: number, b: number, t: number): number {
  const ch = (s: number): number => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** 칸 좌표(소수 가능) → 화면 좌표 */
const px = (cx: number, cy: number): number => (cx - cy) * SX;
const py = (cx: number, cy: number): number => (cx + cy) * SY;

const M = new Matrix();
/** 표시 객체에 변환 [a b c d tx ty]를 건다 (화면 x = a·u + c·v + tx, 화면 y = b·u + d·v + ty) */
function affine(o: Container, a: number, b: number, c: number, d: number, tx: number, ty: number): void {
  o.setFromMatrix(M.set(a, b, c, d, tx, ty));
}

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

/**
 * @param ground  바닥 층. 마름모 변환이 걸려 있어 월드 좌표를 그대로 쓴다
 * @param objects 앞뒤 순서로 정렬되는 층. 화면 좌표를 쓴다
 */
export function buildIsoMapView(plan: SectorPlan, ground: Container, objects: Container, glowTex: Texture, scene: string): IsoMapView {
  const sc = scenery.get();
  const art = isoArt.get(scene);
  const { w, h, layout } = plan;
  const covers: Cover[] = [];
  const walls = buildIsoWalls(w, h, layout.base);
  const { floorAt, at } = walls;
  const voidColor = sc?.voidColor ?? 0x0c0b14;

  /** 바닥에서 먼 것일수록 어둡게 해서 뒤로 물러나 보이게 한다: 0(바로 옆) ~ 1(가장 먼 곳) */
  const fade = (x: number, y: number): number => Math.max(0, Math.min(1, (walls.far(x, y) - 2) / (REACH - 2)));
  const tintOf = (base: number, k: number): number => mixColor(base, shade(voidColor, 0.1), k * 0.55);

  // ---- 바닥 ---------------------------------------------------------------
  const lights = new Container();
  ground.addChild(new Graphics().rect(-APRON * T * 2, -APRON * T * 2, (w + APRON * 4) * T, (h + APRON * 4) * T).fill(voidColor));
  if (sc) {
    const floor = new TilingSprite({ texture: sc.ground, width: (w + APRON * 2) * T, height: (h + APRON * 2) * T });
    floor.position.set(-APRON * T, -APRON * T);
    floor.tileScale.set(sc.groundSize / sc.ground.width);
    ground.addChild(floor);
  } else {
    const g = new Graphics();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (floorAt(x, y)) g.rect(x * T, y * T, T, T).fill(shade(0x4b4569, (hash(x, y) - 0.5) * 0.14));
    ground.addChild(g);
  }

  // 걸어 다니는 바닥이 아닌 곳은 어둡게 덮어 멀리 있는 땅처럼 보이게 한다 (벽이 서는 칸은 벽이 가린다)
  const dim = new Graphics();
  const dimFill = { color: voidColor, alpha: sc ? 0.62 : 1 };
  for (let y = -APRON; y < h + APRON; y++) {
    let run = -APRON;
    for (let x = -APRON; x <= w + APRON; x++) {
      if (x < w + APRON && !floorAt(x, y)) continue;
      if (x > run) dim.rect(run * T, y * T, (x - run) * T, T).fill(dimFill);
      run = x + 1;
    }
  }
  ground.addChild(dim);

  // 벽이 바닥에 드리우는 그림자. 빛은 화면 왼쪽 위에서 온다: 벽의 오른쪽 앞(+x)으로 길게, 왼쪽 앞(+y)으로는 벽에 붙은 만큼만
  const shadow = new Graphics();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!floorAt(x, y)) continue;
      const left = at(x - 1, y);
      if (left) {
        const len = left === 2 ? T * 1.15 : T * 0.3;
        shadow.rect(x * T, y * T, len, T).fill({ color: 0x000000, alpha: 0.2 });
        shadow.rect(x * T, y * T, len * 0.45, T).fill({ color: 0x000000, alpha: 0.16 });
      }
      if (at(x, y - 1)) {
        shadow.rect(x * T, y * T, T, 9).fill({ color: 0x000000, alpha: 0.24 });
        shadow.rect(x * T, y * T + 9, T, 10).fill({ color: 0x000000, alpha: 0.1 });
      }
    }
  }
  ground.addChild(shadow);

  if (sc) {
    // 길: 통로로 표시된 칸에 길 조각(노란 벽돌 등)을 깐다. 조각을 한 칸보다 조금 크게, 칸마다 다른 모양·방향으로 놓는다
    const onRoad = (x: number, y: number): boolean => sc.road.length > 0 && floorAt(x, y) && layout.road[y * w + x] === 1 && hash(x + 211, y + 97) < sc.roadChance;
    if (sc.road.length) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (!onRoad(x, y)) continue;
          const it = sc.road[Math.floor(hash(x + 57, y + 23) * sc.road.length)];
          const d = new Sprite(it.texture);
          d.anchor.set(0.5);
          d.width = it.w;
          d.height = it.h;
          d.rotation = Math.floor(hash(x + 19, y + 71) * 4) * (Math.PI / 2);
          d.position.set((x + 0.5) * T, (y + 0.5) * T);
          ground.addChild(d);
        }
      }
    }
    // 바닥 장식: 칸 좌표로 정해지므로 같은 맵은 항상 같은 자리에 놓인다
    if (sc.floorDecals.length) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (!floorAt(x, y) || onRoad(x, y) || hash(x + 91, y + 17) > FLOOR_DECAL_RATE) continue;
          if ((floorAt(x - 1, y) && hash(x + 90, y + 17) <= FLOOR_DECAL_RATE) || (floorAt(x, y - 1) && hash(x + 91, y + 16) <= FLOOR_DECAL_RATE)) continue;
          const it = sc.floorDecals[Math.floor(hash(x + 5, y + 9) * sc.floorDecals.length)];
          if (it.w > T && (!floorAt(x + 1, y) || !floorAt(x - 1, y))) continue;
          const d = new Sprite(it.texture);
          d.anchor.set(0.5);
          d.width = it.w;
          d.height = it.h;
          d.position.set((x + 0.5) * T + (hash(x + 3, y + 31) - 0.5) * 18, (y + 0.5) * T + (hash(x + 41, y + 2) - 0.5) * 18);
          d.alpha = 0.9;
          ground.addChild(d);
        }
      }
    }
  }
  ground.addChild(lights);

  // ---- 벽 -----------------------------------------------------------------
  // 같은 대각선(x + y 가 같은 칸들)은 화면에서 옆으로 나란하므로 한 묶음으로 만들고, 뒤의 대각선부터 그린다
  interface Row {
    box: Container;
    trim: Graphics;
    over: Container;
  }
  const rows = new Map<number, Row>();
  const rowOf = (d: number): Row => {
    let r = rows.get(d);
    if (!r) {
      r = { box: new Container(), trim: new Graphics(), over: new Container() };
      r.box.zIndex = (d + 1) * SY;
      rows.set(d, r);
    }
    return r;
  };
  const edge = sc?.edge ?? 0x45406a;
  const edgeLit = shade(edge, 0.22);
  const edgeDark = shade(edge, -0.25);

  for (let y = -REACH; y < h + REACH; y++) {
    for (let x = -REACH; x < w + REACH; x++) {
      const lv = at(x, y);
      if (!lv) continue;
      const L = LIFT[lv];
      const r = rowOf(x + y);
      const showLeft = at(x, y + 1) < lv;
      const showRight = at(x + 1, y) < lv;
      // 네 모서리 (N 뒤, E 오른쪽, S 앞, W 왼쪽)를 벽 높이만큼 올린 자리
      const nx = px(x, y);
      const ny = py(x, y) - L;
      const ex = px(x + 1, y);
      const ey = py(x + 1, y) - L;
      const sx = px(x + 1, y + 1);
      const sy = py(x + 1, y + 1) - L;
      const wx = px(x, y + 1);
      const wy = py(x, y + 1) - L;

      if (sc) {
        // 윗면: 지붕 질감을 바닥처럼 기울여 벽 높이에 놓는다
        const rn = sc.roof.length;
        const top = new Sprite(sc.roof[((y % rn) + rn) % rn][((x % rn) + rn) % rn]);
        const k = (T + 0.75) / top.texture.width;
        affine(top, ISO_A * k, ISO_B * k, -ISO_A * k, ISO_B * k, nx, ny);
        // 낮게 자른 벽의 윗면은 조금 어둡게 해서 높은 벽과 구분하고, 바닥에서 먼 윗면은 더 어둡게 한다
        top.tint = tintOf(lv === 1 ? 0xcfd2da : 0xffffff, fade(x, y));
        r.box.addChild(top);
        // 앞면: 왼쪽 앞(+y 쪽)과 오른쪽 앞(+x 쪽). 더 낮은 것과 맞닿은 쪽만 보인다
        const wn = sc.wall.length;
        if (showLeft) {
          const tex = art ? art.face(x, FACE_PART[lv]) : sc.wall[((x % wn) + wn) % wn];
          const f = new Sprite(tex);
          const ku = (T + 0.75) / tex.width;
          affine(f, ISO_A * ku, ISO_B * ku, 0, L / tex.height, wx, wy);
          r.box.addChild(f);
        }
        if (showRight) {
          const tex = art ? art.face(-y, FACE_PART[lv]) : sc.wall[((-y % wn) + wn) % wn];
          const f = new Sprite(tex);
          const ku = (T + 0.75) / tex.width;
          affine(f, ISO_A * ku, -ISO_B * ku, 0, L / tex.height, sx, sy);
          // 빛을 등진 면이라 어둡다
          f.tint = 0x9aa0b4;
          r.box.addChild(f);
        }
      } else {
        const g = r.trim;
        g.poly([nx, ny, ex, ey, sx, sy, wx, wy]).fill(lv === 2 ? 0x2b2842 : 0x34304e);
        if (showLeft) g.poly([wx, wy, sx, sy, sx, sy + L, wx, wy + L]).fill(0x24213a);
        if (showRight) g.poly([sx, sy, ex, ey, ex, ey + L, sx, sy + L]).fill(0x18162a);
      }

      // 윗면 가장자리: 앞면과 만나는 선은 밝게, 뒤쪽이 더 낮으면(뒤로 꺼진 가장자리) 가는 선만
      const g = r.trim;
      if (showLeft) {
        g.moveTo(wx, wy).lineTo(sx, sy).stroke({ color: edgeLit, width: 2.5, alpha: 0.95 });
        g.poly([wx, wy + 2, sx, sy + 2, sx, sy + 9, wx, wy + 9]).fill({ color: 0x000000, alpha: 0.22 });
        g.poly([wx, wy + L - 5, sx, sy + L - 5, sx, sy + L, wx, wy + L]).fill({ color: 0x000000, alpha: 0.25 });
      }
      if (showRight) {
        g.moveTo(sx, sy).lineTo(ex, ey).stroke({ color: edge, width: 2.5, alpha: 0.95 });
        g.poly([sx, sy + 2, ex, ey + 2, ex, ey + 9, sx, sy + 9]).fill({ color: 0x000000, alpha: 0.25 });
        g.poly([sx, sy + L - 5, ex, ey + L - 5, ex, ey + L, sx, sy + L]).fill({ color: 0x000000, alpha: 0.28 });
      }
      if (showLeft && showRight) g.moveTo(sx, sy).lineTo(sx, sy + L).stroke({ color: 0x000000, width: 2, alpha: 0.3 });
      if (at(x, y - 1) < lv) g.moveTo(nx, ny).lineTo(ex, ey).stroke({ color: edgeDark, width: 2, alpha: 0.8 });
      if (at(x - 1, y) < lv) g.moveTo(nx, ny).lineTo(wx, wy).stroke({ color: edgeDark, width: 2, alpha: 0.8 });

      // 높은 벽의 앞면 장식 (창문, 덩굴, 포스터 …). 벽 가운데 높이에, 벽면에 맞춰 기울여 붙인다
      if (!sc || lv !== 2 || !sc.wallDecals.length) continue;
      for (const side of [0, 1]) {
        if (side === 0 ? !showLeft : !showRight) continue;
        // 앞이 바닥일 때만 붙인다 (낮은 벽 뒤로 솟은 면은 아래가 가려져 어색하다)
        if (side === 0 ? !floorAt(x, y + 1) : !floorAt(x + 1, y)) continue;
        if (hash(x * 3 + 7 + side * 131, y * 3 + 3) > WALL_DECAL_RATE) continue;
        const it = sc.wallDecals[Math.floor(hash(x + 13 + side * 17, y + 29) * sc.wallDecals.length)];
        const fit = Math.min(1.5, (L * 0.5) / it.h, (T - 8) / it.w);
        const kx = (it.w * fit) / it.texture.width;
        const ky = (it.h * fit) / it.texture.height;
        // 문은 바닥에 붙이고, 나머지는 벽 가운데쯤에 둔다
        const onGround = /door|shutter|gate/.test(it.id);
        const up = onGround ? (it.h * fit) / 2 + 2 : L * 0.52;
        const cxs = side === 0 ? (wx + sx) / 2 : (sx + ex) / 2;
        const cys = (side === 0 ? (wy + sy) / 2 : (sy + ey) / 2) + L - up;
        const d = new Sprite(it.texture);
        const a = ISO_A * kx;
        const b = (side === 0 ? ISO_B : -ISO_B) * kx;
        affine(d, a, b, 0, ky, cxs - (a * it.texture.width) / 2, cys - (b * it.texture.width) / 2 - (ky * it.texture.height) / 2);
        if (side === 1) d.tint = 0xb4b8c8;
        r.over.addChild(d);
        if (it.glow !== null) {
          // 불 켜진 창문·등: 벽과 앞 바닥에 빛이 번진다
          r.over.addChild(lightPool(glowTex, cxs, cys, it.glow, 0.6, 0.6, 0.32));
          const fx = side === 0 ? (x + 0.5) * T : (x + 1.6) * T;
          const fy = side === 0 ? (y + 1.6) * T : (y + 0.5) * T;
          lights.addChild(lightPool(glowTex, fx, fy, it.glow, 1.5, 1.5, 0.24));
        }
      }
    }
  }
  for (const r of rows.values()) {
    r.box.addChild(r.trim, r.over);
    objects.addChild(r.box);
  }

  // ---- 벽 위의 구조물 (나무, 건물, 탑) --------------------------------------
  if (art) placeStructs(art, w, h, walls, (x, y) => tintOf(0xffffff, fade(x, y)), objects, glowTex);

  // ---- 엄폐 오브젝트 --------------------------------------------------------
  for (const p of plan.props) {
    const list = sc?.props[`${p.kind}:${p.tw}x${p.th}`];
    const cx = p.tx + p.tw / 2;
    const cy = p.ty + p.th / 2;
    // 바닥의 그림자는 바닥 층에 (바닥처럼 기운다)
    ground.addChild(new Graphics().ellipse((cx + 0.12) * T, cy * T, p.tw * T * 0.47, p.th * T * 0.47).fill({ color: 0x000000, alpha: 0.3 }));
    const depth = py(cx, cy) + SY * 0.35;
    if (!list?.length) {
      const g = shapeProp(p);
      g.zIndex = depth;
      objects.addChild(g);
      continue;
    }
    const it = list[p.variant % list.length];
    const s = propSprite(p, it);
    s.zIndex = depth;
    objects.addChild(s);
    if (it.glow !== null) lights.addChild(lightPool(glowTex, cx * T, cy * T, it.glow, 2.1, 2.1, 0.28));
    const b = s.getLocalBounds();
    covers.push({ obj: s, x0: s.x + b.minX, x1: s.x + b.maxX, y0: s.y + b.minY, y1: s.y + b.maxY, depth });
  }

  return {
    update(wx: number, wy: number, dt: number): void {
      // 캐릭터의 몸 가운데가 오브젝트의 그림 안에 들어가 있고 오브젝트가 더 앞에 있으면 비쳐 보이게 한다
      const x = (wx - wy) * ISO_A;
      const y = (wx + wy) * ISO_B;
      const k = Math.min(1, dt * 10);
      for (const c of covers) {
        const hide = c.depth > y && x > c.x0 + 6 && x < c.x1 - 6 && y - 30 > c.y0 && y - 30 < c.y1;
        const target = hide ? 0.4 : 1;
        if (c.obj.alpha !== target) c.obj.alpha = Math.abs(target - c.obj.alpha) < 0.02 ? target : c.obj.alpha + (target - c.obj.alpha) * k;
      }
    },
  };
}

/**
 * 엄폐 오브젝트를 세운다. 그림은 기존 화면용(정면에서 비스듬히 내려다본 그림)이다.
 * 한쪽으로 긴 것(울타리, 통나무, 수레)은 차지한 칸이 화면에서 대각선으로 놓이므로, 그림을 그 대각선에 맞춰 기울인다.
 */
function propSprite(p: Prop, it: SceneryItem): Container {
  const cx = p.tx + p.tw / 2;
  const cy = p.ty + p.th / 2;
  const c = new Container();
  const s = new Sprite(it.texture);
  const kx = it.w / it.texture.width;
  const ky = it.h / it.texture.height;
  if (p.tw === p.th) {
    // 정사각형으로 차지하는 것은 그대로 세운다. 밑동이 차지한 칸의 앞쪽 가까이에 오게 한다
    s.anchor.set(0.5, 1);
    s.scale.set(kx, ky);
    s.y = SY * p.tw * 0.62;
  } else {
    // 긴 변을 따라 기울인다: x 로 길면 오른쪽 아래로, y 로 길면 오른쪽 위로
    const along = p.tw > p.th;
    const a = ISO_A * kx;
    const b = (along ? ISO_B : -ISO_B) * kx;
    const wpx = it.texture.width;
    const hpx = it.texture.height;
    // 그림의 밑변 가운데가 차지한 칸의 가운데보다 조금 앞에 오게 한다
    affine(s, a, b, 0, ky, -(a * wpx) / 2, -(b * wpx) / 2 - ky * hpx + SY * Math.min(p.tw, p.th) * 0.5);
  }
  c.addChild(s);
  c.position.set(px(cx, cy), py(cx, cy));
  return c;
}

/** 맵 그림이 없을 때의 엄폐 오브젝트: 차지한 칸 위에 세운 상자 */
function shapeProp(p: Prop): Graphics {
  const g = new Graphics();
  const H = p.kind === 'pillar' ? 70 : p.kind === 'container' || p.kind === 'vending' ? 54 : 34;
  const color = [0x8d6c4b, 0x7c6a52, 0x96754a, 0x6f5d48][p.variant % 4];
  const m = 0.12;
  const x0 = p.tx + m;
  const y0 = p.ty + m;
  const x1 = p.tx + p.tw - m;
  const y1 = p.ty + p.th - m;
  g.poly([px(x0, y1), py(x0, y1) - H, px(x1, y1), py(x1, y1) - H, px(x1, y1), py(x1, y1), px(x0, y1), py(x0, y1)]).fill(shade(color, -0.2));
  g.poly([px(x1, y1), py(x1, y1) - H, px(x1, y0), py(x1, y0) - H, px(x1, y0), py(x1, y0), px(x1, y1), py(x1, y1)]).fill(shade(color, -0.4));
  g.poly([px(x0, y0), py(x0, y0) - H, px(x1, y0), py(x1, y0) - H, px(x1, y1), py(x1, y1) - H, px(x0, y1), py(x0, y1) - H]).fill(color);
  return g;
}

/**
 * 높은 벽 위에 구조물을 세운다. 칸 좌표의 고정 난수로 고르므로 같은 맵은 언제나 같은 모습이다.
 * 큰 것부터 자리를 잡고, 서로 겹치지 않게 한다. 뒤쪽에 걸어 다니는 바닥이 있어 그것을 가리게 되는 자리에는 놓지 않는다.
 * @param tint 그 칸에 선 것에 입힐 색 (바닥에서 멀수록 어둡다)
 */
function placeStructs(art: IsoArt, w: number, h: number, walls: IsoWalls, tint: (x: number, y: number) => number, objects: Container, glowTex: Texture): void {
  const used = new Set<number>();
  const key = (x: number, y: number): number => (y + 64) * 4096 + (x + 64);
  const fits = (s: IsoStruct, x: number, y: number): boolean => {
    for (let j = 0; j < s.th; j++) {
      for (let k = 0; k < s.tw; k++) {
        if (walls.at(x + k, y + j) !== 2 || used.has(key(x + k, y + j))) return false;
      }
    }
    // 구조물의 키만큼 더 뒤쪽까지, 그림의 폭만큼 옆까지 바닥이 없어야 한다 (있으면 그 바닥을 가린다)
    const steps = Math.ceil((LIFT[2] + s.h) / SY) + 2;
    const wide = Math.ceil(s.w / 2 / SX) + 1;
    return !walls.floorBehind(x + s.tw - 1, y + s.th - 1, steps, wide);
  };
  const order = art.structs
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s.tw * b.s.th - a.s.tw * a.s.th);
  for (const { s, i } of order) {
    for (let y = -REACH; y < h + REACH; y++) {
      for (let x = -REACH; x < w + REACH; x++) {
        // 얼마나 자주 서는지는 표(data/art/iso.csv 의 rate)에 적혀 있다
        if (hash(x * 7 + i * 101 + 13, y * 5 + i * 37 + 3) > s.rate) continue;
        if (!fits(s, x, y)) continue;
        for (let j = 0; j < s.th; j++) for (let k = 0; k < s.tw; k++) used.add(key(x + k, y + j));
        const cx = x + s.tw / 2;
        const cy = y + s.th / 2;
        const c = new Container();
        const sp = new Sprite(s.texture);
        sp.anchor.set(0.5, 1);
        sp.width = s.w;
        sp.height = s.h;
        // 좌우로 뒤집힌 것도 섞어 같은 그림이 되풀이되어 보이지 않게 한다 (빛나는 것은 빛의 방향이 있어 그대로 둔다)
        if (s.glow === null && hash(x + 77, y + 41) < 0.5) sp.scale.x = -sp.scale.x;
        sp.tint = tint(x + s.tw - 1, y + s.th - 1);
        c.addChild(sp);
        if (s.glow !== null) c.addChild(lightPool(glowTex, 0, -s.h * 0.72, s.glow, 1.1, 1.1, 0.4));
        // 밑동이 차지한 칸들의 가운데보다 조금 앞에 오게 해서, 벽 윗면에 서 있는 것처럼 보이게 한다
        c.position.set(px(cx, cy), py(cx, cy) - LIFT[2] + SY * (s.tw + s.th) * 0.24);
        // 차지한 칸들의 벽보다는 뒤에 그려지지 않고, 그 앞 대각선의 벽보다는 먼저 그려지게
        c.zIndex = (x + s.tw + y + s.th) * SY - 1;
        objects.addChild(c);
      }
    }
  }
}
