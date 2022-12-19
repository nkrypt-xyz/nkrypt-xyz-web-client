import type { Session } from "src/model/common.js";
import { storedSession } from "../store/session.js";
import { callPostJsonApi } from "../utility/api-utils.js";

let _storedSession: Session = null;
storedSession.subscribe((value) => (_storedSession = value));

export const callBucketListApi = async (data: {}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/bucket/list",
    data
  );
};

export const callBucketCreateApi = async (data: {
  name: string;
  cryptSpec: string;
  cryptData: string;
  metaData: Record<string, any>;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/bucket/create",
    data
  );
};

export const callBucketSetAuthorizationApi = async (data: {
  targetUserId: string;
  bucketId: string;
  permissionsToSet: Record<string, boolean>;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/bucket/set-authorization",
    data
  );
};

export const callDirectoryGetApi = async (data: { bucketId; directoryId }) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/directory/get",
    data
  );
};

export const callDirectoryRenameApi = async (data: {
  bucketId;
  directoryId;
  name;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/directory/rename",
    data
  );
};

export const callDirectoryDeleteApi = async (data: {
  bucketId;
  directoryId;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/directory/delete",
    data
  );
};

export const callDirectoryCreateApi = async (data: {
  name: string;
  bucketId: string;
  parentDirectoryId: string;
  metaData: Record<string, any>;
  encryptedMetaData: string;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/directory/create",
    data
  );
};

export const callFileGetApi = async (data: { bucketId; fileId }) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/file/get",
    data
  );
};

export const callFileCreateApi = async (data: {
  name: string;
  bucketId: string;
  parentDirectoryId: string;
  metaData: Record<string, any>;
  encryptedMetaData: string;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/file/create",
    data
  );
};

export const callFileDeleteApi = async (data: { bucketId; fileId }) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/file/delete",
    data
  );
};

export const callFileRenameApi = async (data: { bucketId; fileId; name }) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/file/rename",
    data
  );
};

export const callFileSetMetaDataApi = async (data: {
  bucketId;
  fileId;
  metaData;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/file/set-metadata",
    data
  );
};

export const callFileSetEncryptedMetaDataApi = async (data: {
  bucketId;
  fileId;
  encryptedMetaData;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/file/set-encrypted-metadata",
    data
  );
};
