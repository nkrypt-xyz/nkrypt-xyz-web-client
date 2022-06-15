export const joinUrlPathFragments = (...pathFragments: string[]) => {
  return pathFragments.map((str) => str.replace(/^\/+|\/+$/g, "")).join("/");
};

export const callPostJsonApi = async (
  serverBaseUrl: string,
  apiUrl: string,
  data: any
) => {
  const url = joinUrlPathFragments(serverBaseUrl, apiUrl);

  console.log("POST " + url);

  const options = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json;charset=UTF-8",
    },
    body: JSON.stringify(data),
  };

  let response = await fetch(url, options);
  return await response.json();
};
