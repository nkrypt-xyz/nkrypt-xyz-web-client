import streamSaver from "streamsaver";
import { clientErrorDef } from "../constant/client-errors.js";
import { CommonConstant } from "../constant/common-constants.js";
import {
  BLOB_CHUNK_SIZE_BYTES,
  BLOB_CHUNK_SIZE_INCLUDING_TAG_BYTES,
  ENCRYPTION_TAGLENGTH_IN_BITS,
} from "../constant/crypto-specs.js";
import {
  callBlobReadStreamApi,
  callBlobWriteQuantizedApi,
  callBlobWriteStreamApi,
} from "../integration/blob-apis.js";
import { _storedSession } from "../store/session.js";
import { joinUrlPathFragments } from "../utility/api-utils.js";
import { convertSmallUint8ArrayToString } from "../utility/buffer-utils.js";
import {
  buildCryptoHeader,
  unbuildCryptoHeader,
} from "../utility/crypto-api-utils.js";
import {
  createEncryptionKeyFromPassword,
  decryptBuffer,
  encryptBuffer,
  makeRandomIv,
  makeRandomSalt,
} from "../utility/crypto-utils.js";
import { MeteredByteStreamReader } from "../utility/stream-and-buffer-utils.js";
import { raiseClientError } from "./error-handling.js";
import { features, requireFeature } from "./feature-detection.js";

const createCipherProperties = async (bucketPassword: string) => {
  let { iv } = await makeRandomIv();
  let { salt } = await makeRandomSalt();
  let { key } = await createEncryptionKeyFromPassword(bucketPassword, salt);
  return { iv, key, salt };
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

  let meteredByteReader = new MeteredByteStreamReader(
    inputStream,
    "EncryptedStreamForDecryption"
  );

  // Note: We are not using transform streams due to a lack of browser support.
  return new ReadableStream({
    async pull(controller) {
      const { value: chunk, done } = await meteredByteReader.readBytes(
        BLOB_CHUNK_SIZE_INCLUDING_TAG_BYTES
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

export const getTargetFileHandle = async (name) => {
  let extension = "." + (name.split(".").pop() || "dat");
  const options = {
    suggestedName: name,
    types: [
      {
        description: "All Files",
        accept: {
          "application/octet-stream": [extension],
        },
      },
    ],
  };
  const handle = await (<any>window).showSaveFilePicker(options);

  return handle;
};

export const downloadAndDecryptFile = async (
  bucketId: string,
  fileId: string,
  fileNameForDownloading: string,
  bucketPassword: string,
  progressNotifierFn: Function
) => {
  await requireFeature(features.VFS);

  let targetFileHandle = await getTargetFileHandle(fileNameForDownloading);

  let response = await callBlobReadStreamApi(bucketId, fileId);

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

  let fileStream = await targetFileHandle.createWritable();

  await decryptedReadableStream.pipeTo(fileStream);

  try {
    await decryptedReadableStream.cancel();
  } catch (ex) {}

  return true;
};
