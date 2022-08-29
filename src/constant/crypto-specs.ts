export const BLOB_API_CRYPTO_META_HEADER_NAME = "nk-crypto-meta";

// ============= SPEC: NK001 - start ============= //
/* 
  NOTE: This outlines all the crypto details any implementation wanting to 
  decrypt the same files must follow.

  WARNING: Any single change in any of the following variables will require
  an entire new spec. That is by design.
*/

export const BUCKET_CRYPTO_SPEC = "NK001";

export const IV_LENGTH = 12;
export const SALT_LENGTH = 16;

export const PASSPHRASE_ENCODING = "utf-8";

export const PASSPHRASE_IMPORTKEY_ALGORITHM = "PBKDF2";
export const PASSPHRASE_DERIVEKEY_ALGORITHM = "PBKDF2";
export const PASSPHRASE_DERIVEKEY_ITERATIONS = 100000;
export const PASSPHRASE_DERIVEKEY_HASH_ALGORITHM = "SHA-256";
export const PASSPHRASE_DERIVEKEY_GENERATED_KEYLENGTH = 256;

export const ENCRYPTION_ALGORITHM = "AES-GCM";
export const ENCRYPTION_TAGLENGTH_IN_BITS = 128;

export const BLOB_CHUNK_SIZE_BYTES = 1024 * 1024 - 128 / 8; // 1048560 bytes. (1mb - 16 bytes). Thus after encryption we neatly get exactly 1mb chunks.
export const BLOB_CHUNK_SIZE_INCLUDING_TAG_BYTES = 1024 * 1024; // 1048576 bytes. 1mb chunks.

// ============= SPEC: NK001 - end ============= //
