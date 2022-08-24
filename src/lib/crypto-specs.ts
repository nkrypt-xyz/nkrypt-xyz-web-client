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

export const BLOB_CHUNK_SIZE_BYTES = 1024 * 1024; // 1mib

// export const BLOB_CHUNK_SIZE_BYTES = 32 * 1024; // 32kb

// export const BLOB_CHUNK_SIZE_BYTES = 5 * 1024 + 9;

// ============= SPEC: NK001 - end ============= //
