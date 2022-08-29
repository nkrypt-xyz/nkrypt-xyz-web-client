import { BUCKET_CRYPTO_SPEC } from "../constant/crypto-specs.js";
import { convertSmallStringToBuffer } from "./buffer-utils.js";

export const buildCryptoHeader = (iv, salt) => {
  return `${BUCKET_CRYPTO_SPEC}|${iv}|${salt}`;
};

export const unbuildCryptoHeader = (cryptoHeader) => {
  let [_, iv, salt] = cryptoHeader.split("|");
  iv = convertSmallStringToBuffer(iv);
  salt = convertSmallStringToBuffer(salt);
  return [iv, salt];
};
