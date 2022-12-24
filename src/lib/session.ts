import { storedPassword } from "../store/password.js";
import { replace } from "svelte-spa-router";
import { callUserLogoutApi } from "../integration/user-apis.js";
import { storedSession } from "../store/session.js";
import {
  decrementActiveGlobalObtrusiveTaskCount,
  incrementActiveGlobalObtrusiveTaskCount,
} from "../store/ui.js";
import { storedUser } from "../store/user.js";

export const performUserLogout = async ({
  navigateToDashboard = true,
} = {}) => {
  incrementActiveGlobalObtrusiveTaskCount();
  try {
    let response = await callUserLogoutApi({
      message: "User initiated logout.",
    });
  } catch (_) {
    ("pass");
  }
  storedUser.set(null);
  storedSession.set(null);
  storedPassword.set({});
  if (navigateToDashboard) {
    replace("/");
  }
  decrementActiveGlobalObtrusiveTaskCount();
};
