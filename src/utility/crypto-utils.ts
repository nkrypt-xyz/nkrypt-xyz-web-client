const convertSmallBufferToString = (buffer: Buffer) => {
  return window.btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
};

const convertSmallUint8ArrayToString = (array: Uint8Array) => {
  return window.btoa(String.fromCharCode.apply(null, array));
};

const convertSmallStringToBuffer = (packed: string) => {
  const string = window.atob(packed);
  const buffer = new ArrayBuffer(string.length);
  const bufferView = new Uint8Array(buffer);

  for (let i = 0; i < string.length; i++) {
    bufferView[i] = string.charCodeAt(i);
  }

  return buffer;
};

const createEncryptionKeyFromPassword = async (
  encryptionPassword: string,
  salt: Uint8Array
) => {
  if (!salt) {
    salt = window.crypto.getRandomValues(new Uint8Array(16));
  }

  let encodedPassphrase = new TextEncoder().encode(encryptionPassword);

  let keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encodedPassphrase,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  let key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  return { key, salt };
};

// For encrypting small (<10mb) amount of data
export const encryptText = async (text: string, encryptionPassword: string) => {
  // encode
  const encoder = new TextEncoder();
  let encodedData = encoder.encode(text);

  // get salt and key
  let { salt, key } = await createEncryptionKeyFromPassword(
    encryptionPassword,
    null
  );

  // generate random iv
  let iv = window.crypto.getRandomValues(new Uint8Array(12));

  const cipher = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodedData
  );

  // pack
  return {
    cipher: convertSmallBufferToString(cipher),
    iv: convertSmallUint8ArrayToString(iv),
    salt: convertSmallUint8ArrayToString(salt),
  };
};

// For decrypting small (<10mb) amount of data
export const decryptText = async (
  { cipher, iv, salt },
  encryptionPassword: string
) => {
  // unpack
  cipher = convertSmallStringToBuffer(cipher);
  iv = convertSmallStringToBuffer(iv);
  salt = convertSmallStringToBuffer(salt);

  // get  key
  let { key } = await createEncryptionKeyFromPassword(encryptionPassword, salt);

  const encodedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    cipher
  );

  // decode
  let data = new TextDecoder().decode(encodedData);

  return data;
};
