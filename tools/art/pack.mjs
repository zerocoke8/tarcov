// 4단계: 한 캐릭터(몬스터)의 모든 동작 프레임을 시트 이미지에 모으고, 게임이 읽는 sheet.json 을 만든다.
// 결과는 public/sprites/<id>/ 에 놓이고, public/sprites/index.json 에 등록된다. 등록된 것만 게임에서 스프라이트로 그려진다.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';
import { packShelves } from './lib/pixels.ts';
import { ArtError, OUT_DIR, clipsFor, ensureDir, num, paths, readJson, subject, writeJson } from './lib/common.mjs';

/** 동작 이름 순서 (sheet.json 을 읽기 쉽게) */
const ORDER = ['Idle', 'Move', 'BasicAttack', 'ActiveSkill', 'Ultimate', 'Escape', 'Hit', 'Stun', 'Death', 'Tag', 'MonsterAttack', 'Pattern'];
const rank = (a) => {
  const i = ORDER.findIndex((o) => a.startsWith(o));
  return i < 0 ? ORDER.length : i;
};

export function readClips(id) {
  const root = join(paths(id).work, 'clips');
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .map((name) => ({ dir: join(root, name), info: readJson(join(root, name, 'clip.json')) }))
    .filter((c) => c.info)
    .sort((a, b) => rank(a.info.anim) - rank(b.info.anim) || a.info.anim.localeCompare(b.info.anim) || a.info.dir.localeCompare(b.info.dir));
}

function updateIndex(id, entry) {
  const file = join(OUT_DIR, 'index.json');
  const index = readJson(file) ?? {};
  if (entry) index[id] = entry;
  else delete index[id];
  writeJson(file, Object.fromEntries(Object.entries(index).sort(([a], [b]) => a.localeCompare(b))));
}

export async function pack(id) {
  const sub = subject(id);
  const out = paths(id).out;
  // 표에 있는 동작·방향만 시트에 넣는다. 표에서 뺀 것의 프레임 폴더가 남아 있어도 게임에는 들어가지 않는다
  const table = new Map(clipsFor(sub).map((c) => [c.anim, c]));
  const found = readClips(id);
  const clips = found.filter((c) => table.has(c.info.anim) && sub.dirs.includes(c.info.dir));
  const skipped = found.filter((c) => !clips.includes(c)).map((c) => `${c.info.anim} ${c.info.dir}`);
  if (skipped.length) console.log(`[${id}] 표에 없어 시트에서 뺀 것: ${skipped.join(', ')}`);
  if (existsSync(out)) rmSync(out, { recursive: true });
  if (!clips.length) {
    updateIndex(id, null);
    console.log(`[${id}] 동작 프레임이 없어 스프라이트 등록을 지웠습니다 (게임에서는 도형으로 그려집니다)`);
    return;
  }
  ensureDir(out);

  const all = clips.flatMap((c) => c.info.frames.map((f) => ({ ...f, path: join(c.dir, f.file) })));
  const maxSize = num('sheet.maxSize');
  const { placed, pages } = packShelves(all, maxSize, num('sheet.pad'));
  // 시트는 WebP로 저장한다 (PNG의 1/5 안팎). sheet.quality 가 0이면 무손실 PNG
  const quality = num('sheet.quality');
  const names = pages.map((_, i) => `sheet-${i}.${quality > 0 ? 'webp' : 'png'}`);
  const hash = createHash('sha1');
  let bytes = 0;
  for (const [i, pg] of pages.entries()) {
    const buf = await sharp({ create: { width: pg.w, height: pg.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite(all.map((f, k) => ({ input: f.path, left: placed[k].x, top: placed[k].y, page: placed[k].page })).filter((c) => c.page === i).map(({ input, left, top }) => ({ input, left, top })))
      .png({ compressionLevel: 9 })
      .toBuffer();
    if (quality > 0) await sharp(buf).webp({ quality, alphaQuality: 100, effort: 5 }).toFile(join(out, names[i]));
    else await sharp(buf).toFile(join(out, names[i]));
    bytes += statSync(join(out, names[i])).size;
    hash.update(buf);
  }

  const sheet = { version: 1, id, kind: sub.kind, scale: 1 / num('sheet.texScale'), height: sub.height, pages: names, mirror: true, clips: {} };
  let k = 0;
  for (const { info } of clips) {
    // 재생 속도와 타격 지점은 표의 값을 쓴다 (표를 고친 뒤 pack 만 다시 해도 반영된다)
    const row = table.get(info.anim);
    // 타격 지점: 표에 숫자가 있으면 그 값, auto 면 프레임을 뽑을 때 잰 값
    const impact = row.impact === 'auto' ? info.impact : row.impact;
    const clip = (sheet.clips[info.anim] ??= { loop: row.loop, fps: row.fps, ...(impact ? { impact } : {}), dirs: {} });
    clip.dirs[info.dir] = info.frames.map((f) => {
      const pos = placed[k++];
      // 단발 동작은 마지막 칸에 그 프레임의 시점(0~1)을 넣는다
      return f.t === undefined ? [pos.page, pos.x, pos.y, f.w, f.h, f.ax, f.ay] : [pos.page, pos.x, pos.y, f.w, f.h, f.ax, f.ay, f.t];
    });
  }
  // 다른 동작의 프레임을 그대로 쓰는 동작 (표의 range 가 "=동작 이름")
  for (const row of table.values()) {
    const src = row.alias && sheet.clips[row.alias];
    if (src) sheet.clips[row.anim] = { ...src, loop: row.loop, fps: row.fps };
  }
  const json = JSON.stringify(sheet);
  hash.update(json);
  ensureDir(out);
  writeJson(join(out, 'sheet.json'), sheet);
  updateIndex(id, { kind: sub.kind, v: hash.digest('hex').slice(0, 10) });

  const mem = pages.reduce((s, pg) => s + pg.w * pg.h * 4, 0) / 1024 / 1024;
  const anims = Object.entries(sheet.clips).map(([a, c]) => `${a}(${Object.keys(c.dirs).join('/')})`).join(', ');
  console.log(`[${id}] 시트 ${pages.length}장 (${pages.map((pg) => `${pg.w}x${pg.h}`).join(', ')}), 프레임 ${all.length}장, 파일 ${(bytes / 1024).toFixed(0)}KB, 그래픽 메모리 약 ${mem.toFixed(1)}MB`);
  console.log(`[${id}] 동작: ${anims}`);
  console.log(`[${id}] → ${relative(process.cwd(), out)}`);
  if (!sheet.clips.Idle) console.log(`[${id}] 주의: Idle 동작이 없으면 게임에서 스프라이트로 그려지지 않습니다`);
  return readFileSync(join(out, 'sheet.json'), 'utf8').length;
}

export async function run(args) {
  const [id] = args;
  if (!id) throw new ArtError('사용법: npm run art -- pack <id>');
  await pack(id);
}
