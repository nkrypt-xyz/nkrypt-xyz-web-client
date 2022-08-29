export const convertStreamToBuffer = async (
  readableStream: ReadableStream
): Promise<ArrayBuffer> => {
  let arrayBufferList = [];

  let reader = readableStream.getReader();
  while (true) {
    let { done, value: chunk } = await reader.read();
    await new Promise((accept) => setTimeout(accept, 40));
    if (done) break;

    // Uint8Array/ArrayBuffer compatibility
    if (chunk instanceof Uint8Array) {
      chunk = chunk.buffer;
    }
    arrayBufferList.push(chunk);
  }

  let totalLength = 0;
  arrayBufferList.forEach((arrayBuffer) => {
    let view = new Uint8Array(arrayBuffer);
    totalLength += view.length;
  });

  let resultBuffer = new ArrayBuffer(totalLength);
  let resultView = new Uint8Array(resultBuffer);

  let startIndex = 0;
  for (let arrayBuffer of arrayBufferList) {
    const view = new Uint8Array(arrayBuffer);
    resultView.set(view, startIndex);
    startIndex += view.length;
  }

  return resultBuffer;
};

export class MeteredByteStreamReader {
  private readableStream: ReadableStream;
  private reader: ReadableStreamDefaultReader;

  private remainingChunkOffset: number = 0;
  private remainingChunk: Uint8Array = null;
  id: string;

  constructor(readableStream: ReadableStream, id: string) {
    this.readableStream = readableStream;
    this.reader = this.readableStream.getReader();
    this.id = id;
  }

  async readBytes(
    byteCount: number
  ): Promise<{ value: Uint8Array; done: Boolean }> {
    let returnBytes = new Uint8Array(byteCount);
    let startingOffset = 0;
    let isDone = false;

    if (
      this.remainingChunk &&
      this.remainingChunk.length === this.remainingChunkOffset
    ) {
      this.remainingChunk = null;
      this.remainingChunkOffset = 0;
    }

    // use up any unused ramining chunk
    if (
      this.remainingChunk &&
      this.remainingChunk.length > this.remainingChunkOffset
    ) {
      let byteCountToCopy = Math.min(
        byteCount,
        this.remainingChunk.length - this.remainingChunkOffset
      );

      let sourceArray = this.remainingChunk.slice(
        this.remainingChunkOffset,
        this.remainingChunkOffset + byteCountToCopy
      );

      returnBytes.set(sourceArray, startingOffset);
      startingOffset += byteCountToCopy;
      this.remainingChunkOffset += byteCountToCopy;
    }

    // fetch enough data or end the process
    while (true) {
      if (startingOffset === byteCount) break;

      let { value: chunk, done }: { value?: Uint8Array; done: Boolean } =
        await this.reader.read();

      // some streams return ArrayBuffer instead of Uint8Arrays
      if (chunk instanceof ArrayBuffer) {
        chunk = new Uint8Array(chunk);
      }

      if (done) {
        isDone = true;
        break;
      }

      // Just because we got an empty chunk, doesn't mean the stream is over
      if (!chunk || chunk.length === 0) {
        continue;
      }

      let byteCountToCopy = Math.min(byteCount - startingOffset, chunk.length);

      let sourceArray = chunk.slice(0, byteCountToCopy);
      returnBytes.set(sourceArray, startingOffset);
      startingOffset += byteCountToCopy;

      if (chunk.length > byteCountToCopy) {
        this.remainingChunk = chunk;
        this.remainingChunkOffset = byteCountToCopy;
      }
    }

    // if there aren't enough bytes to send, send a reduced array intead
    if (startingOffset < byteCount) {
      returnBytes = returnBytes.slice(0, startingOffset);
    }

    // Ensure that any remaining chunk is flushed before sending the done signal.
    if (startingOffset > 0) {
      isDone = false;
    }

    return { value: returnBytes, done: isDone };
  }
}
