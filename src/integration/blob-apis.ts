import type { Session } from "src/model/common.js";
import { storedSession } from "../store/session.js";
import { callPostStreamUploadApi } from "../utility/api-utils.js";

let _storedSession: Session = null;
storedSession.subscribe((value) => (_storedSession = value));

export const callBlobWriteApi = async (
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
