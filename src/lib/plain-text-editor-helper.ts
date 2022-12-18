const supportedMimeTypeList = [
  "text/plain",
  "text/html",
  "text/csv",
  "text/css",
  "text/javascript",
  "text/markdown",
  "application/json",
  "application/xml",
  "plain/text",
];

const isLikelyPlainText = (file) => {
  try {
    let { mimeType } = file.metaData;
    return supportedMimeTypeList.indexOf(mimeType) > -1;
  } catch (ex) {
    console.warn(ex);
    return false;
  }
};

export { isLikelyPlainText };
