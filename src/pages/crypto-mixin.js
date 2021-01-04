

// NOTE: let f = (n)=> Math.ceil(n/3)*4; can be used to calculate size inflation for base64
const splitStringIntoChunks = (sourceString, ...chunkSizeList) => {
  let extractedLength = 0;
  let extractedList = [];
  for (let chunkSize of chunkSizeList) {
    let chunk = sourceString.slice(extractedLength, extractedLength + chunkSize);
    extractedList.push(chunk);
    extractedLength += chunkSize;
  }
  extractedList.push(sourceString.slice(extractedLength));
  return extractedList;
}

export let CryptoMixin = {

  data() {
    return {

    };
  },

  methods: {

    // ---------------------------------------- salt, iv, key-gen

    __generateSalt() {
      return window.crypto.getRandomValues(new Uint8Array(16));
    },

    __geenrateIv() {
      return window.crypto.getRandomValues(new Uint8Array(12));
    },

    async __getEncryptionKey(salt) {
      let passphrase = sessionStorage.getItem('nkrypt-xyz-passphrase');
      let encodedPassphrase = (new TextEncoder()).encode(passphrase);

      let keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encodedPassphrase,
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
      );

      let key = await window.crypto.subtle.deriveKey(
        {
          "name": "PBKDF2",
          salt,
          "iterations": 100000,
          "hash": "SHA-256"
        },
        keyMaterial,
        { "name": "AES-GCM", "length": 256 },
        true,
        ["encrypt", "decrypt"]
      );

      return key;
    },

    // ---------------------------------------- encoding and decoding

    __ArrayBufferToBase64Sync(buffer) {
      return window.btoa(
        String.fromCharCode.apply(null, new Uint8Array(buffer))
      )
    },

    __Base64ToArrayBufferSync(packed) {
      const string = window.atob(packed)
      const buffer = new ArrayBuffer(string.length)
      const bufferView = new Uint8Array(buffer)

      for (let i = 0; i < string.length; i++) {
        bufferView[i] = string.charCodeAt(i)
      }

      return buffer;
    },

    __ArrayBufferToBase64(arrayBuffer) {
      return new Promise(accept => {

        var blob = new Blob([arrayBuffer])

        var reader = new FileReader();
        reader.onload = function (event) {
          var base64 = event.target.result;
          // base64 = base64.slice(base64.indexOf(';base64,') + ';base64,'.length, base64.length);
          base64 = base64.slice(base64.indexOf(',') + 1);
          accept(base64);
        };

        reader.readAsDataURL(blob);
      });
    },

    // ---------------------------------------- encrypt & decrypt (text)

    async encryptText(text) {
      // utf8 to arraybuffer
      let sourceArrayBuffer = (new TextEncoder()).encode(text);

      return await this.encryptArrayBuffer(sourceArrayBuffer);
    },

    async decryptText(encryptedBase64) {
      let decryptedArrayBuffer = await this.decryptToArrayBuffer(encryptedBase64)

      // arraybuffer to utf8
      let text = (new TextDecoder()).decode(decryptedArrayBuffer);

      return text;
    },

    // ---------------------------------------- encrypt & decrypt (binary)

    async encryptArrayBuffer(sourceArrayBuffer) {
      let salt = this.__generateSalt();
      let key = await this.__getEncryptionKey(salt);
      let iv = this.__geenrateIv();

      let cipher = await window.crypto.subtle.encrypt({
        name: 'AES-GCM',
        iv: iv,
      }, key, sourceArrayBuffer);

      salt = this.__ArrayBufferToBase64Sync(salt);
      iv = this.__ArrayBufferToBase64Sync(iv);
      cipher = await this.__ArrayBufferToBase64(cipher);

      let encryptedBase64 = [
        salt, iv, cipher
      ].join('');

      return encryptedBase64;
    },

    async decryptToArrayBuffer(encryptedBase64) {
      let [salt, iv, cipher] = splitStringIntoChunks(encryptedBase64, 24, 16);

      salt = this.__Base64ToArrayBufferSync(salt);
      cipher = this.__Base64ToArrayBufferSync(cipher);
      iv = this.__Base64ToArrayBufferSync(iv);

      let key = await this.__getEncryptionKey(salt);

      const decryptedArrayBuffer = await window.crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv: iv,
      }, key, cipher);

      return decryptedArrayBuffer;
    }

    // -x- methods
  }
}