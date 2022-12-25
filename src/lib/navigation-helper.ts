import {
  getTabStorageItem,
  setTabStorageItem,
} from "../utility/store-utils.js";
import { pop, push, replace } from "svelte-spa-router";
import { writable } from "svelte/store";

const INTERNAL_NAV_STACK_KEY = "--nav-stack-exists";

export let hasInternalNavigationStack = writable(
  getTabStorageItem(INTERNAL_NAV_STACK_KEY)
);

let _hasInternalNavigationStack = false;
hasInternalNavigationStack.subscribe((value) => {
  console.log("_hasInternalNavigationStack", _hasInternalNavigationStack);
  _hasInternalNavigationStack = value;
  setTabStorageItem(INTERNAL_NAV_STACK_KEY, value);
});

export const navigateToRoute = async (
  path: string,
  options: {
    replaceCurrentRoute: boolean;
  } = {
    replaceCurrentRoute: false,
  }
) => {
  if (!options.replaceCurrentRoute) {
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
