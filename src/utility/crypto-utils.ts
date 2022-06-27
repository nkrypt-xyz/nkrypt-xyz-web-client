export const IV_LENGTH = 12;
export const SALT_LENGTH = 16;

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

export const makeRandomIv = async () => {
  let iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  return { iv };
};

export const makeRandomSalt = async () => {
  let salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return { salt };
};

export const createEncryptionKeyFromPassword = async (
  encryptionPassword: string,
  salt: Uint8Array
) => {
  if (!encryptionPassword) {
    throw new Error("encryptionPassword is required");
  }

  if (!salt) {
    throw new Error("salt is required");
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
  let { salt } = await makeRandomSalt();
  let { key } = await createEncryptionKeyFromPassword(encryptionPassword, salt);

  // generate random iv
  let { iv } = await makeRandomIv();

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

// For encrypting small (<10mb) amount of data
export const encryptObject = async (
  object: Record<string, any>,
  encryptionPassword: string
): Promise<string> => {
  let text = JSON.stringify(object);
  let encryped = await encryptText(text, encryptionPassword);
  return JSON.stringify(encryped);
};

// For decrypting small (<10mb) amount of data
export const decryptToObject = async (
  encryptedText: string,
  encryptionPassword: string
) => {
  let encrypted = JSON.parse(encryptedText);
  let decrypted = await decryptText(encrypted, encryptionPassword);
  return JSON.parse(decrypted);
};

// for decrypting chunks of data
export const encryptBuffer = async (
  { iv, key },
  buffer: ArrayBuffer
): Promise<ArrayBuffer> => {
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    buffer
  );
  return encryptedBuffer;
};

// for decrypting chunks of data
export const decryptBuffer = async (
  { iv, key },
  buffer: ArrayBuffer
): Promise<ArrayBuffer> => {
  console.log("decryptBuffer ATTEMPT");
  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      buffer
    );
    console.log("decryptBuffer OK");
    return decryptedBuffer;
  } catch (ex) {
    // @ts-ignore
    console.log(ex instanceof DOMException);
    // @ts-ignore
    console.log(ex.code, ex.message, ex.name);
    console.error(ex);
    throw ex;
  }
};
