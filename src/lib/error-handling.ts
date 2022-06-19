import {
  decrementActiveGlobalObtrusiveTaskCount,
  showAlert,
} from "../store/ui.js";

export const handleErrorIfAny = async (
  response,
  reduceObtrusiveLoader: boolean = true
): Promise<boolean> => {
  if (!response.hasError) return false;
  let { message } = response.error;
  await showAlert("Error occurred", message);
  if (reduceObtrusiveLoader) {
    decrementActiveGlobalObtrusiveTaskCount();
  }
  return true;
};
