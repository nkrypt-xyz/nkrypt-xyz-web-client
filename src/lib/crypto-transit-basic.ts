import {
  convertSmallUint8ArrayToString,
  convertSmallStringToBuffer,
} from "../utility/buffer-utils.js";
import {
  callBlobReadBasicApi,
  callBlobWriteBasicApi,
} from "../integration/blob-apis.js";
import {
  createEncryptionKeyFromPassword,
  decryptBuffer,
  encryptBuffer,
  makeRandomIv,
  makeRandomSalt,
} from "../utility/crypto-utils.js";

import {
  buildCryptoHeader,
  unbuildCryptoHeader,
} from "../utility/crypto-api-utils.js";
import { clientError } from "../constant/client-errors.js";
import {
  CodedError,
  handleErrorIfAny,
  raiseCaughtClientError,
  raiseClientError,
} from "./error-handling.js";
import {
  BLOB_CHUNK_SIZE_BYTES,
  ENCRYPTION_TAGLENGTH_IN_BITS,
} from "./crypto-specs.js";

const createCipherProperties = async (bucketPassword: string) => {
  let { iv } = await makeRandomIv();
  let { salt } = await makeRandomSalt();
  let { key } = await createEncryptionKeyFromPassword(bucketPassword, salt);
  return { iv, key, salt };
};

const encryptBufferInTaggedChunks = async (
  cipherProps,
  buffer: Uint8Array | ArrayBuffer,
  progressNotifierFn: Function
): Promise<Uint8Array> => {
  let sourceBuffer =
    buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

  const extraLengthWhenEncrypted = ENCRYPTION_TAGLENGTH_IN_BITS / 8;

  const sourceChunkSize = BLOB_CHUNK_SIZE_BYTES;
  const destinationChunkSize = BLOB_CHUNK_SIZE_BYTES + extraLengthWhenEncrypted;

  const saturatedChunkCount = Math.floor(sourceBuffer.length / sourceChunkSize);
  const sourceLeftoverChunkSize = sourceBuffer.length % sourceChunkSize;

  let destinationBufferLength =
    destinationChunkSize * saturatedChunkCount +
    (sourceLeftoverChunkSize === 0
      ? 0
      : sourceLeftoverChunkSize + extraLengthWhenEncrypted);
  let destinationBuffer = new Uint8Array(destinationBufferLength);

  for (let i = 0; i < saturatedChunkCount; i++) {
    let sourceChunk = sourceBuffer.subarray(
      i * sourceChunkSize,
      (i + 1) * sourceChunkSize
    );

    let encryptedChunk = await encryptBuffer(cipherProps, sourceChunk);
    destinationBuffer.set(
      new Uint8Array(encryptedChunk),
      i * destinationChunkSize
    );

    progressNotifierFn(sourceBuffer.length, i * sourceChunkSize, 0);
  }

  if (sourceLeftoverChunkSize > 0) {
    let sourceChunk = sourceBuffer.subarray(
      saturatedChunkCount * sourceChunkSize,
      saturatedChunkCount * sourceChunkSize + sourceLeftoverChunkSize
    );

    let encryptedChunk = await encryptBuffer(cipherProps, sourceChunk);
    destinationBuffer.set(
      new Uint8Array(encryptedChunk),
      saturatedChunkCount * destinationChunkSize
    );

    progressNotifierFn(
      sourceBuffer.length,
      saturatedChunkCount * sourceChunkSize + sourceLeftoverChunkSize,
      0
    );
  }

  return destinationBuffer;
};

export const encryptAndUploadFile = async (
  bucketId: string,
  fileId: string,
  file: File,
  bucketPassword: string,
  progressNotifierFn: Function
) => {
  let cipherProps = await createCipherProperties(bucketPassword);

  let buffer = await file.arrayBuffer();
  let encryptedBuffer = await encryptBufferInTaggedChunks(
    cipherProps,
    buffer,
    progressNotifierFn
  );

  let iv = convertSmallUint8ArrayToString(cipherProps.iv);
  let salt = convertSmallUint8ArrayToString(cipherProps.salt);
  let cryptoHeader = buildCryptoHeader(iv, salt);

  let response = await callBlobWriteBasicApi(
    bucketId,
    fileId,
    file.size,
    encryptedBuffer,
    cryptoHeader,
    progressNotifierFn
  );

  return response;
};

