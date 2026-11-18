// 스프라이트 제작 도구. 원화 → SD 기본 이미지(Codex) → 동작 영상(Seedance) → 스프라이트 시트 → 게임.
//
//   npm run art -- status                     무엇이 만들어져 있는지
//   npm run art -- all serin                  빠진 단계의 계획과 예상 비용을 보여 준다 (--yes 를 붙여야 실제로 만든다)
//   npm run art -- all serin --only Idle,Move --yes
//   npm run art -- all mido sia karen --yes   여러 대상을 한 번에 (영상은 동시 실행 한도 안에서 함께 돈다)
//   npm run art -- image serin [SE]           1단계만: Codex로 기본 이미지
//   npm run art -- video serin Idle [SE]      2단계만: Seedance로 동작 영상 (요금 발생)
//   npm run art -- clip serin Idle [SE]       3단계만: 영상 → 프레임 (--from 초 --to 초 --frames 장수 로 구간을 직접 지정)
//   npm run art -- still serin [SE]           영상 없이 기본 이미지 한 장을 정지 대기 동작으로 쓴다 (요금 없음)
//   npm run art -- pack serin                 4단계만: 프레임 → 시트. public/sprites/ 에 놓이고 게임에 바로 반영된다
//
//   npm run art -- ui                         화면(UI) 그림(초상화, 펫, 아이콘, 로비 배경)을 만든다. 자세한 것은 tools/art/ui.mjs 맨 위
//   npm run art -- scenery                    맵 그림(바닥·벽·오브젝트)을 만든다. 자세한 것은 tools/art/scenery.mjs 맨 위
//   npm run art -- fx                         이펙트 그림(조각, 플립북)을 만든다. 자세한 것은 tools/art/fx.mjs 맨 위
//
// 대상·동작·설정은 data/art/ 의 표(subjects.csv, clips.csv, settings.csv)에서 고친다.
import { existsSync } from 'node:fs';
import { ArtError, clipsFor, paths, readJson, subject, tables } from './art/lib/common.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const args = [];
const opts = {};
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (!a.startsWith('--')) args.push(a);
  else if (a.includes('=')) opts[a.slice(2, a.indexOf('='))] = a.slice(a.indexOf('=') + 1);
  else if (rest[i + 1] !== undefined && !rest[i + 1].startsWith('--') && ['from', 'to', 'frames', 'only', 'model'].includes(a.slice(2))) opts[a.slice(2)] = rest[++i];
  else opts[a.slice(2)] = true;
}

function status() {
  for (const sub of tables().subjects) {
    const p = paths(sub.id);
    const packed = readJson(`${p.out}/sheet.json`);
    console.log(`\n${sub.id} (${sub.kind}, 방향 ${sub.dirs.join(' ')}) ${packed ? '— 게임에 등록됨' : '— 게임에서는 도형'}`);
    console.log(`  기본 이미지: ${sub.dirs.map((d) => `${d} ${existsSync(p.base(d)) ? '있음' : '없음'}`).join(', ')}`);
    for (const c of clipsFor(sub)) {
      const cells = sub.dirs.map((d) => {
        if (c.alias) return `${d} ${c.alias} 의 프레임을 그대로 씀`;
        const v = existsSync(p.video(c.anim, d));
        const k = existsSync(`${p.clipDir(c.anim, d)}/clip.json`);
        const s = packed?.clips?.[c.anim]?.dirs?.[d];
        return `${d} ${s ? `시트 ${s.length}장` : k ? '프레임' : v ? '영상' : '-'}`;
      });
      console.log(`  ${c.anim.padEnd(13)} ${cells.join(', ')}`);
    }
  }
  console.log('\n단계: - (없음) → 영상 → 프레임 → 시트');
}

