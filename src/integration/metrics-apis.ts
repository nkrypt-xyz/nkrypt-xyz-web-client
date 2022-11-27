import type { Session } from "src/model/common.js";
import { storedSession } from "../store/session.js";
import { callPostJsonApi } from "../utility/api-utils.js";

let _storedSession: Session = null;
storedSession.subscribe((value) => (_storedSession = value));

export const callMetricsGetSummaryApi = async (data: {}) => {
  return await callPostJsonApi(
    _storedSession.serverUrl,
    _storedSession.apiKey,
    "/api/metrics/get-summary",
    data
  );
};
