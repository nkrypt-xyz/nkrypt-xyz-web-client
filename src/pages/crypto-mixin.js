
export let CryptoMixin = {

  data() {
    return {

    };
  },

  methods: {

    async __getEncryptionKey() {
      const salt = new Uint8Array([124, 92, 118, 197, 187, 142, 84, 34, 182, 251, 29, 71, 30, 56, 90, 48]);
      // TODO: At a later version, create salt for individual users and store on server.

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

    // ======================= Text

    __pack(buffer) {
      return window.btoa(
        String.fromCharCode.apply(null, new Uint8Array(buffer))
      )
    },

    __unpack(packed) {
      const string = window.atob(packed)
      const buffer = new ArrayBuffer(string.length)
      const bufferView = new Uint8Array(buffer)

      for (let i = 0; i < string.length; i++) {
        bufferView[i] = string.charCodeAt(i)
      }

      return buffer;
    },

    async encryptText(data) {
      const encoder = new TextEncoder();
      let encodedData = encoder.encode(data);

      let iv = window.crypto.getRandomValues(new Uint8Array(12));

      let key = await this.__getEncryptionKey();

      const cipher = await window.crypto.subtle.encrypt({
        name: 'AES-GCM',
        iv: iv,
      }, key, encodedData);

      return {
        cipher: this.__pack(cipher),
        iv: this.__pack(iv)
      };
    },

    async decryptText({ cipher, iv }) {
      cipher = this.__unpack(cipher);
      iv = this.__unpack(iv);

      let key = await this.__getEncryptionKey();

      const encodedData = await window.crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv: iv,
      }, key, cipher);

      let data = (new TextDecoder()).decode(encodedData);

      return data;
    },

    // ======================= Binary

    __packFromUnicode(arrayBuffer) {
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

    async encryptArrayBuffer(encodedData) {
      let iv = window.crypto.getRandomValues(new Uint8Array(12));

      let key = await this.__getEncryptionKey();

      const cipher = await window.crypto.subtle.encrypt({
        name: 'AES-GCM',
        iv: iv,
      }, key, encodedData);

      return {
        cipher: (await this.__packFromUnicode(cipher)),
        iv: this.__pack(iv)
      };
    },

    async decryptToArrayBuffer({ cipher, iv }) {
      cipher = this.__unpack(cipher);
      iv = this.__unpack(iv);

      let key = await this.__getEncryptionKey();

      const encodedData = await window.crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv: iv,
      }, key, cipher);

      // let data = (new TextDecoder()).decode(encodedData);

      return encodedData;
    }

  }

}