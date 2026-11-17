/** CSV 한 줄을 헤더 이름으로 읽을 수 있게 한 레코드. line은 파일에서의 줄 번호(1부터). */
export interface CsvRow {
  line: number;
  cells: Record<string, string>;
}

/** 따옴표와 줄바꿈을 지원하는 CSV 파서. 맨 앞 BOM은 무시한다. */
export function parseCsv(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** 첫 줄을 헤더로 보고 레코드 목록으로 바꾼다. 빈 줄은 건너뛴다. */
export function csvRecords(text: string): { header: string[]; rows: CsvRow[] } {
  const raw = parseCsv(text);
  const header = (raw[0] ?? []).map((h) => h.trim());
  const rows: CsvRow[] = [];
  for (let i = 1; i < raw.length; i++) {
    const cells = raw[i];
    if (cells.every((c) => c.trim() === '')) continue;
    const rec: Record<string, string> = {};
    header.forEach((h, idx) => {
      rec[h] = (cells[idx] ?? '').trim();
    });
    rows.push({ line: i + 1, cells: rec });
  }
  return { header, rows };
}
