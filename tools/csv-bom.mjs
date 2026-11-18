// data/*.csv, data/art/*.csv, data/sound/*.csv 맨 앞에 UTF-8 BOM을 붙인다.
// BOM이 있어야 엑셀이 한글을 깨뜨리지 않고 연다. 게임은 BOM이 있든 없든 읽는다.
//
//   node tools/csv-bom.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

// data/ 의 게임 수치 표, data/art/ 의 스프라이트 제작 표, data/sound/ 의 소리 표
for (const sub of ['', 'art', 'sound']) {
  const dir = join(DATA, sub);
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.csv')) continue;
    const path = join(dir, name);
    const buf = readFileSync(path);
    if (buf.subarray(0, 3).equals(BOM)) continue;
    writeFileSync(path, Buffer.concat([BOM, buf]));
    console.log(`BOM 추가: data/${sub ? sub + '/' : ''}${name}`);
  }
}
