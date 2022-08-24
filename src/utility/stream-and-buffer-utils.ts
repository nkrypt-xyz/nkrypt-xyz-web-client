export const convertStreamToBuffer = async (readableStream: ReadableStream) => {
  let arrayBufferList = [];

  let reader = readableStream.getReader();
  while (true) {
    let { done, value: chunk } = await reader.read();
    await new Promise((accept) => setTimeout(accept, 40));
    if (done) break;
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

export const areBuffersEqual = (buf1, buf2) => {
  if (buf1.byteLength != buf2.byteLength) return false;
  var dv1 = new Int8Array(buf1);
  var dv2 = new Int8Array(buf2);
  for (var i = 0; i != buf1.byteLength; i++) {
    if (dv1[i] != dv2[i]) return false;
  }
  return true;
};

export const areBuffersEqual2 = (buf1, buf2) => {
  function equal(a, b) {
    if (a instanceof ArrayBuffer) a = new Uint8Array(a, 0);
    if (b instanceof ArrayBuffer) b = new Uint8Array(b, 0);
    if (a.byteLength != b.byteLength) return false;
    if (aligned32(a) && aligned32(b)) return equal32(a, b);
    if (aligned16(a) && aligned16(b)) return equal16(a, b);
    return equal8(a, b);
  }

  function equal8(a, b) {
    const ua = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
    const ub = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
    return compare(ua, ub);
  }
  function equal16(a, b) {
    const ua = new Uint16Array(a.buffer, a.byteOffset, a.byteLength / 2);
    const ub = new Uint16Array(b.buffer, b.byteOffset, b.byteLength / 2);
    return compare(ua, ub);
  }
  function equal32(a, b) {
    const ua = new Uint32Array(a.buffer, a.byteOffset, a.byteLength / 4);
    const ub = new Uint32Array(b.buffer, b.byteOffset, b.byteLength / 4);
    return compare(ua, ub);
  }

  function compare(a, b) {
    for (let i = a.length; -1 < i; i -= 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function aligned16(a) {
    return a.byteOffset % 2 === 0 && a.byteLength % 2 === 0;
  }

  function aligned32(a) {
    return a.byteOffset % 4 === 0 && a.byteLength % 4 === 0;
  }

  return equal(buf1, buf2);
};

export class MeteredByteStreamReader {
  private readableStream: ReadableStream;
  private reader: ReadableStreamDefaultReader;

  private remainingChunkOffset: number = 0;
  private remainingChunk: Uint8Array = null;

  constructor(readableStream: ReadableStream) {
    this.readableStream = readableStream;
    this.reader = this.readableStream.getReader();
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

      const { value: chunk, done }: { value?: Uint8Array; done: Boolean } =
        await this.reader.read();

      if (done) {
        isDone = true;
        break;
      }

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

    // if there are not enough bytes to send, send a reduced array intead
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
