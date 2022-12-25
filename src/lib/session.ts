import { callUserLogoutApi } from "../integration/user-apis.js";
import { storedPassword } from "../store/password.js";
import { storedSession } from "../store/session.js";
import {
  decrementActiveGlobalObtrusiveTaskCount,
  incrementActiveGlobalObtrusiveTaskCount,
} from "../store/ui.js";
import { storedUser } from "../store/user.js";
import { navigateToRoute } from "./navigation-helper.js";

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
    navigateToRoute("/", { replaceCurrentRoute: true });
  }
  decrementActiveGlobalObtrusiveTaskCount();
};
