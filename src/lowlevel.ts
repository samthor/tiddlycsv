import type * as types from '../types.d.ts';

export function parseCSV(raw: string): string[][] {
  const s = buildCSVChunkStreamer();
  return s(raw, true);
}

const ITER_SIZE = 1024;

export function* iterCSV(raw: string, chunkSize = ITER_SIZE): Generator<string[], void, void> {
  if (chunkSize <= 0 || Math.round(chunkSize) !== chunkSize) {
    throw new Error(`invalid chunkSize`);
  }

  let s = buildCSVChunkStreamer();

  // just chunk raw
  let length = raw.length;
  let at = 0;
  let done = false;
  let end: number;
  let out: string[][];
  let each: string[];

  do {
    end = at + chunkSize;
    if (end >= length) {
      done = true;
    }
    out = s(raw.substring(at, end), done);
    for (each of out) {
      yield each;
    }
    at = end;
  } while (!done);
}

export function buildCSVChunkStreamer(): (next: string, eof?: boolean) => string[][] {
  let source = '';
  let pos: number;
  let codeAt = (_?: any) => source.charCodeAt(pos);
  let length: number;
  let nextIndexTemp: number;
  let nextIndex = (c: string) =>
    (nextIndexTemp = source.indexOf(c, pos)) < 0 ? length : nextIndexTemp;

  let newline = -1;

  return (next, eof) => {
    let consumed = 0;
    let output: string[][] = [];
    let currentRow: string[] = [];
    let s: string;
    let inlineTemp: number;

    source += next;
    length = source.length;
    pos = 0;

    for (;;) {
      if (codeAt() === 34) {
        // if quote...
        ++pos;
        s = '';

        for (;;) {
          inlineTemp = nextIndex('"');
          s += source.slice(pos, inlineTemp);
          if (inlineTemp === length) {
            pos = inlineTemp;
            break; // no more data
          }

          pos = inlineTemp + 1; // move past quote
          inlineTemp = codeAt();
          if (inlineTemp === 44 || inlineTemp === 10) {
            break; // end, comma or newline after quote
          }

          // double-quote => one quote
          // @ts-ignore you _can_ add a boolean to a number
          pos += inlineTemp === 34;
          s += '"';
        }
      } else {
        // regular
        if (pos > newline) {
          // recalc newline only if we went past it
          newline = nextIndex('\n');
        }
        inlineTemp = nextIndex(',');
        if (newline < inlineTemp) {
          inlineTemp = newline;
        }

        s = source.slice(pos, inlineTemp);
        pos = inlineTemp;
      }

      currentRow.push(s);

      if (pos === length) {
        if (eof) {
          output.push(currentRow);
          source = '';
          newline = -1;
        } else if (consumed) {
          source = source.slice(consumed);
          newline -= consumed;
        }
        if (newline === length) {
          newline = source.lastIndexOf('\n');
        }
        return output;
      }

      if (codeAt() === 10) {
        output.push(currentRow);
        currentRow = [];
        consumed = ++pos;
      } else {
        // we expect codeAt() to be 44 here
        ++pos;
      }
    }

    // should not get here
  };
}

parseCSV satisfies typeof types.parseCSV;
iterCSV satisfies typeof types.iterCSV;
buildCSVChunkStreamer satisfies typeof types.buildCSVChunkStreamer;
