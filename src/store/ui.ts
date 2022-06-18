import { Writable, writable } from "svelte/store";
import type { User } from "src/model/common.js";

export let activeGlobalObtrusiveTaskCount = writable(0);
let _activeGlobalObtrusiveTaskCount = 0;

activeGlobalObtrusiveTaskCount.subscribe((value) => {
  _activeGlobalObtrusiveTaskCount = value;
});

export const incrementActiveGlobalObtrusiveTaskCount = () => {
  activeGlobalObtrusiveTaskCount.update((value) => value + 1);
};

export const decrementActiveGlobalObtrusiveTaskCount = () => {
  setTimeout(() => {
    activeGlobalObtrusiveTaskCount.update((value) => Math.max(value - 1, 0));
  }, 100);
};

export let confirmationDialog: Writable<{ title: string; message: string }> =
  writable(null);

export let confirmationDialogResponse: Writable<boolean> = writable(null);

export let showConfirmation = (title, message) => {
  return new Promise((accept) => {
    confirmationDialogResponse.set(null);
    let unsubscribe = confirmationDialogResponse.subscribe((value) => {
      if (value === null) return;
      accept(value);
      unsubscribe();
    });
    confirmationDialog.set({ title, message });
  });
};

export let alertDialog: Writable<{ title: string; message: string }> =
  writable(null);

// setting type as boolean to be able to perorm null checks
export let alertDialogResponse: Writable<boolean> = writable(null);

export let showAlert = (title, message) => {
  return new Promise((accept) => {
    alertDialogResponse.set(null);
    let unsubscribe = alertDialogResponse.subscribe((value) => {
      if (value === null) return;
      accept(value);
      unsubscribe();
    });
    alertDialog.set({ title, message });
  });
};
