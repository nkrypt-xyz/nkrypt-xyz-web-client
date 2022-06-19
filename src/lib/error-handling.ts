import {
  decrementActiveGlobalObtrusiveTaskCount,
  showAlert,
} from "../store/ui.js";
import { performUserLogout } from "./session.js";

export const handleErrorIfAny = async (
  response,
  reduceObtrusiveLoader: boolean = true
): Promise<boolean> => {
  if (!response.hasError) return false;
  let { message, code } = response.error;
  await showAlert("Error occurred", message);

  if (reduceObtrusiveLoader) {
    decrementActiveGlobalObtrusiveTaskCount();
  }

  const apiKeyErrorCodeList = ["API_KEY_NOT_FOUND", "API_KEY_EXPIRED"];
  if (apiKeyErrorCodeList.indexOf(code) > -1) {
    await performUserLogout();
  }

  return true;
};
