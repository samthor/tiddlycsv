import { parseCSV } from '../src/index.ts';
import * as bcs from 'but-csv';
import * as fs from 'fs';
import * as pp from 'papaparse';
import * as assert from 'node:assert';
import * as udsv from 'udsv';

const RUNS = 4;
const CHECK = false;

const raw = fs.readFileSync(process.argv[2] || '1.csv', 'utf-8');
const hasCRLF = raw.includes('\r\n');
const canon = parseCSV(raw);

console.info('got raw data', { length: raw.length, hasCRLF });

type TimerOptions = {
  crlfUnsupported: boolean;
  trailingBlank: boolean;
  consumesHeader: boolean;
}

async function timer(name: string, run: () => any, opts?: Partial<TimerOptions>) {
  console.time(name);
  let last: any;
  try {
    for (let i = 0; i < RUNS; ++i) {
      last = await run();
    }
  } finally {
    console.timeEnd(name);
  }

  if (hasCRLF && opts?.crlfUnsupported) {
    console.debug('...no CRLF support');
    return;
  }

  const sampleFirst = last[opts?.consumesHeader ? 0 : 1];
  let sampleLast: any;

  if (!opts?.trailingBlank) {
    sampleLast = last.at(-1);
  } else {
    let check = last.length - 1;
    while (check) {
      if (last[check][0]) {
        sampleLast = last[check];
        break;
      }
      --check;
    }
  }

  console.debug(last.length, 'rows, sample', { first: sampleFirst, last: sampleLast });
}

await timer('tiddlycsv', () => {
  return parseCSV(raw);
});

await timer('but-csv', () => {
  return bcs.parse(raw);
}, { crlfUnsupported: true });

await timer('papaparse', () => {
  const out = pp.default.parse(raw);
  return out.data;
}, { trailingBlank: true });

await timer('udsv', () => {
  let schema = udsv.inferSchema(raw);
  let parser = udsv.initParser(schema);
  return parser.stringArrs(raw);
}, { consumesHeader: true });
