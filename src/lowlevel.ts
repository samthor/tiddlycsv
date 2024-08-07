import type * as types from '../types.d.ts';

export function parseCSV(raw: string): string[][] {
  const s = buildCSVChunkStreamer();
  return s(raw, true);
}

export function buildCSVChunkStreamer(): (next: string, eof?: boolean) => string[][] {
  let source = '';
  let pos = 0;
  let inlineTemp = 0;
  let nextIndexTemp = 0;
  let codeAt = () => source.charCodeAt(pos);
  let length = 0;
  let nextIndex = (c: string) =>
    (nextIndexTemp = source.indexOf(c, pos)) < 0 ? length : nextIndexTemp;

  let newline = -1;

  return (next, eof) => {
    let consumed = 0;
    let output: string[][] = [];
    let currentRow: string[] = [];
    let s = '';

    source += next;
    length = source.length;
    pos = 0;

    for (;;) {
      if (codeAt() === 34) {
        // if quote...
        s = '';
        ++pos;

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
        consumed = pos + 1;
      } else {
        // we expect codeAt() to be 44 here
      }
      ++pos;
    }

    // should not get here
  };
}

parseCSV satisfies typeof types.parseCSV;
buildCSVChunkStreamer satisfies typeof types.buildCSVChunkStreamer;
