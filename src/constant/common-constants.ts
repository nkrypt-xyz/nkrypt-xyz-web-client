import { BLOB_CHUNK_SIZE_INCLUDING_TAG_BYTES } from "./crypto-specs.js";

export const CommonConstant = {
  APP_VERSION: "0.0.1",
  COPYRIGHT: "Sayem Shafayet",
  COPYRIGHT_HREF: "https://ishafayet.me",
  DEFAULT_SERVER_URL: import.meta.env.VITE_DEFAULT_SERVER_URL,
  PACKET_SIZE_FOR_QUANTIZED_STREAMS: 100 * BLOB_CHUNK_SIZE_INCLUDING_TAG_BYTES,
  CLIENT_NAME: import.meta.env.CLIENT_APPLICATION_NAME,
};
