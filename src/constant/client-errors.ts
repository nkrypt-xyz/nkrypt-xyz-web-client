export const clientError = {
  DECRYPTION_FAILED: {
    code: "DECRYPTION_FAILED",
    message:
      "Failed to decrypt the file. Most likely the file has been corrupted during transmission to or storage on the server.",
    shorthand: "Decryption failed",
  },
  ENCRYPTED_DOWNLOAD_FAILED: {
    code: "ENCRYPTED_DOWNLOAD_FAILED",
    message: "Failed to download encrypted file from the server",
    shorthand: "Download failed",
  },
  FAILED_TO_SAVE_FILE: {
    code: "FAILED_TO_SAVE_FILE",
    message: "Failed to save file after decryption",
    shorthand: "Filesystem failure",
  },
};
