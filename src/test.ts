import test from 'node:test';
import * as assert from 'node:assert';
import { buildCSVChunkStreamer } from './lowlevel.ts';
import { streamCSV } from './highlevel.ts';

const buildHandler = (cb: (data: string[][]) => void) => {
  const s = buildCSVChunkStreamer();
  return (raw: string, eof: boolean) => {
    const out = s(raw, eof);
    cb(out);
  };
};

test('dumb', () => {
  const agg: string[][] = [];

  const h = buildHandler((data) => agg.push(...data));
  assert.deepStrictEqual(agg, []);

  h('hello,there', false);
  assert.deepStrictEqual(agg, []);

  h('\n', false);
  assert.deepStrictEqual(agg, [['hello', 'there']]);

  h('\n', false);
  assert.deepStrictEqual(agg, [['hello', 'there'], []]);

  h('butt', true);
  assert.deepStrictEqual(agg, [['hello', 'there'], [], ['butt']]);
});

test('dumb quote', () => {
  const agg: string[][] = [];
  const h = buildHandler((data) => agg.push(...data));

  h('what is up","foo\n""bar', true);
  assert.deepStrictEqual(agg, [['what is up"', 'foo\n"bar']]);
});

test('dumb quote #2', () => {
  const agg: string[][] = [];
  const h = buildHandler((data) => agg.push(...data));

  h('what is up","foo\n"bar', true);
  assert.deepStrictEqual(agg, [['what is up"', 'foo\n"bar']]);
});

test('dumb #3', () => {
  const agg: string[][] = [];
  const h = buildHandler((data) => agg.push(...data));

  h('\n\n\n,', false);
  assert.deepStrictEqual(agg, [[], [], []]);

  h('', true);
  assert.deepStrictEqual(agg, [[], [], [], ['']]);
});

test('rs', async () => {
  const generator = (async function* () {
    yield 'hello,there';
    yield ',there';
  })();

  const out = streamCSV(generator);
  const all: string[][] = [];

  for await (const row of out) {
    all.push(row);
  }

  assert.deepStrictEqual(all, [['hello', 'there', 'there']]);
});