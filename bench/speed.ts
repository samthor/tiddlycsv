import { parseCSV } from '../src/index.ts';
import * as bcs from 'but-csv';
import * as fs from 'fs';
import * as pp from 'papaparse';
import * as assert from 'node:assert';
import * as udsv from 'udsv';

const RUNS = 4;
const CHECK = false;

const raw = fs.readFileSync(process.argv[2] || '1.csv', 'utf-8');
const canon = parseCSV(raw);

async function timer(name: string, run: () => any) {
  console.time(name);
  let last: unknown;
  try {
    for (let i = 0; i < RUNS; ++i) {
      last = await run();
    }
  } finally {
    console.timeEnd(name);
  }

  // TODO: papaparse doesn't include trailing empty fields in rows
  if (CHECK) {
    assert.deepStrictEqual(canon, last);
  }
}

await timer('stream', () => {
  return parseCSV(raw);
});

await timer('but-csv', () => {
  return bcs.parse(raw);
});

await timer('pp', () => {
  const out = pp.default.parse(raw);
  return out.data;
});

await timer('udsv', () => {
  let schema = udsv.inferSchema(raw);
  let parser = udsv.initParser(schema);
  return parser.stringArrs(raw);
});
