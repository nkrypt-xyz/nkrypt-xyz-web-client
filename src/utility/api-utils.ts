import { convertStreamToBuffer } from "./stream-and-buffer-utils.js";

const genericConnectionFailureMessage =
  "Failed to establish a connection with the server. Please make sure you have a working internet connection. If you believe, everything is in working order on your end, please contact server administrator.";

export const joinUrlPathFragments = (...pathFragments: string[]) => {
  return pathFragments.map((str) => str.replace(/^\/+|\/+$/g, "")).join("/");
};

export const callPostJsonApi = async (
  serverBaseUrl: string,
  authToken: string | null,
  apiUrl: string,
  data: any
) => {
  const url = joinUrlPathFragments(serverBaseUrl, apiUrl);

  let headers = {
    Accept: "application/json",
    "Content-Type": "application/json;charset=UTF-8",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const options = {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  };

  let responseJson = null;
  let responseObject = null;

  try {
    responseObject = await fetch(url, options);
    responseJson = await responseObject.json();
  } catch (ex) {
    console.error(ex);
    responseJson = {
      hasError: true,
      error: {
        code: "SERVER_CONNECTION_FAILURE",
        message: genericConnectionFailureMessage,
        details: {},
      },
    };
  }

  return responseJson;
};

export const callPostStreamUploadApi = async (
  serverBaseUrl: string,
  authToken: string | null,
  apiUrl: string,
  contentLength: number,
  readableStream: ReadableStream
) => {
  const url = joinUrlPathFragments(serverBaseUrl, apiUrl);

  let headers = {
    Accept: "application/json",
    "Content-Type": "application/octet-stream",
    // "Content-Length": String(contentLength),
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // FIXME: Detect browser support for directly sending ReadableStream to fetch call
  let buffer = await convertStreamToBuffer(readableStream);

  const options: any = {
    method: "POST",
    headers,
    body: buffer,
  };

  let responseJson = null;
  let responseObject = null;
  try {
    responseObject = await fetch(url, options);
    responseJson = await responseObject.json();
  } catch (ex) {
    console.error(ex);
    responseJson = {
      hasError: true,
      error: {
        code: "SERVER_CONNECTION_FAILURE",
        message: genericConnectionFailureMessage,
        details: {},
      },
    };
  }

  return responseJson;
};

export const callPostStreamDownloadApi = async (
  serverBaseUrl: string,
  authToken: string | null,
  apiUrl: string
) => {
  const url = joinUrlPathFragments(serverBaseUrl, apiUrl);

  let headers = {
    Accept: "application/octet-stream",
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const options: any = {
    method: "POST",
    headers,
    body: {},
  };

  let responseJson = null;
  let responseObject = null;
  try {
    responseObject = await fetch(url, options);
    responseJson = {
      hasError: false,
      readableStream: responseObject.body,
    };
  } catch (ex) {
    console.error(ex);
    responseJson = {
      hasError: true,
      error: {
        code: "SERVER_CONNECTION_FAILURE",
        message: genericConnectionFailureMessage,
        details: {},
      },
    };
  }

  return responseJson;
};
