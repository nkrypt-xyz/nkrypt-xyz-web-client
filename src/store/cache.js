import { writable } from "svelte/store";

const LAST_USED_SERVER_URL_KEY = "lastUsedServerUrl";

const lastUsedServerUrl = localStorage.getItem(LAST_USED_SERVER_URL_KEY);

export const defaultServerToShow = writable(
  lastUsedServerUrl || "http://localhost:9041"
);
