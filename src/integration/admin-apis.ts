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

export const callAdminAddUserApi = async (data: {
  displayName: string;
  userName: string;
  password: string;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/admin/iam/add-user",
    data
  );
};

export const callAdminSetGlobalPermissionsApi = async (data: {
  userId: string;
  globalPermissions: Record<string, boolean>;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/admin/iam/set-global-permissions",
    data
  );
};

export const callAdminSetBanningStatusApi = async (data: {
  userId: string;
  isBanned: boolean;
}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/admin/iam/set-banning-status",
    data
  );
};
