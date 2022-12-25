import { push, replace } from "svelte-spa-router";

export const navigateToRoute = async (
  path: string,
  options: {
    replaceCurrentRoute: boolean;
  } = {
    replaceCurrentRoute: false,
  }
) => {
  if (options.replaceCurrentRoute) {
    return await push(path);
  } else {
    return await replace(path);
  }
};

export const navigateToPreviousPageOrDashboard = () => {};
