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
        message:
          "Failed to establish a connection with the server. Please make sure you have a working internet connection. If you believe, everything is in working order on your end, please contact server administrator.",
        details: {},
      },
    };
  }

  return responseJson;
};
