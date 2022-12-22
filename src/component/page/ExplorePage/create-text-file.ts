import { MiscConstant } from "../../../constant/misc-constants.js";
import {
  callFileCreateApi,
  callFileSetEncryptedMetaDataApi,
  callFileSetMetaDataApi,
} from "../../../integration/content-apis.js";
import { encryptAndUploadArrayBuffer } from "../../../lib/crypto-transit-basic.js";
import {
  decrementActiveGlobalObtrusiveTaskCount,
  incrementActiveGlobalObtrusiveTaskCount,
  showPrompt,
} from "../../../store/ui.js";
import { encryptObject } from "../../../utility/crypto-utils.js";

const createTextFile = async (
  currentBucket,
  currentDirectory,
  currentBucketPassword,
  fileName
) => {
  incrementActiveGlobalObtrusiveTaskCount();
  let { fileId } = await callFileCreateApi({
    bucketId: currentBucket._id,
    name: fileName,
    parentDirectoryId: (currentDirectory as any)._id,
    metaData: {},
    encryptedMetaData: await encryptObject({}, currentBucketPassword),
  });
  let uInt8Array = new Uint8Array(0);
  let response2 = await encryptAndUploadArrayBuffer(
    currentBucket._id,
    fileId,
    uInt8Array.buffer,
    currentBucketPassword,
    () => {}
  );
  decrementActiveGlobalObtrusiveTaskCount();

  {
    incrementActiveGlobalObtrusiveTaskCount();
    let metaData = {
      size: MiscConstant.BLANK_TEXT_FILE_SIZE,
      mimeType: MiscConstant.TEXT_FILE_MIME,
    };
    let response = await callFileSetMetaDataApi({
      bucketId: currentBucket._id,
      fileId,
      metaData,
    });
    decrementActiveGlobalObtrusiveTaskCount();
  }

  {
    incrementActiveGlobalObtrusiveTaskCount();
    let encryptedMetaData = {
      originalName: null,
    };
    let response = await callFileSetEncryptedMetaDataApi({
      bucketId: currentBucket._id,
      fileId,
      encryptedMetaData: await encryptObject(
        encryptedMetaData,
        currentBucketPassword
      ),
    });
    decrementActiveGlobalObtrusiveTaskCount();
  }
};

export { createTextFile };
