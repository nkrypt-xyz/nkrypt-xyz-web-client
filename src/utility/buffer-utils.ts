export const convertSmallBufferToString = (buffer: Buffer) => {
  return window.btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
};

export const convertSmallUint8ArrayToString = (array: Uint8Array) => {
  return window.btoa(String.fromCharCode.apply(null, array));
};

export const convertSmallStringToBuffer = (packed: string) => {
  const string = window.atob(packed);
  const buffer = new ArrayBuffer(string.length);
  const bufferView = new Uint8Array(buffer);

  for (let i = 0; i < string.length; i++) {
    bufferView[i] = string.charCodeAt(i);
  }

  return buffer;
};
