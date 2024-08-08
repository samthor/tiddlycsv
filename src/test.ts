import test from 'node:test';
import * as assert from 'node:assert';
import { buildCSVChunkStreamer, iterCSV } from './lowlevel.ts';
import { streamCSV } from './highlevel.ts';

const buildHandler = (cb: (data: string[][]) => void) => {
  const s = buildCSVChunkStreamer();
  return (raw: string, eof: boolean) => {
    const out = s(raw, eof);
    for (const each of out) {
      cb([each]);
    }
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
  assert.deepStrictEqual(agg, [['hello', 'there'], ['']]);

  // h('butt', true);
  // assert.deepStrictEqual(agg, [['hello', 'there'], [''], ['butt']]);
});

test('dumb quote', () => {
  const agg: string[][] = [];
  const h = buildHandler((data) => agg.push(...data));

  h('what is up","foo\n""barQ', true);
  assert.deepStrictEqual(agg, [['what is up"', 'foo\n"barQ']]);
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

  h('\n\n,', false);
  assert.deepStrictEqual(agg, [[''], ['']]);

  h('', true);
  assert.deepStrictEqual(agg, [[''], [''], ['', '']]);
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

test('iter', async () => {
  const raw = `hello,there\n1,2,3`;
  const all: string[][] = [];

  const gen = iterCSV(raw, 5);
  for (const row of gen) {
    all.push(row);
  }
  assert.deepStrictEqual(all, [
    ['hello', 'there'],
    ['1', '2', '3'],
  ]);
});
