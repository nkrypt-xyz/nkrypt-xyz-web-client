import type { Session } from "src/model/common.js";
import { storedSession } from "../store/session.js";
import {
  callPostStreamUploadApi,
  callPostStreamDownloadApi,
  callPostArrayBufferUploadApi,
  callPostArrayBufferDownloadApi,
} from "../utility/api-utils.js";

let _storedSession: Session = null;
storedSession.subscribe((value) => (_storedSession = value));

export const callBlobWriteStreamApi = async (
  bucketId,
  fileId,
  contentLength: number,
  data: ReadableStream
) => {
  return await callPostStreamUploadApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    `/api/blob/write/${bucketId}/${fileId}`,
    contentLength,
    data
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
  contentLength: number,
  data: ArrayBuffer,
  cryptoHeaderContent: string
) => {
  return await callPostArrayBufferUploadApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    `/api/blob/write/${bucketId}/${fileId}`,
    contentLength,
    data,
    cryptoHeaderContent
  );
};

export const callBlobReadBasicApi = async (bucketId, fileId) => {
  return await callPostArrayBufferDownloadApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    `/api/blob/read/${bucketId}/${fileId}`
  );
};

