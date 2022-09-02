import { ClientError } from "./error-handling.js";

export const features = {
  VFS: "VFS",
};

export const requireFeature = async (feature: string) => {
  if (feature === features.VFS) {
    if (!(<any>window).showSaveFilePicker) {
      const message =
        "Your device/browser does not support directly saving files to the file system. Try updating your browser (if available) or try using another browser.";
      throw new ClientError("FEATURE_REQUIRED", message);
    }
  }
};
