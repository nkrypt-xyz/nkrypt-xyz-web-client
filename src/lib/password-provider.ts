import { BUCKET_CRYPTO_SPEC } from "../constant/crypto-specs.js";
import { getPasswordForBucket } from "../store/password.js";
import { showAlert, showBucketPasswordDialog } from "../store/ui.js";
import { decryptText } from "../utility/crypto-utils.js";

const ensureBucketPasswordWorks = async (
  bucket,
  bucketPassword
): Promise<{ doesPasswordWork: boolean; isCorrectSpec: boolean }> => {
  try {
    let cryptDataObject = JSON.parse(bucket.cryptData);
    let decryptedText = await decryptText(cryptDataObject, bucketPassword);

    if (decryptedText !== BUCKET_CRYPTO_SPEC) {
      return {
        doesPasswordWork: true,
        isCorrectSpec: false,
      };
    }

    return {
      doesPasswordWork: true,
      isCorrectSpec: true,
    };
  } catch (ex) {
    // TODO Separate wrong-password error from other errors
    console.error(ex);
    return { doesPasswordWork: false, isCorrectSpec: false };
  }
};

export const getOrCollectPasswordForBucket = async (bucket) => {
  let bucketPassword = getPasswordForBucket(bucket._id);

  // check if stored password is working
  if (bucketPassword) {
    let { doesPasswordWork, isCorrectSpec } = await ensureBucketPasswordWorks(
      bucket,
      bucketPassword
    );

    if (!doesPasswordWork) {
      bucketPassword = null;
    }

    if (doesPasswordWork && !isCorrectSpec) {
      await showAlert(
        "Format Mismatch",
        "This bucket was created with an unsupported spec."
      );
      return;
    }
  }

  // prompt user until they provide the correct password
  while (!bucketPassword) {
    bucketPassword = await showBucketPasswordDialog(bucket.name);

    if (!bucketPassword) {
      break;
    }

    let { doesPasswordWork, isCorrectSpec } = await ensureBucketPasswordWorks(
      bucket,
      bucketPassword
    );

    if (!doesPasswordWork) {
      bucketPassword = null;
    }

    if (doesPasswordWork && !isCorrectSpec) {
      await showAlert(
        "Format Mismatch",
        "This bucket was created with an unsupported spec."
      );
      return;
    }
  }

  return bucketPassword;
};
