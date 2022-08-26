import { clientError } from "../constant/client-errors.js";
import { CodedError, raiseClientError } from "../lib/error-handling.js";
import { BLOB_API_CRYPTO_META_HEADER_NAME } from "../lib/crypto-specs.js";
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
  readableStream: ReadableStream,
  cryptoHeaderContent: string
) => {
  const url = joinUrlPathFragments(serverBaseUrl, apiUrl);

  let headers = {
    Accept: "application/json",
    "Content-Type": "application/octet-stream",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  headers[BLOB_API_CRYPTO_META_HEADER_NAME] = cryptoHeaderContent;

  // FIXME: Detect browser support for directly sending ReadableStream to fetch call
  let buffer = await convertStreamToBuffer(readableStream);
  console.warn("Converted to <ArrayBuffer> as fallback", buffer);

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
    Accept: "*",
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
      cryptoHeaderContent: responseObject.headers.get(
        BLOB_API_CRYPTO_META_HEADER_NAME
      ),
      contentLengthOnServer: parseInt(
        responseObject.headers.get("Content-Length")
      ),
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

export const callPostArrayBufferUploadApi = async (
  serverBaseUrl: string,
  authToken: string | null,
  apiUrl: string,
  sourceContentLength: number,
  arrayBuffer: ArrayBuffer,
  cryptoHeaderContent: string,
  progressNotifierFn: Function
) => {
  const url = joinUrlPathFragments(serverBaseUrl, apiUrl);

  console.debug("Basic upload. Encrypted <ArrayBuffer>:", arrayBuffer);

  let responseJson = null;
  try {
    // xhr - start
    let responseObject = await new Promise<XMLHttpRequest>((accept, reject) => {
      var xhr = new XMLHttpRequest();

      xhr.open("POST", url);

      xhr.setRequestHeader("Accept", "application/json");
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
      xhr.setRequestHeader(
        BLOB_API_CRYPTO_META_HEADER_NAME,
        cryptoHeaderContent
      );

      xhr.upload.onprogress = function (e) {
        progressNotifierFn(
          sourceContentLength,
          sourceContentLength,
          sourceContentLength * (e.loaded / e.total)
        );
      };

      xhr.onload = function (event) {
        accept(xhr);
      };

      xhr.onerror = (event) => {
        reject(xhr);
      };

      xhr.onabort = (event) => {
        reject(xhr);
      };

      xhr.send(arrayBuffer);
    });
    // xhr - end

    responseJson = JSON.parse(responseObject.responseText);
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

export const callPostArrayBufferDownloadApi = async (
  serverBaseUrl: string,
  authToken: string | null,
  apiUrl: string,
  progressNotifierFn: Function
) => {
  const url = joinUrlPathFragments(serverBaseUrl, apiUrl);

  let responseJson = null;
  try {
    // xhr - start
    let responseObject = await new Promise<XMLHttpRequest>((accept, reject) => {
      var xhr = new XMLHttpRequest();

      xhr.responseType = "arraybuffer";

      xhr.open("POST", url);

      xhr.setRequestHeader("Accept", "*");
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);

      xhr.onprogress = function (e) {
        progressNotifierFn(e.total, e.loaded, 0);
      };

      xhr.onload = function (event) {
        accept(xhr);
      };

      xhr.onerror = (event) => {
        let error = raiseClientError(clientError.ENCRYPTED_DOWNLOAD_FAILED);
        (<any>error).details = {
          xhr,
          event,
        };
        reject(error);
      };

      xhr.onabort = (event) => {
        let error = raiseClientError(clientError.ENCRYPTED_DOWNLOAD_FAILED);
        (<any>error).details = {
          xhr,
          event,
        };
        reject(error);
      };

      xhr.send("{}");
    });
    // xhr - end

    responseJson = {
      hasError: false,
      arrayBuffer: responseObject.response,
      cryptoHeaderContent: responseObject.getResponseHeader(
        BLOB_API_CRYPTO_META_HEADER_NAME
      ),
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