async function all() {
  if (!args.length) throw new ArtError('사용법: npm run art -- all <id> [id …] [--only 동작,동작] [--yes]');
  const only = typeof opts.only === 'string' ? opts.only.split(',') : null;
  const { estimateCost, makeVideos } = await import('./art/video.mjs');

  // 계획: 대상마다 빠진 기본 이미지와 동작 영상
  const plans = args.map((id) => {
    const sub = subject(id);
    const p = paths(id);
    const clips = clipsFor(sub).filter((c) => !only || only.includes(c.anim));
    if (!clips.length) throw new ArtError(`[${id}] --only 에 맞는 동작이 없습니다. 있는 것: ${clipsFor(sub).map((c) => c.anim).join(', ')}`);
    const images = sub.dirs.filter((d) => opts.force || !existsSync(p.base(d)));
    const videos = clips
      .filter((c) => !c.alias)
      .flatMap((c) => sub.dirs.filter((d) => opts.force || !existsSync(p.video(c.anim, d))).map((d) => ({ id, anim: c.anim, dir: d, cost: estimateCost(c.seconds) })));
    return { id, sub, p, clips, images, videos };
  });
  let total = 0;
  for (const { id, images, videos } of plans) {
    const cost = videos.reduce((sum, v) => sum + v.cost, 0);
    total += cost;
    console.log(`[${id}] 계획`);
    console.log(`  기본 이미지 생성 (Codex): ${images.length ? images.join(', ') : '없음 (이미 있음)'}`);
    console.log(`  동작 영상 생성 (Seedance): ${videos.length ? `${videos.length}편 — ${videos.map((v) => `${v.anim} ${v.dir}`).join(', ')}` : '없음 (이미 있음)'}`);
    console.log(`  영상 예상 비용: 약 $${cost.toFixed(2)}`);
  }
  if (plans.length > 1) console.log(`\n전체 영상 ${plans.reduce((n, pl) => n + pl.videos.length, 0)}편, 예상 비용 약 $${total.toFixed(2)}`);
  if (plans.some((pl) => pl.images.length || pl.videos.length) && !opts.yes) {
    console.log('\n실제로 만들려면 같은 명령 끝에 --yes 를 붙이세요.');
    return;
  }

  const { makeImage } = await import('./art/image.mjs');
  for (const { id, sub, images } of plans) {
    for (const d of sub.dirs) await makeImage(id, d, { force: opts.force && images.includes(d) });
  }
  // 영상은 대상을 가리지 않고 동시 실행 한도 안에서 한꺼번에 돌린다
  const errors = await makeVideos(plans.flatMap((pl) => pl.videos), opts);
  const { makeClip, makeStill } = await import('./art/clip.mjs');
  const { pack } = await import('./art/pack.mjs');
  for (const { id, sub, p, clips } of plans) {
    // 대기 영상이 아직 없는 방향은 기본 이미지 한 장으로 채워, 어느 방향을 봐도 그림이 나오게 한다
    for (const d of sub.dirs) {
      if (!existsSync(p.video('Idle', d)) && !existsSync(`${p.clipDir('Idle', d)}/clip.json`)) await makeStill(id, d);
    }
    for (const c of clips) {
      for (const d of sub.dirs) {
        if (c.alias || !existsSync(p.video(c.anim, d))) continue;
        try {
          await makeClip(id, c.anim, d, {});
        } catch (err) {
          if (!(err instanceof ArtError)) throw err;
          errors.push(err.message);
          console.log(err.message);
        }
      }
    }
    await pack(id);
  }
  if (errors.length) throw new ArtError(`${errors.length}건은 만들지 못했습니다. 위의 메시지를 확인하세요`);
}

const commands = {
  status,
  all,
  image: async () => (await import('./art/image.mjs')).run(args, opts),
  video: async () => (await import('./art/video.mjs')).run(args, opts),
  clip: async () => (await import('./art/clip.mjs')).run(args, opts),
  still: async () => (await import('./art/clip.mjs')).runStill(args),
  pack: async () => (await import('./art/pack.mjs')).run(args, opts),
  scenery: async () => (await import('./art/scenery.mjs')).run(args, opts),
  ui: async () => (await import('./art/ui.mjs')).run(args, opts),
  fx: async () => (await import('./art/fx.mjs')).run(args, opts),
};

try {
  if (!commands[cmd]) {
    console.log('사용법: npm run art -- <status | all | image | video | clip | still | pack | scenery | ui | fx> ...  (자세한 예시는 tools/art.mjs 맨 위)');
    process.exitCode = cmd ? 1 : 0;
  } else await commands[cmd]();
} catch (err) {
  if (!(err instanceof ArtError)) throw err;
  console.error(`\n오류: ${err.message}`);
  process.exitCode = 1;
}
