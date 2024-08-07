let needsQuoteRegexp = /["\n,]/;
let globalQuote = /"/g;

export function writeCSV(raw: (string | number)[][]) {
  // we could stringify array with ''+arr, but it's 50% slower than .join()
  // .join() without args is always with ','
  return raw
    .map((row) =>
      row
        .map((raw) => {
          // we hide string conversion inside this arg: on the `return`, raw is already stringified
          if (!needsQuoteRegexp.test((raw += ''))) {
            return raw;
          }
          return `"${(raw as string).replace(globalQuote, '""')}"`;
        })
        .join(),
    )
    .join('\n');
}
