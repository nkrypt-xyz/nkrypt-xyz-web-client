import {
  getLocalStorageItem,
  setLocalStorageItem,
} from "../utility/store-utils.js";
import { Writable, writable } from "svelte/store";
import type { Session } from "../model/common.js";

const SESSION_LOCALSTORAGE_KEY = "--session";

export const storedSession: Writable<Session> = writable(
  getLocalStorageItem(SESSION_LOCALSTORAGE_KEY)
);

export let _storedSession: Session = null;

storedSession.subscribe((value) => {
  _storedSession = value;
  setLocalStorageItem(SESSION_LOCALSTORAGE_KEY, value);
});
