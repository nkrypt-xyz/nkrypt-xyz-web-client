import { Writable, writable } from "svelte/store";
import { CommonConstant } from "../constant/common-constants.js";
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from "../utility/store-utils.js";

const LAST_USED_SERVER_URL_LOCALSTORAGE_KEY = "--cache--lastUsedServerUrl";

export const suggestedServerUrl: Writable<string> = writable(
  getLocalStorageItem(LAST_USED_SERVER_URL_LOCALSTORAGE_KEY) ||
    CommonConstant.DEFAULT_SERVER_URL
);

suggestedServerUrl.subscribe((value) => {
  setLocalStorageItem(LAST_USED_SERVER_URL_LOCALSTORAGE_KEY, value);
});
