import type { Session } from "src/model/common.js";
import { currentSession } from "../store/session.js";
import { callPostJsonApi } from "../utility/api-utils.js";

export const callUserLoginApi = async (
  serverBaseUrl: string,
  data: { userName; password }
) => {
  return await callPostJsonApi(serverBaseUrl, null, "/api/user/login", data);
};

let _currentSession: Session = null;
currentSession.subscribe((value) => (_currentSession = value));

export const callUserLogoutApi = async (data: { message }) => {
  return await callPostJsonApi(
    _currentSession.serverUrl,
    _currentSession.apiKey,
    "/api/user/logout",
    data
  );
};