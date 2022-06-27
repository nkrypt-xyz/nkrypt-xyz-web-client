import { callBlobReadApi, callBlobWriteApi } from "../integration/blob-apis.js";
import {
  createEncryptionKeyFromPassword,
  decryptBuffer,
  encryptBuffer,
  makeRandomIv,
  makeRandomSalt,
  IV_LENGTH,
  SALT_LENGTH,
} from "../utility/crypto-utils.js";

import { convertStreamToBuffer } from "../utility/stream-and-buffer-utils.js";

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
  let { iv, key, salt } = cipherProps;

  const totalBytes = file.size;
  let bytesRead = 0;
  progressNotifierFn(totalBytes, bytesRead, 0);

  let inputStream: ReadableStream = file.stream() as any;
  let inputStreamReader = inputStream.getReader();

  let hasIvAndSaltBeenSent = false;

  // Note: We are not using transform streams due to a lack of browser support.
  return new ReadableStream({
    async pull(controller) {
      const { value: chunk, done } = await inputStreamReader.read();

      if (done) {
        controller.close();
        return;
      }

      let encryptedChunk = await encryptBuffer(cipherProps, chunk);

      bytesRead += chunk.length;
      progressNotifierFn(totalBytes, bytesRead, 0);

      if (!hasIvAndSaltBeenSent) {
        console.log("FIRST UP iv", iv);
        console.log("FIRST UP salt", salt);
        console.log("FIRST UP encryptedChunk", encryptedChunk);

        hasIvAndSaltBeenSent = true;

        let oldChunkView = new Uint8Array(encryptedChunk);

        let newChunk = new ArrayBuffer(
          IV_LENGTH + SALT_LENGTH + oldChunkView.length
        );
        let newChunkView = new Uint8Array(newChunk);
        newChunkView.set(iv, 0);
        newChunkView.set(salt, IV_LENGTH);
        newChunkView.set(oldChunkView, IV_LENGTH + SALT_LENGTH);

        encryptedChunk = newChunk;

        console.log("FIRST UP COMBINED encryptedChunk", encryptedChunk);

        {
          let encryptedChunkView = new Uint8Array(encryptedChunk);
          let originalLength = encryptedChunkView.length;

          let iv = encryptedChunkView.slice(0, IV_LENGTH);
          let salt = encryptedChunkView.slice(
            IV_LENGTH,
            IV_LENGTH + SALT_LENGTH
          );
          let chunkView = encryptedChunkView.slice(
            IV_LENGTH + SALT_LENGTH,
            originalLength
          );
          let chunk = chunkView.buffer;
          let { key } = await createEncryptionKeyFromPassword(
            bucketPassword,
            salt
          );

          console.log("TEST iv", iv);
          console.log("TEST salt", salt);
          console.log("TEST REDUCED encryptedChunk", chunk);

          let decryptedChunk = await decryptBuffer({ iv, key }, chunk);

          console.log("DECRYPTED CHUNK", decryptedChunk);
        }
      }
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
    progressNotifierFn,
    bucketPassword
  );

  let response = await callBlobWriteApi(
    bucketId,
    fileId,
    file.size,
    encryptedDataStream
  );

  return response;
};

// First IV_LENGTH bytes are IV and next SALT_LENGTH bytes are salt
const createDeryptedPseudoTransformStream = async (
  inputStream: ReadableStream,
  bucketPassword: string,
  progressNotifierFn: Function
): Promise<ReadableStream<any>> => {
  let salt: Uint8Array = null;
  let iv: Uint8Array = null;
  let key: CryptoKey = null;

  // const totalBytes = file.size;
  // let bytesRead = 0;
  // progressNotifierFn(totalBytes, bytesRead, 0);

  let inputStreamReader = inputStream.getReader();

  // Note: We are not using transform streams due to a lack of browser support.
  return new ReadableStream({
    async pull(controller) {
      let {
        value: encryptedChunk,
        done,
      }: { value?: Uint8Array | ArrayBuffer; done: boolean } =
        await inputStreamReader.read();

      if (done) {
        controller.close();
        return;
      }

      if (!encryptedChunk) {
        throw new Error("Expected encryptedChunk");
      }

      if (encryptedChunk instanceof ArrayBuffer) {
        console.log(
          "Surprisingly got ArrayBuffer where Uint8Array was expected. Moving on."
        );
      } else if (encryptedChunk instanceof Uint8Array) {
        // convert to ArrayBuffer
        encryptedChunk = encryptedChunk.buffer;
      } else {
        console.log("Invalid type", encryptedChunk);
        throw new Error("Expected encryptedChunk to be an Uint8Array.");
      }

      if (!salt && !iv) {
        // This is the first ever transmission
        console.log("FIRST DOWN COMBINED encryptedChunk", encryptedChunk);

        let encryptedChunkView = new Uint8Array(encryptedChunk);

        if (encryptedChunkView.length < IV_LENGTH + SALT_LENGTH) {
          throw new Error(
            "Unexpected edge case. Did not expect chunk to be so small"
          );
        }

        iv = encryptedChunkView.slice(0, IV_LENGTH);
        salt = encryptedChunkView.slice(IV_LENGTH, IV_LENGTH + SALT_LENGTH);
        ({ key } = await createEncryptionKeyFromPassword(bucketPassword, salt));

        let newEncryptedChunkView = encryptedChunkView.slice(
          IV_LENGTH + SALT_LENGTH,
          encryptedChunkView.length
        );
        let newEncryptedChunk = newEncryptedChunkView.buffer;

        console.log("FIRST DOWN iv", iv);
        console.log("FIRST DOWN salt", salt);
        console.log("FIRST DOWN REDUCED encryptedChunk", newEncryptedChunk);

        let decryptedChunk = await decryptBuffer(
          { iv, key },
          newEncryptedChunk
        );
        controller.enqueue(decryptedChunk);
      } else {
        let decryptedChunk = await decryptBuffer({ iv, key }, encryptedChunk);
        controller.enqueue(decryptedChunk);
      }
    },
  });
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

export const downloadAndDecryptFile = async (
  bucketId: string,
  fileId: string,
  fileNameForDownloading: string,
  bucketPassword: string,
  progressNotifierFn: Function
) => {
  let response = await callBlobReadApi(bucketId, fileId);

  if (response.hasError) {
    return response;
  }

  let decryptedReadableStream = await createDeryptedPseudoTransformStream(
    response.readableStream,
    bucketPassword,
    progressNotifierFn
  );

  // TODO: Investigate ways to save file directly from stream
  let buffer = await convertStreamToBuffer(decryptedReadableStream);

  initiateFileDownload(buffer, fileNameForDownloading);

  return response;
};
