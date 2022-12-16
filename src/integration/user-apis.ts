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
