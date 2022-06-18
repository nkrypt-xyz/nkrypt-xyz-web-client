import type { Session } from "src/model/common.js";
import { currentSession } from "../store/session.js";
import { callPostJsonApi } from "../utility/api-utils.js";

let _currentSession: Session = null;
currentSession.subscribe((value) => (_currentSession = value));

export const callBucketListApi = async (data: {}) => {
  return await callPostJsonApi(
    _currentSession.serverUrl,
    _currentSession.apiKey,
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
    _currentSession.serverUrl,
    _currentSession.apiKey,
    "/api/bucket/create",
    data
  );
};
