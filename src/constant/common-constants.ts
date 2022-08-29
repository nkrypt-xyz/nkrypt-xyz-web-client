import { BLOB_CHUNK_SIZE_INCLUDING_TAG_BYTES } from "./crypto-specs.js";

export const CommonConstant = {
  APP_VERSION: "0.0.1",
  COPYRIGHT: "Sayem Shafayet",
  COPYRIGHT_HREF: "https://ishafayet.me",
  DEFAULT_SERVER_URL: "http://localhost:9041",
  PACKET_SIZE_FOR_QUANTIZED_STREAMS: 100 * BLOB_CHUNK_SIZE_INCLUDING_TAG_BYTES,
};
