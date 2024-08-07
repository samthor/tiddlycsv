/**
 * Parses a whole CSV into an array of arrays.
 */
export function parseCSV(raw: string): string[][];

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
 * be called with EOF of `true`.
 *
 * This may return nothing if a whole line/chunk isn't available.
 */
export function buildCSVChunkStreamer(): (next: string, eof?: boolean) => string[][];

/**
 * Builds a CSV from raw data. Every value is stringified before render.
 */
export function writeCSV(raw: (string | number)[][]): string;
