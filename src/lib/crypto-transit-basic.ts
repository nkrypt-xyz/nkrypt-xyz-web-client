import { convertSmallUint8ArrayToString, convertSmallStringToBuffer } from "../utility/buffer-utils.js";
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
  IV_LENGTH,
  SALT_LENGTH,
} from "../utility/crypto-utils.js";
import { BUCKET_CRYPTO_SPEC } from "./crypto.js";

const createCipherProperties = async (bucketPassword: string) => {
  let { iv } = await makeRandomIv();
  let { salt } = await makeRandomSalt();
  let { key } = await createEncryptionKeyFromPassword(bucketPassword, salt);
  return { iv, key, salt };
};

const buildCryptoHeader = (iv, salt) => {
  return `${BUCKET_CRYPTO_SPEC}|${iv}|${salt}`;
};

const unbuildCryptoHeader = (cryptoHeader) => {
  let [_, iv, salt] = cryptoHeader.split('|');
  iv = convertSmallStringToBuffer(iv);
  salt = convertSmallStringToBuffer(salt);
  return [iv, salt];
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
  let encryptedBuffer = await encryptBuffer(cipherProps, buffer);

  let iv = convertSmallUint8ArrayToString(cipherProps.iv);
  let salt = convertSmallUint8ArrayToString(cipherProps.salt);
  let cryptoHeader = buildCryptoHeader(iv, salt);

  let response = await callBlobWriteBasicApi(
    bucketId,
    fileId,
    file.size,
    encryptedBuffer,
    cryptoHeader
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

export const downloadAndDecryptFile = async (
  bucketId: string,
  fileId: string,
  fileNameForDownloading: string,
  bucketPassword: string,
  progressNotifierFn: Function
) => {
  let response = await callBlobReadBasicApi(bucketId, fileId);
  let {cryptoHeaderContent, arrayBuffer} = response;

  let [iv, salt] = unbuildCryptoHeader(cryptoHeaderContent);
  let { key } = await createEncryptionKeyFromPassword(
    bucketPassword,
    salt
  );

  let decryptedArrayBuffer = await decryptBuffer({ iv, key }, arrayBuffer);

  initiateFileDownload(decryptedArrayBuffer, fileNameForDownloading);

  return null;
};
