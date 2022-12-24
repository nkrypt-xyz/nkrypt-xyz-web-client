import { Writable, writable } from "svelte/store";
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from "../utility/store-utils.js";

const BUCKET_PREFIX = "bucket_";
const SAVED_PASSWORDS_LOCALSTORAGE_KEY = "--saved-passwords";
let _storedPassword = {};

const storedPassword: Writable<Record<string, any>> = writable(
  getLocalStorageItem(SAVED_PASSWORDS_LOCALSTORAGE_KEY) || {}
);

storedPassword.subscribe((value) => {
  _storedPassword = value;
  setLocalStorageItem(SAVED_PASSWORDS_LOCALSTORAGE_KEY, value);
});

export const getPasswordForBucket = (bucketId) => {
  let key = BUCKET_PREFIX + bucketId;
  if (key in _storedPassword) {
    return _storedPassword[key];
  }
};

export const setPasswordForBucket = (bucketId, encryptionPassword) => {
  let key = BUCKET_PREFIX + bucketId;
  storedPassword.update((map) => {
    map[key] = encryptionPassword;
    return map;
  });
};

export { storedPassword };
