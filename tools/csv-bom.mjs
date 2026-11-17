// data/*.csv 맨 앞에 UTF-8 BOM을 붙인다.
// BOM이 있어야 엑셀이 한글을 깨뜨리지 않고 연다. 게임은 BOM이 있든 없든 읽는다.
//
//   node tools/csv-bom.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

for (const name of readdirSync(DIR)) {
  if (!name.endsWith('.csv')) continue;
  const path = join(DIR, name);
  const buf = readFileSync(path);
  if (buf.subarray(0, 3).equals(BOM)) continue;
  writeFileSync(path, Buffer.concat([BOM, buf]));
  console.log(`BOM 추가: data/${name}`);
}
