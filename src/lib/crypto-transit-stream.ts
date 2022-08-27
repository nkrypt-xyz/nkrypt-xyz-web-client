import { convertSmallUint8ArrayToString } from "../utility/buffer-utils.js";
import {
  buildCryptoHeader,
  unbuildCryptoHeader,
} from "../utility/crypto-api-utils.js";
import {
  callBlobReadStreamApi,
  callBlobWriteStreamApi,
} from "../integration/blob-apis.js";
import {
  createEncryptionKeyFromPassword,
  decryptBuffer,
  encryptBuffer,
  makeRandomIv,
  makeRandomSalt,
} from "../utility/crypto-utils.js";

import {
  convertStreamToBuffer,
  MeteredByteStreamReader,
} from "../utility/stream-and-buffer-utils.js";
import {
  BLOB_CHUNK_SIZE_BYTES,
  ENCRYPTION_TAGLENGTH_IN_BITS,
  IV_LENGTH,
  SALT_LENGTH,
} from "./crypto-specs.js";
import { handleErrorIfAny } from "./error-handling.js";

import streamSaver from "streamsaver";
import { CommonConstant } from "../constant/common-constants.js";
import { storedSession, _storedSession } from "../store/session.js";
import { joinUrlPathFragments } from "../utility/api-utils.js";

const createCipherProperties = async (bucketPassword: string) => {
  let { iv } = await makeRandomIv();
  let { salt } = await makeRandomSalt();
  let { key } = await createEncryptionKeyFromPassword(bucketPassword, salt);
  return { iv, key, salt };
};

const createEncryptedPseudoTransformStream = async (
  file: File,
  cipherProps: { iv; key; salt },
  progressNotifierFn: Function,
  bucketPassword // delme
): Promise<ReadableStream<any>> => {
  const totalBytes = file.size;
  let bytesRead = 0;
  progressNotifierFn(totalBytes, bytesRead, 0);

  let inputStream: ReadableStream = file.stream() as any;
  // let inputStreamReader = inputStream.getReader();
  let meteredBytedReader = new MeteredByteStreamReader(inputStream);

  // Note: We are not using transform streams due to a lack of browser support.
  return new ReadableStream({
    async pull(controller) {
      const { value: chunk, done } = await meteredBytedReader.readBytes(
        BLOB_CHUNK_SIZE_BYTES
      );

      if (done) {
        controller.close();
        return;
      }

      let chunkBuffer: ArrayBuffer = chunk.buffer;
      let encryptedChunkBuffer = await encryptBuffer(cipherProps, chunkBuffer);

      bytesRead += chunkBuffer.byteLength;
      progressNotifierFn(totalBytes, bytesRead, 0);

      controller.enqueue(encryptedChunkBuffer);
    },
  });
};

export const encryptAndUploadFile = async (
  bucketId: string,
  fileId: string,
  file: File,
  bucketPassword: string,
  progressNotifierFn: Function
) => {
  let cipherProps = await createCipherProperties(bucketPassword);

  let encryptedDataStream = await createEncryptedPseudoTransformStream(
    file,
    cipherProps,
    progressNotifierFn,
    bucketPassword
  );

  let iv = convertSmallUint8ArrayToString(cipherProps.iv);
  let salt = convertSmallUint8ArrayToString(cipherProps.salt);
  let cryptoHeader = buildCryptoHeader(iv, salt);

  let inputStream: ReadableStream = file.stream() as any;

  let response = await callBlobWriteStreamApi(
    bucketId,
    fileId,
    file.size,
    encryptedDataStream,
    cryptoHeader
  );

  progressNotifierFn(file.size, file.size, file.size);

  return response;
};

const createDeryptedPseudoTransformStream = async (
  inputStream: ReadableStream,
  { iv, key },
  contentLengthOnServer,
  progressNotifierFn: Function
): Promise<ReadableStream<any>> => {
  const totalBytes = contentLengthOnServer;
  let bytesRead = 0;
  progressNotifierFn(totalBytes, 0, 0);

  let meteredBytedReader = new MeteredByteStreamReader(inputStream);

  // Note: We are not using transform streams due to a lack of browser support.
  return new ReadableStream({
    async pull(controller) {
      const { value: chunk, done } = await meteredBytedReader.readBytes(
        BLOB_CHUNK_SIZE_BYTES + ENCRYPTION_TAGLENGTH_IN_BITS / 8
      );

      if (done) {
        controller.close();
        return;
      }

      let chunkBuffer: ArrayBuffer = chunk.buffer;
      let decryptedChunkBuffer = await decryptBuffer({ iv, key }, chunkBuffer);

      bytesRead += chunkBuffer.byteLength;
      progressNotifierFn(totalBytes, bytesRead, bytesRead);

      controller.enqueue(new Uint8Array(decryptedChunkBuffer));
    },
  });
};

const getStreamSaverMitmUrl = () => {
  return joinUrlPathFragments(
    _storedSession.serverUrl,
    "/static/stream-saver/mitm_2_0_0.html"
  );
};

const calculateDecryptedFileSize = (encryptedFileSize) => {
  let count =
    encryptedFileSize /
    (BLOB_CHUNK_SIZE_BYTES + ENCRYPTION_TAGLENGTH_IN_BITS / 8);
  if (count > Math.floor(count)) {
    count = Math.floor(count) + 1;
  }
  let totalExtraSpaceForTags = count * (ENCRYPTION_TAGLENGTH_IN_BITS / 8);
  return encryptedFileSize - totalExtraSpaceForTags;
};

export const downloadAndDecryptFile = async (
  bucketId: string,
  fileId: string,
  fileNameForDownloading: string,
  bucketPassword: string,
  progressNotifierFn: Function
) => {
  let response = await callBlobReadStreamApi(bucketId, fileId);
  if (await handleErrorIfAny(response)) return null;

  let { readableStream, cryptoHeaderContent, contentLengthOnServer } = response;

  let [iv, salt] = unbuildCryptoHeader(cryptoHeaderContent);
  let { key } = await createEncryptionKeyFromPassword(bucketPassword, salt);

  if (response.hasError) {
    return response;
  }

  let decryptedReadableStream = await createDeryptedPseudoTransformStream(
    readableStream,
    { iv, key },
    contentLengthOnServer,
    progressNotifierFn
  );

  streamSaver.mitm = getStreamSaverMitmUrl();

  const fileStream = streamSaver.createWriteStream(fileNameForDownloading, {
    size: calculateDecryptedFileSize(contentLengthOnServer),
    writableStrategy: undefined, // (optional)
    readableStrategy: undefined, // (optional)
  });

  let results = await decryptedReadableStream.pipeTo(fileStream);

  return results;
};
