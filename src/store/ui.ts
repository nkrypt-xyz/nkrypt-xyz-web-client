import { Writable, writable } from "svelte/store";
import { clientErrorDef } from "../constant/client-errors.js";
import { ClientError } from "../lib/error-handling.js";

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
    try {
      (<any>document.querySelector(className)).style.zIndex =
        String(inflatedZIndex);
    } catch (ex) {
      ("pass");
    }
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

// ---------------------------------------------- Confirmation Three State Dialog

export const ThreeStateConfirmationState = {
  YES: "YES",
  NO: "NO",
  CANCEL: "CANCEL",
};

export let confirmationThreeStateDialog: Writable<{
  title: string;
  message: string;
}> = writable(null);

export let confirmationThreeStateDialogResponse: Writable<boolean> =
  writable(null);

export let showThreeStateConfirmation = (title, message) => {
  return new Promise((accept) => {
    confirmationThreeStateDialogResponse.set(null);
    let unsubscribe = confirmationThreeStateDialogResponse.subscribe(
      (value) => {
        if (value === null) return;
        accept(value);
        unsubscribe();
      }
    );
    applyInflatingZIndexHack(".nk-confirmation-three-state-dialog");
    confirmationThreeStateDialog.set({ title, message });
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

// ---------------------------------------------- Update User Password Dialog

export let updateUserPasswordDialog: Writable<{}> = writable(null);

export let updateUserPasswordDialogResponse: Writable<{}> = writable(null);

export let showUpdateUserPasswordDialog = () => {
  return new Promise((accept) => {
    updateUserPasswordDialogResponse.set(null);
    let unsubscribe = updateUserPasswordDialogResponse.subscribe((value) => {
      if (value === null) return;
      accept(value);
      unsubscribe();
    });
    applyInflatingZIndexHack(".nk-update-user-password-dialog");
    updateUserPasswordDialog.set({});
  });
};

// ---------------------------------------------- Update User Profile Dialog

export let updateUserProfileDialog: Writable<{}> = writable(null);

export let updateUserProfileDialogResponse: Writable<{}> = writable(null);

export let showUpdateUserProfileDialog = () => {
  return new Promise((accept) => {
    updateUserProfileDialogResponse.set(null);
    let unsubscribe = updateUserProfileDialogResponse.subscribe((value) => {
      if (value === null) return;
      accept(value);
      unsubscribe();
    });
    applyInflatingZIndexHack(".nk-update-user-profile-dialog");
    updateUserProfileDialog.set({});
  });
};

// ---------------------------------------------- Prompt Dialog

export let promptDialog: Writable<{
  title: string;
  message: string;
  defaultValue: string;
}> = writable(null);

export let promptDialogResponse: Writable<string> = writable(null);

export let showPrompt = (title, message, defaultValue) => {
  return new Promise<string>((accept) => {
    promptDialogResponse.set(null);
    let unsubscribe = promptDialogResponse.subscribe((value) => {
      if (value === null) return;
      accept(value);
      unsubscribe();
    });
    applyInflatingZIndexHack(".nk-prompt-dialog");
    promptDialog.set({ title, message, defaultValue });
  });
};

// ---------------------------------------------- Common Error Alert Dialog

export let showCommonErrorDialog = async (ex: Error) => {
  console.error(ex);

  let title = "Error occurred";
  let message = "An unknown error occurred.";

  if (ex && "object" === typeof ex) {
    if (ex instanceof ClientError && ex.code in clientErrorDef) {
      title = clientErrorDef[ex.code].shorthand;
    }

    if (ex.message) {
      message = ex.message;
    }
  }

  return await showAlert(title, message);
};
