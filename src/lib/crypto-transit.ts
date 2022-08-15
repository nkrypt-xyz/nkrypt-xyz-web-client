import * as cryptoTransitStream from "./crypto-transit-stream.js";
import * as cryptoTransitBasic from "./crypto-transit-basic.js";

export const encryptAndUploadFile = async (
  bucketId: string,
  fileId: string,
  file: File,
  bucketPassword: string,
  progressNotifierFn: Function,
  uploadMethod: string
) => {
  if (uploadMethod === "basic") {
    return await cryptoTransitBasic.encryptAndUploadFile(
      bucketId,
      fileId,
      file,
      bucketPassword,
      progressNotifierFn
    );
  } else if (uploadMethod === "stream") {
    return await cryptoTransitStream.encryptAndUploadFile(
      bucketId,
      fileId,
      file,
      bucketPassword,
      progressNotifierFn
    );
  }

  return null;
};

export const downloadAndDecryptFile = async (
  bucketId: string,
  fileId: string,
  fileNameForDownloading: string,
  bucketPassword: string,
  progressNotifierFn: Function,
  downloadMethod: string
) => {
  if (downloadMethod === "basic") {
    return await cryptoTransitBasic.downloadAndDecryptFile(
      bucketId,
      fileId,
      fileNameForDownloading,
      bucketPassword,
      progressNotifierFn
    );
  } else if (downloadMethod === "stream") {
    return await cryptoTransitStream.downloadAndDecryptFile(
      bucketId,
      fileId,
      fileNameForDownloading,
      bucketPassword,
      progressNotifierFn
    );
  }

  return null;
};
