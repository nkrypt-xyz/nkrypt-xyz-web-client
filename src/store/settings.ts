import { Writable, writable } from "svelte/store";
import type { Settings } from "../model/common.js";
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from "../utility/store-utils.js";

const SETTINGS_LOCALSTORAGE_KEY = "--settings";

const defaultSettings: Settings = {
  uploadMechanism: "chunkedStream",
  downloadMechanism: "stream",
};

export const storedSettings: Writable<Settings> = writable(
  getLocalStorageItem(SETTINGS_LOCALSTORAGE_KEY) ||
    JSON.parse(JSON.stringify(defaultSettings))
);

export let _storedSettings: Settings = null;

storedSettings.subscribe((value) => {
  _storedSettings = value;
  setLocalStorageItem(SETTINGS_LOCALSTORAGE_KEY, value);
});
