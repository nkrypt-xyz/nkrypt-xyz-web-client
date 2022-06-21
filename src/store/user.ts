import {
  getLocalStorageItem,
  setLocalStorageItem,
} from "../utility/store-utils.js";
import { Writable, writable } from "svelte/store";
import type { User } from "src/model/common.js";

const USER_LOCALSTORAGE_KEY = "--user";

export const storedUser: Writable<User> = writable(
  getLocalStorageItem(USER_LOCALSTORAGE_KEY)
);

storedUser.subscribe((value) => {
  setLocalStorageItem(USER_LOCALSTORAGE_KEY, value);
});
