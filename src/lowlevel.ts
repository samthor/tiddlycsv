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
  let code: number;
  let source = '';
  let pos: number;
  let codeAt = (off = 0) => (code = source.charCodeAt(pos - off));
  let length: number;
  let nextIndex = (c: string) => (pos = (pos = source.indexOf(c, pos)) < 0 ? length : pos);
  let tempPos: number;
  let sourceSliceByOff = (off: boolean | number) =>
    source.slice(
      tempPos,
      // @ts-ignore you _can_ subtract a boolean from a number
      pos - off,
    );

  let newline = -1;

  return (next, eof) => {
    let consumed = 0;
    let output: string[][] = [];
    let currentRow: string[] = [];
    let s: string;

    source += next;
    length = source.length;
    pos = 0;

    for (;;) {
      if (codeAt() === 34) {
        // if quote...
        ++pos;
        s = '';

        for (;;) {
          tempPos = pos;
          nextIndex('"');
          s += sourceSliceByOff(0);
          if (pos === length) {
            break; // no more data
          }

          ++pos; // move past quote
          if (codeAt() === 13) {
            // found "\r", assume "\n" follows
            ++pos;
            codeAt();
          }
          if (code === 44 || code === 10) {
            break; // end, comma or newline after quote
          }
          // double-quote => one quote
          // @ts-ignore you _can_ add a boolean to a number
          pos += code === 34;
          s += '"';
        }
      } else {
        tempPos = pos;

        // regular
        if (pos > newline) {
          // recalc newline only if we went past it
          newline = nextIndex('\n');
          pos = tempPos; // reset for below `nextIndex` call
        }
        nextIndex(',');
        if (newline < pos) {
          pos = newline;
        }

        // deal with \r\n
        s = sourceSliceByOff(codeAt(1) === 13);
        codeAt();
      }

      currentRow.push(s);

      if (pos === length) {
        if (eof) {
          if (currentRow.length > 1 || s || code === 10) {
            // only push if last row has fields, OR has an explicit newline
            output.push(currentRow);
          }
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

      if (code === 10) {
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
