import type * as types from '../types.d.ts';
import { buildCSVChunkStreamer } from './lowlevel.ts';

export function streamCSVChunk(r: AsyncIterable<string>): ReadableStream<string[][]> {
  const h = buildCSVChunkStreamer();

  return new ReadableStream({
    async pull(controller) {
      for await (const part of r) {
        const agg = h(part, false);
        if (agg.length) {
          controller.enqueue(agg.splice(0, agg.length));
          return;
        }
      }
      const agg = h('', true);
      if (agg.length) {
        controller.enqueue(agg);
      }
      controller.close();
    },
  });
}

export function streamCSV(r: AsyncIterable<string>): ReadableStream<string[]> {
  const cc = streamCSVChunk(r);

  return new ReadableStream({
    async pull(controller) {
      for await (const chunk of cc) {
        chunk.forEach((row) => controller.enqueue(row));
        return;
      }
      controller.close();
    },
  });
}

streamCSV satisfies typeof types.streamCSV;
streamCSVChunk satisfies typeof types.streamCSVChunk;
