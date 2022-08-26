import { Writable, writable } from "svelte/store";
import type { User } from "src/model/common.js";
import { CodedError } from "../lib/error-handling.js";
import { clientError } from "../constant/client-errors.js";

let inflatedZIndex = 8;
const STARTING_Z_INDEX = 8;
// ---------------------------------------------- Related utils

const applyInflatingZIndexHack = (className) => {
  setTimeout(() => {
    let maxZIndex = Array.from(document.querySelectorAll(".mdc-dialog")).reduce(
      (currentMax, el) => {
        return Math.max(currentMax, (<any>el).style.zIndex || 0);
      },
      STARTING_Z_INDEX
    );

    inflatedZIndex = maxZIndex + 1;
    (<any>document.querySelector(className)).style.zIndex =
      String(inflatedZIndex);
  }, 100);
};

// ---------------------------------------------- Global Obtrusive Task

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

// ---------------------------------------------- Confirmation Dialog

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
    applyInflatingZIndexHack(".nk-confirmation-dialog");
    confirmationDialog.set({ title, message });
  });
};

// ---------------------------------------------- Alert Dialog

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
    applyInflatingZIndexHack(".nk-alert-dialog");
    alertDialog.set({ title, message });
  });
};

// ---------------------------------------------- Bucket Password Dialog

export let bucketPasswordDialog: Writable<{ bucketName: string }> =
  writable(null);

export let bucketPasswordDialogResponse: Writable<{ bucketPassword: string }> =
  writable(null);

export let showBucketPasswordDialog = (bucketName) => {
  return new Promise((accept) => {
    bucketPasswordDialogResponse.set(null);
    let unsubscribe = bucketPasswordDialogResponse.subscribe((value) => {
      if (value === null) return;
      accept(value);
      unsubscribe();
    });
    applyInflatingZIndexHack(".nk-bucket-password-dialog");
    bucketPasswordDialog.set({ bucketName });
  });
};

// ---------------------------------------------- Prompt Dialog

export let promptDialog: Writable<{ title: string; message: string }> =
  writable(null);

export let promptDialogResponse: Writable<string> = writable(null);

export let showPrompt = (title, message) => {
  return new Promise<string>((accept) => {
    promptDialogResponse.set(null);
    let unsubscribe = promptDialogResponse.subscribe((value) => {
      if (value === null) return;
      accept(value);
      unsubscribe();
    });
    applyInflatingZIndexHack(".nk-prompt-dialog");
    promptDialog.set({ title, message });
  });
};

// ---------------------------------------------- Common Error Alert Dialog

export let showCommonErrorDialog = async (ex: Error) => {
  console.error(ex);

  let title = "Error occurred";
  let message = "An unknown error occurred.";

  if (ex && "object" === typeof ex) {
    if (ex instanceof CodedError && ex.code in clientError) {
      title = clientError[ex.code].shorthand;
    }

    if (ex.message) {
      message = ex.message;
    }
  }

  return await showAlert(title, message);
};
