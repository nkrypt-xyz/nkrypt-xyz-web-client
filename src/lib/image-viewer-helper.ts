import { MiscConstant } from "../constant/misc-constants.js";

const supportedMimeTypeList = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

const isUploadCandidateLikelyAnImage = (mimeType) => {
  try {
    return supportedMimeTypeList.indexOf(mimeType) > -1;
  } catch (ex) {
    console.warn(ex);
    return false;
  }
};

const isLikelyImage = (file) => {
  try {
    let { mimeType } = file.metaData;
    return supportedMimeTypeList.indexOf(mimeType) > -1;
  } catch (ex) {
    console.warn(ex);
    return false;
  }
};

function resizeImageToSpecificWidth(file, max, cb) {
  var data;
  var reader = new FileReader();
  reader.onload = function (event) {
    var img = new Image();
    img.onload = function () {
      if (img.width > max) {
        var oc = document.createElement("canvas"),
          octx = oc.getContext("2d");
        oc.width = img.width;
        oc.height = img.height;
        octx.drawImage(img, 0, 0);
        if (img.width > img.height) {
          oc.height = (img.height / img.width) * max;
          oc.width = max;
        } else {
          oc.width = (img.width / img.height) * max;
          oc.height = max;
        }
        octx.drawImage(oc, 0, 0, oc.width, oc.height);
        octx.drawImage(img, 0, 0, oc.width, oc.height);
        data = oc.toDataURL(
          MiscConstant.IMAGE_THUMBNAIL_MIME_TYPE,
          MiscConstant.IMAGE_THUMBNAIL_QUALITY
        );
      } else {
        data = img.src;
      }
      cb(data);
    };
    // @ts-ignore
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

const generateThumbnail = (file) => {
  return new Promise((accept) => {
    resizeImageToSpecificWidth(
      file,
      MiscConstant.IMAGE_THUMBNAIL_SIZE_PX,
      accept
    );
  });
};

export { isLikelyImage, isUploadCandidateLikelyAnImage, generateThumbnail };
