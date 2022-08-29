import { replace } from "svelte-spa-router";
import { callUserLogoutApi } from "../integration/user-apis.js";
import { storedSession } from "../store/session.js";
import {
  decrementActiveGlobalObtrusiveTaskCount,
  incrementActiveGlobalObtrusiveTaskCount,
} from "../store/ui.js";
import { storedUser } from "../store/user.js";

export const performUserLogout = async () => {
  incrementActiveGlobalObtrusiveTaskCount();
  let response = await callUserLogoutApi({
    message: "Manually pressed logout button",
  });
  storedUser.set(null);
  storedSession.set(null);
  replace("/");
  decrementActiveGlobalObtrusiveTaskCount();
};
