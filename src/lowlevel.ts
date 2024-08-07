import type * as types from '../types.d.ts';

export function parseCSV(raw: string): string[][] {
  const s = buildCSVChunkStreamer();
  return s(raw, true);
}

export function buildCSVChunkStreamer(): (next: string, eof?: boolean) => string[][] {
  let source = '';
  let wasEof = false;

  let nextIndexTemp = 0;
  let inlineTemp = 0;
  let pos = 0;
  let length = source.length;
  let codeAt = () => (pos < length ? source.charCodeAt(pos) : -1);
  let nextIndex = (c: string) =>
    (nextIndexTemp = source.indexOf(c, pos)) < 0 ? length : nextIndexTemp;
  let consumed = 0;

  return (next: string, eof?: boolean) => {
    let s = '';
    let output: string[][] = [];
    let currentRow: string[] = [];

    if (!wasEof) {
      // @ts-ignore
      wasEof ??= eof;
      source += next;
      pos = consumed = 0;
      length = source.length;

      for (;;) {
        while (codeAt() === 10) {
          output.push(currentRow.splice(0, currentRow.length));
          consumed = ++pos;
        }

        if (codeAt() === -1) {
          if (eof && currentRow.length) {
            output.push(currentRow);
          }
          break;
        }

        // is quote?
        if (codeAt() === 34) {
          s = '';
          ++pos;

          for (;;) {
            inlineTemp = nextIndex('"');
            s += source.slice(pos, inlineTemp);

            pos = inlineTemp + 1;
            inlineTemp = codeAt();
            if ([-1, 44, 10].includes(inlineTemp)) {
              break; // end
            }

            // double-quote => one quote
            // @ts-ignore you _can_ add a boolean to a number
            pos += inlineTemp === 34;
            s += '"';
          }

          if (inlineTemp === -1 && !eof) {
            break; // can't be sure we're done
          }
          currentRow.push(s);
        } else {
          inlineTemp = Math.min(nextIndex('\n'), nextIndex(','));
          if (inlineTemp === length && !eof) {
            break; // can't be sure we're done
          }

          currentRow.push(source.slice(pos, inlineTemp));
          pos = inlineTemp;
          // @ts-ignore you _can_ add a boolean to a number
          pos += codeAt() === 44;
        }
      }

      if (consumed) {
        source = source.slice(consumed);
      }
    }

    return output;
  };
}

parseCSV satisfies typeof types.parseCSV;
buildCSVChunkStreamer satisfies typeof types.buildCSVChunkStreamer;
