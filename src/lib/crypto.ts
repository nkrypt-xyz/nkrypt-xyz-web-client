/* Spec Pattern:
- MasterSpec|EncryptionSpec|PassphraseDerivationSpec|BinaryToStringSpec|ResultingTupleSpec|AdditionalTransformation
- In practice, checking master spec is sufficient. For any variation in the spec, the master spec will change.
- The NK*** name is reserved for the official nkrypt.xyz usage.
*/
export const BUCKET_CRYPTO_SPEC =
  "NK001|AES-GCM-256|PBKDF2-SHA-256|B64|JSON|RAW";
