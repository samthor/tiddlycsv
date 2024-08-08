/**
 * Parses a whole CSV into an array of arrays.
 */
export function parseCSV(raw: string): string[][];

/**
 * Iterates over each line of a CSV.
 *
 * This is implemented via chunking the raw data by the number of bytes passed, or uses a sensible
 * default.
 */
export function iterCSV(raw: string, chunkSize?: number): Generator<string[], void, void>;

/**
 * High-level which reads a CSV from a {@link AsyncIterable} and converts it into chunks of CSV data.
 */
export function streamCSV(r: AsyncIterable<string>): ReadableStream<string[]>;

/**
 * High-level which reads a CSV from a {@link AsyncIterable} and converts it into lines of CSV data.
 */
export function streamCSVChunk(r: AsyncIterable<string>): ReadableStream<string[][]>;

/**
 * Builds a helper which, when provided with string data, emits chunks of CSV data. Must eventually
 * be called with EOF of `true`. This is intended to be a low-level helper.
 *
 * This may return nothing if a whole line/chunk isn't available.
 */
export function buildCSVChunkStreamer(): (next: string, eof?: boolean) => string[][];

/**
 * Builds a CSV from raw data. Every value is stringified before render.
 */
export function writeCSV(raw: (string | number)[][]): string;
