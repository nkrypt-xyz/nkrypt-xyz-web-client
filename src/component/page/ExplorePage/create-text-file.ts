import { MetaDataConstant } from "../../../constant/meta-data-constants.js";
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
      [MetaDataConstant.ORIGIN_GROUP_NAME]: {
        [MetaDataConstant.ORIGIN.ORIGINATION_SOURCE]:
          MiscConstant.ORIGINATION_SOURCE_CREATE_FILE,
        [MetaDataConstant.ORIGIN.ORIGINATION_DATE]: Date.now(),
      },
      [MetaDataConstant.CORE_GROUP_NAME]: {
        [MetaDataConstant.CORE.SIZE_BEFORE_ENCRYPTION]:
          MiscConstant.BLANK_TEXT_FILE_SIZE,
        [MetaDataConstant.CORE.MIME_TYPE]: MiscConstant.TEXT_FILE_MIME,
      },
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
      [MetaDataConstant.ORIGIN_GROUP_NAME]: {
        [MetaDataConstant.ORIGIN.ORIGINAL_NAME]: null,
      },
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
