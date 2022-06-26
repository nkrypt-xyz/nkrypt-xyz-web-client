import { callBlobWriteApi } from "../integration/blob-apis.js";
import {
  createEncryptionKeyFromPassword,
  makeRandomIv,
} from "../utility/crypto-utils.js";

const createCipherProperties = async (bucketPassword: string) => {
  let { iv } = await makeRandomIv();
  let { key, salt } = await createEncryptionKeyFromPassword(
    bucketPassword,
    null
  );
  return { iv, key, salt };
};

const encryptBuffer = async ({ iv, key }, buffer) => {
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    buffer
  );
  return encryptedBuffer;
};

const createEncryptedPseudoTransformStream = async (
  file: File,
  cipherProps: { iv; key; salt },
  progressNotifierFn: Function
): Promise<ReadableStream<any>> => {
  const totalBytes = file.size;
  let bytesRead = 0;
  progressNotifierFn(totalBytes, bytesRead, 0);

  let inputStream: ReadableStream<any> = file.stream() as any;
  let inputStreamReader = inputStream.getReader();

  // Note: We are not using transform streams due to a lack of browser support.
  return new ReadableStream({
    async pull(controller) {
      const { value: chunk, done } = await inputStreamReader.read();

      if (done) {
        controller.close();
        return;
      }

      const encryptedChunk = await encryptBuffer(cipherProps, chunk);

      bytesRead += chunk.length;
      progressNotifierFn(totalBytes, bytesRead, 0);

      controller.enqueue(encryptedChunk);
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
    progressNotifierFn
  );

  let response = await callBlobWriteApi(
    bucketId,
    fileId,
    file.size,
    encryptedDataStream
  );

  return response;
};
