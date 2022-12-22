import type { Session } from "src/model/common.js";
import { storedSession } from "../store/session.js";
import { callPostJsonApi } from "../utility/api-utils.js";

export const callUserLoginApi = async (
  serverBaseUrl: string,
  data: { userName; password }
) => {
  return await callPostJsonApi(serverBaseUrl, null, "/api/user/login", data);
};

let _storedSession: Session = null;
storedSession.subscribe((value) => (_storedSession = value));

export const callUserLogoutApi = async (data: { message }) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/user/logout",
    data
  );
};

export const callUserFindApi = async (data: {
  filters: { by: string; userName: string; userId: string }[];
  includeGlobalPermissions: boolean;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/user/find",
    data
  );
};

export const callUserUpdatePasswordApi = async (data: {
  currentPassword;
  newPassword;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/user/update-password",
    data
  );
};

export const callUserUpdateProfileApi = async (data: { displayName }) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/user/update-profile",
    data
  );
};

export const callUserListApi = async (data: {}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/user/list",
    data
  );
};

export const callUserSessionListApi = async (data: {}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/user/list-all-sessions",
    data
  );
};

export const callUserSessionLogoutAllApi = async (data: {
  message: string;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/user/logout-all-sessions",
    data
  );
};
