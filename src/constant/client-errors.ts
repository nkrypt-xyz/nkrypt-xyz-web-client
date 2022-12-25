export const clientErrorDef = {
  NKCE_DECRYPTION_FAILED: {
    code: "NKCE_DECRYPTION_FAILED",
    message:
      "Failed to decrypt the file. Most likely the file has been corrupted during transmission to or storage on the server.",
    shorthand: "Decryption failed",
  },
  NKCE_ENCRYPTED_DOWNLOAD_FAILED: {
    code: "NKCE_ENCRYPTED_DOWNLOAD_FAILED",
    message: "Failed to download encrypted file from the server.",
    shorthand: "Download failed",
  },
  NKCE_FAILED_TO_SAVE_FILE: {
    code: "NKCE_FAILED_TO_SAVE_FILE",
    message: "Failed to save file after decryption.",
    shorthand: "Filesystem failure",
  },
  NKCE_BLOB_ID_MISSING: {
    code: "NKCE_BLOB_ID_MISSING",
    message: "BlobId is missing in server response.",
    shorthand: "Filesystem failure",
  },
  NKRE_MALFORMATTED_RESPONSE: {
    code: "NKRE_MALFORMATTED_RESPONSE",
    message: "Server returned a malformatted response.",
    shorthand: "Malformatted response",
  },
  NKRE_UNEXPECTED_RESPONSE: {
    code: "NKRE_UNEXPECTED_RESPONSE",
    message: "Server returned an unexpected response.",
    shorthand: "Unexpected response",
  },
  NKRE_CONNECTIVITY_ISSUE: {
    code: "NKRE_CONNECTIVITY_ISSUE",
    message:
      "Failed to establish a connection with the server. Please make sure you have a working internet connection. If you believe, everything is in working order on your end, please contact server administrator.",
    shorthand: "Connection failed",
  },
};
