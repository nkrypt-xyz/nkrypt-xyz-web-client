const supportedMimeTypeList = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

const isLikelyImage = (file) => {
  try {
    let { mimeType } = file.metaData;
    return supportedMimeTypeList.indexOf(mimeType) > -1;
  } catch (ex) {
    console.warn(ex);
    return false;
  }
};

export { isLikelyImage };
