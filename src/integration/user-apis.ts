import { callPostJsonApi } from "../utility/api-utils.js";

export const callUserLoginApi = async (
  serverBaseUrl: string,
  data: { userName; password }
) => {
  return await callPostJsonApi(serverBaseUrl, "/api/user/login/", data);
};
