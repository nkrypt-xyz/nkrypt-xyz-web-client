import { clientErrorDef } from "../constant/client-errors.js";
import {
  decrementActiveGlobalObtrusiveTaskCount,
  showAlert,
} from "../store/ui.js";
import { performUserLogout } from "./session.js";

export const handleAnyError = async (
  error: Error,
  reduceObtrusiveLoader: boolean = true
): Promise<boolean> => {
  if (!error || "object" !== typeof error || !(error instanceof Error)) {
    console.log("Unknown type of error found.");
    console.error(error);
    await showAlert("Error occurred", "An unknown type of error occurred.");
    return;
  }

  let code = null;
  let title = "Error occurred";
  if (error instanceof CodedError) {
    let logMessage = `(Handled) ${error.name}: ${error.code} - ${error.message}`;
    console.error(logMessage);

    ({ code } = error);

    if (error.code in clientErrorDef) {
      title = clientErrorDef[error.code].shorthand;
    }
  } else {
    let logMessage = `(Handled) ${error.name}: ${error.message}`;
    console.error(logMessage);
  }

  let message = error.message || "An unidentified error occurred";
  await showAlert(title, message);

  if (reduceObtrusiveLoader) {
    decrementActiveGlobalObtrusiveTaskCount();
  }

  const apiKeyErrorCodeList = ["API_KEY_NOT_FOUND", "API_KEY_EXPIRED"];
  if (apiKeyErrorCodeList.indexOf(code) > -1) {
    await performUserLogout();
  }

  return true;
};

export const executeAndHandle = async (
  fn: Function,
  reduceObtrusiveLoader: boolean = true
): Promise<[any, boolean]> => {
  let hadError = false;
  let response;
  try {
    response = await fn();
  } catch (ex) {
    await handleAnyError(ex, reduceObtrusiveLoader);
    hadError = true;
  }
  return [response, hadError];
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

export class ClientError extends CodedError {}

export class ResponseError extends CodedError {}

export function raiseCaughtClientError(
  caughtError: Error,
  clientErrorDef,
  message: string = null
) {
  console.error("Caught and proxied:", caughtError);
  let error = raiseClientError(clientErrorDef, message);
  error.cause = caughtError;
  return error;
}

export function raiseClientError(clientErrorDef, message: string = null) {
  return new ClientError(
    clientErrorDef.code,
    message || clientErrorDef.message
  );
}
