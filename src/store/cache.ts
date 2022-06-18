import {
  getLocalStorageItem,
  setLocalStorageItem,
} from "../utility/store-utils.js";
import { Writable, writable } from "svelte/store";

const DEFAULT_SERVER_URL = "http://localhost:9041";

const LAST_USED_SERVER_URL_LOCALSTORAGE_KEY = "--cache--lastUsedServerUrl";

export const defaultServerToShow: Writable<string> = writable(
  getLocalStorageItem(LAST_USED_SERVER_URL_LOCALSTORAGE_KEY) ||
    DEFAULT_SERVER_URL
);

defaultServerToShow.subscribe((value) => {
  setLocalStorageItem(LAST_USED_SERVER_URL_LOCALSTORAGE_KEY, value);
});
