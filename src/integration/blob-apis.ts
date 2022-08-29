import type { Session } from "src/model/common.js";
import { storedSession } from "../store/session.js";
import {
  callPostArrayBufferDownloadApi,
  callPostArrayBufferUploadApi,
  callPostStreamDownloadApi,
  callPostStreamUploadApi,
} from "../utility/api-utils.js";

let _storedSession: Session = null;
storedSession.subscribe((value) => (_storedSession = value));

export const callBlobWriteStreamApi = async (
  bucketId,
  fileId,
  contentLength: number,
  data: ReadableStream,
  cryptoHeaderContent: string
) => {
  return await callPostStreamUploadApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    `/api/blob/write/${bucketId}/${fileId}`,
    contentLength,
    data,
    cryptoHeaderContent
  );
};

export const callBlobReadStreamApi = async (bucketId, fileId) => {
  return await callPostStreamDownloadApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    `/api/blob/read/${bucketId}/${fileId}`
  );
};

export const callBlobWriteBasicApi = async (
  bucketId,
  fileId,
  sourceContentLength: number,
  data: ArrayBuffer,
  cryptoHeaderContent: string,
  progressNotifierFn: Function
) => {
  return await callPostArrayBufferUploadApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    `/api/blob/write/${bucketId}/${fileId}`,
    sourceContentLength,
    data,
    cryptoHeaderContent,
    progressNotifierFn
  );
};

export const callBlobReadBasicApi = async (
  bucketId,
  fileId,
  progressNotifierFn: Function
) => {
  return await callPostArrayBufferDownloadApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    `/api/blob/read/${bucketId}/${fileId}`,
    progressNotifierFn
  );
};

export const callBlobWriteQuantizedApi = async (
  bucketId,
  fileId,
  sourceContentLength: number,
  data: ArrayBuffer,
  cryptoHeaderContent: string,
  progressNotifierFn: Function,
  blobId,
  offset,
  shouldEnd
) => {
  return await callPostArrayBufferUploadApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    `/api/blob/write-quantized/${bucketId}/${fileId}/${blobId}/${offset}/${shouldEnd}`,
    sourceContentLength,
    data,
    cryptoHeaderContent,
    progressNotifierFn
  );
};
