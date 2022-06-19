import { callUserLogoutApi } from "../integration/user-apis.js";
import { currentSession } from "../store/session.js";
import {
  decrementActiveGlobalObtrusiveTaskCount,
  incrementActiveGlobalObtrusiveTaskCount,
} from "../store/ui.js";
import { currentUser } from "../store/user.js";
import { replace } from "svelte-spa-router";

export const performUserLogout = async () => {
  incrementActiveGlobalObtrusiveTaskCount();
  let response = await callUserLogoutApi({
    message: "Manually pressed logout button",
  });
  currentUser.set(null);
  currentSession.set(null);
  replace("/");
  decrementActiveGlobalObtrusiveTaskCount();
};
