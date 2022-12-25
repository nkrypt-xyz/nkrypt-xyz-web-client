import { pop, push, replace } from "svelte-spa-router";

import { writable } from "svelte/store";

export let hasInternalNavigationStack = writable(false);
let _hasInternalNavigationStack = false;
hasInternalNavigationStack.subscribe((value) => {
  _hasInternalNavigationStack = value;
});

export const navigateToRoute = async (
  path: string,
  options: {
    replaceCurrentRoute: boolean;
  } = {
    replaceCurrentRoute: false,
  }
) => {
  if (options.replaceCurrentRoute) {
    hasInternalNavigationStack.set(true);
    return await push(path);
  } else {
    return await replace(path);
  }
};

export const navigateToPreviousPageOrDashboard = async () => {
  if (_hasInternalNavigationStack) {
    return await pop();
  } else {
    return await navigateToRoute("/dashboard");
  }
};