const initiateFileDownload = (buffer: ArrayBuffer, fileNameForDownloading) => {
  let blob = new Blob([new Uint8Array(buffer)]);

  let url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileNameForDownloading;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
};

const decryptBufferInTaggedChunks = async (
  { iv, key },
  buffer: Uint8Array | ArrayBuffer,
  progressNotifierFn: Function
): Promise<Uint8Array> => {
  let sourceBuffer =
    buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

  const extraLengthWhenEncrypted = ENCRYPTION_TAGLENGTH_IN_BITS / 8;

  const sourceChunkSize = BLOB_CHUNK_SIZE_BYTES + extraLengthWhenEncrypted;
  const destinationChunkSize = BLOB_CHUNK_SIZE_BYTES;

  const saturatedChunkCount = Math.floor(sourceBuffer.length / sourceChunkSize);
  const sourceLeftoverChunkSize = sourceBuffer.length % sourceChunkSize;

  let destinationBufferLength =
    destinationChunkSize * saturatedChunkCount +
    (sourceLeftoverChunkSize === 0
      ? 0
      : sourceLeftoverChunkSize - extraLengthWhenEncrypted);
  let destinationBuffer = new Uint8Array(destinationBufferLength);

  for (let i = 0; i < saturatedChunkCount; i++) {
    let sourceChunk = sourceBuffer.subarray(
      i * sourceChunkSize,
      (i + 1) * sourceChunkSize
    );

    let decryptedChunk = await decryptBuffer({ iv, key }, sourceChunk);
    destinationBuffer.set(
      new Uint8Array(decryptedChunk),
      i * destinationChunkSize
    );

    progressNotifierFn(
      sourceBuffer.length,
      sourceBuffer.length,
      i * sourceChunkSize
    );
  }

  if (sourceLeftoverChunkSize > 0) {
    let sourceChunk = sourceBuffer.subarray(
      saturatedChunkCount * sourceChunkSize,
      saturatedChunkCount * sourceChunkSize + sourceLeftoverChunkSize
    );

    let decryptedChunk = await decryptBuffer({ iv, key }, sourceChunk);
    destinationBuffer.set(
      new Uint8Array(decryptedChunk),
      saturatedChunkCount * destinationChunkSize
    );

    progressNotifierFn(
      sourceBuffer.length,
      sourceBuffer.length,
      saturatedChunkCount * sourceChunkSize + sourceLeftoverChunkSize
    );
  }

  return destinationBuffer;
};

export const downloadAndDecryptFile = async (
  bucketId: string,
  fileId: string,
  fileNameForDownloading: string,
  bucketPassword: string,
  progressNotifierFn: Function
) => {
  let response = await callBlobReadBasicApi(
    bucketId,
    fileId,
    progressNotifierFn
  );
  if (await handleErrorIfAny(response)) return null;

  let { cryptoHeaderContent, arrayBuffer } = response;

  let [iv, salt] = unbuildCryptoHeader(cryptoHeaderContent);
  let { key } = await createEncryptionKeyFromPassword(bucketPassword, salt);

  let decryptedArrayBuffer;
  try {
    decryptedArrayBuffer = await decryptBufferInTaggedChunks(
      { iv, key },
      arrayBuffer,
      progressNotifierFn
    );
  } catch (ex) {
    throw raiseCaughtClientError(ex, clientError.DECRYPTION_FAILED);
  }

  try {
    initiateFileDownload(decryptedArrayBuffer, fileNameForDownloading);
  } catch (ex) {
    throw raiseCaughtClientError(ex, clientError.FAILED_TO_SAVE_FILE);
  }

  return true;
};
