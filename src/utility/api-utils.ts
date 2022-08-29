import { clientErrorDef } from "../constant/client-errors.js";
import { BLOB_API_CRYPTO_META_HEADER_NAME } from "../constant/crypto-specs.js";
import { ResponseError } from "../lib/error-handling.js";
import { convertStreamToBuffer } from "./stream-and-buffer-utils.js";

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
  try {
    let fetchResponse = await fetch(url, options);
    responseJson = await fetchResponse.json();
  } catch (ex) {
    console.error(ex);
    throw new ResponseError(
      clientErrorDef.NKRE_CONNECTIVITY_ISSUE.code,
      clientErrorDef.NKRE_CONNECTIVITY_ISSUE.message
    );
  }

  if (responseJson.hasError) {
    let code =
      responseJson.error?.code ||
      clientErrorDef.NKRE_MALFORMATTED_RESPONSE.code;
    let message =
      responseJson.error?.message ||
      clientErrorDef.NKRE_MALFORMATTED_RESPONSE.message;
    throw new ResponseError(code, message);
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
  try {
    let fetchResponse = await fetch(url, options);
    responseJson = await fetchResponse.json();
  } catch (ex) {
    console.error(ex);
    throw new ResponseError(
      clientErrorDef.NKRE_CONNECTIVITY_ISSUE.code,
      clientErrorDef.NKRE_CONNECTIVITY_ISSUE.message
    );
  }

  if (responseJson.hasError) {
    let code =
      responseJson.error?.code ||
      clientErrorDef.NKRE_MALFORMATTED_RESPONSE.code;
    let message =
      responseJson.error?.message ||
      clientErrorDef.NKRE_MALFORMATTED_RESPONSE.message;
    throw new ResponseError(code, message);
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
  try {
    let fetchResponse = await fetch(url, options);
    responseJson = {
      hasError: false,
      readableStream: fetchResponse.body,
      cryptoHeaderContent: fetchResponse.headers.get(
        BLOB_API_CRYPTO_META_HEADER_NAME
      ),
      contentLengthOnServer: parseInt(
        fetchResponse.headers.get("Content-Length")
      ),
    };
  } catch (ex) {
    console.error(ex);
    throw new ResponseError(
      clientErrorDef.NKRE_CONNECTIVITY_ISSUE.code,
      clientErrorDef.NKRE_CONNECTIVITY_ISSUE.message
    );
  }

  if (responseJson.hasError) {
    let code =
      responseJson.error?.code ||
      clientErrorDef.NKRE_MALFORMATTED_RESPONSE.code;
    let message =
      responseJson.error?.message ||
      clientErrorDef.NKRE_MALFORMATTED_RESPONSE.message;
    throw new ResponseError(code, message);
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
    throw new ResponseError(
      clientErrorDef.NKRE_CONNECTIVITY_ISSUE.code,
      clientErrorDef.NKRE_CONNECTIVITY_ISSUE.message
    );
  }

  if (responseJson.hasError) {
    let code =
      responseJson.error?.code ||
      clientErrorDef.NKRE_MALFORMATTED_RESPONSE.code;
    let message =
      responseJson.error?.message ||
      clientErrorDef.NKRE_MALFORMATTED_RESPONSE.message;
    throw new ResponseError(code, message);
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
        reject(xhr);
      };

      xhr.onabort = (event) => {
        reject(xhr);
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
    throw new ResponseError(
      clientErrorDef.NKRE_CONNECTIVITY_ISSUE.code,
      clientErrorDef.NKRE_CONNECTIVITY_ISSUE.message
    );
  }

  if (responseJson.hasError) {
    let code =
      responseJson.error?.code ||
      clientErrorDef.NKRE_MALFORMATTED_RESPONSE.code;
    let message =
      responseJson.error?.message ||
      clientErrorDef.NKRE_MALFORMATTED_RESPONSE.message;
    throw new ResponseError(code, message);
  }

  return responseJson;
};
