const internationalNumberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export const expressBytesPrettified = (byteCount) => {
  if (byteCount < 1000) {
    return `(${internationalNumberFormat.format(byteCount)} B)`;
  }

  let message = "";
  if (byteCount > 1000 * 1000 * 1000) {
    message += Math.round(byteCount / (1000 * 1000 * 1000)) + " GB";
  } else if (byteCount > 1000 * 1000) {
    message += Math.round(byteCount / (1000 * 1000)) + " MB";
  } else if (byteCount > 1000) {
    message += Math.round(byteCount / 1000) + " KB";
  }
  message += ` (${internationalNumberFormat.format(byteCount)} B)`;
  return message;
};
