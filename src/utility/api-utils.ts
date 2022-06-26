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
  let buffer = await convertStreamToBufferForCompatibility(readableStream);

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

const convertStreamToBufferForCompatibility = async (
  readableStream: ReadableStream
) => {
  let arrayBufferList = [];

  let reader = readableStream.getReader();
  while (true) {
    let { done, value: chunk } = await reader.read();
    await new Promise((accept) => setTimeout(accept, 40));
    if (done) break;
    arrayBufferList.push(chunk);
  }

  let totalLength = 0;
  arrayBufferList.forEach((arrayBuffer) => {
    let view = new Uint8Array(arrayBuffer);
    totalLength += view.length;
  });

  let resultBuffer = new ArrayBuffer(totalLength);
  let resultView = new Uint8Array(resultBuffer);

  let startIndex = 0;
  for (let arrayBuffer of arrayBufferList) {
    const view = new Uint8Array(arrayBuffer);
    resultView.set(view, length);
    startIndex += view.length;
  }

  return resultBuffer;
};
