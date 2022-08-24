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

class ExtendableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

export class CodedError extends ExtendableError {
  public code: string;

  constructor(code: string, message = "Unnamed error occurred.") {
    super(message);
    this.code = code;
  }
}

export function raiseCaughtClientError(
  exception: Error,
  clientError,
  message: string = null
) {
  console.error("Caught and proxied:", exception);
  let error = raiseClientError(clientError, message);
  error.cause = exception;
  return error;
}

export function raiseClientError(clientError, message: string = null) {
  return new CodedError(clientError.code, message || clientError.message);
}
