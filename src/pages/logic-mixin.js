
export let LogicMixin = {

  data() {
    return {

    };
  },

  methods: {

    // ---------------------------------------- constants

    getRootDirKey() {
      return "root".padStart(32, 0);
    },

    getNullDirKey() {
      return "".padStart(32, 0);
    },

    // ---------------------------------------- session storage

    removeStoredPassphrase() {
      sessionStorage.removeItem("nkrypt-xyz-passphrase");
    },

    storePassphrase(value) {
      sessionStorage.setItem("nkrypt-xyz-passphrase", value);
    },

    // ---------------------------------------- initialization

    async detectIfRootExists() {
      let payload = this.getApiKey() + this.getRootDirKey();
      let res = await this.callApi("get-node", payload, {
        suppressErrors: true,
        isJson: false
      });

      if (typeof (res) === 'object' && res.hasError && res.error.code === "NODE_INVALID") {
        return false;
      }
      return true;
    },

    async initalizeNewRootDir() {
      let data = {
        notes: "This is the root directory.",
        childList: [],
        rootStats: {
          size: 0,
          ctime: Date.now(),
          mtime: Date.now(),
        },
        rootMeta: {}
      };

      data = JSON.stringify(data);
      let encryptedData = await this.encryptText(data);

      let payload = this.getApiKey() + this.getRootDirKey() + JSON.stringify(encryptedData);
      let res = await this.callApi("set-node", payload, {
        isJson: false
      });
      return !res.hasError;
    },

    // ---------------------------------------- directories and text nodes

    async fetchAndDecryptTextNode({ key }) {
      let payload = this.getApiKey() + key;
      let res = await this.callApi("get-node", payload, {
        isJson: false
      });
      if (typeof (res) === 'object' && res.hasError) return res;

      let node;
      try {
        node = await this.decryptText(res);
        node = JSON.parse(node);
        return { node, hasError: false };
      } catch (ex) {
        if (ex.name === "OperationError") {
          await this.alert("Error", "Your passphrase is invalid.");
          return { hasError: true, error: { code: "INVALID_PASSPHRASE" } };
        } else {
          throw ex;
        }
      }
    },

    async createDirectoryAndUpdateNode({ currentDir, currentDirKey, newDirName }) {
      // create new child
      let data = JSON.stringify({
        childList: [],
      });
      let encryptedData = await this.encryptText(data);

      // store on server
      let newDirKey;
      {
        let payload = this.getApiKey() + this.getNullDirKey() + JSON.stringify(encryptedData);
        let res = await this.callApi("set-node", payload, {
          isJson: false
        });
        if (res.hasError) return false;
        newDirKey = res.nodeKey;
      }

      // update current directory with the metadata
      currentDir.childList.push({
        key: newDirKey,
        name: newDirName,
        type: "dir",
        stats: {
          size: 0,
          ctime: Date.now(),
          mtime: Date.now(),
        },
        meta: {},
      });

      // update current node on server
      {
        let encryptedData = await this.encryptText(JSON.stringify(currentDir));
        let payload = this.getApiKey() + currentDirKey + JSON.stringify(encryptedData);
        let res = await this.callApi("set-node", payload, {
          isJson: false
        });
        if (res.hasError) return false;
      }
    },

    async updateChildInformationAndUpdateNode({ currentDir, currentDirKey, updatedChildData }) {
      let index = currentDir.childList.findIndex(i => i.key === updatedChildData.key);
      if (index === -1) {
        throw new Error("Child could not be found.");
      }
      currentDir.childList[index] = updatedChildData;

      {
        let encryptedData = await this.encryptText(JSON.stringify(currentDir));
        let payload = this.getApiKey() + currentDirKey + JSON.stringify(encryptedData);
        let res = await this.callApi("set-node", payload, {
          isJson: false
        });
        if (res.hasError) return false;
      }
    },

    async listChildNodeKeysRecursive(collectedKeyList, key) {
      let { node, hasError, error } = await this.fetchAndDecryptTextNode({ key });
      if (hasError) return;
      for (let child of node.childList) {
        collectedKeyList.push(child.key);
        if (child.type === 'dir') {
          await this.listChildNodeKeysRecursive(collectedKeyList, child.key);
        }
      }
    },

    async deleteChildAndUpdateNode({ currentDir, currentDirKey, childKey }) {
      let index = currentDir.childList.findIndex(i => i.key === childKey);
      if (index === -1) {
        throw new Error("Child could not be found.");
      }
      let child = currentDir.childList[index];
      currentDir.childList.splice(index, 1);

      // recursively list all keys to delete
      let collectedKeyList = [childKey];
      if (child.type === 'dir') {
        await this.listChildNodeKeysRecursive(collectedKeyList, childKey);
      }

      // remove all node on server
      let res = await this.callApi("remove-nodes", {
        nodeKeyList: collectedKeyList
      });
      if (res.hasError) return;

      // update current node on server
      {
        let encryptedData = await this.encryptText(JSON.stringify(currentDir));
        let payload = this.getApiKey() + currentDirKey + JSON.stringify(encryptedData);
        let res = await this.callApi("set-node", payload, {
          isJson: false
        });
        if (res.hasError) return false;
      }
    },

    // ---------------------------------------- binary nodes

    async uploadFileAndUpdateNode({ currentDir, currentDirKey, encryptedData, newFileData }) {
      // store on server
      let newFileKey;
      {
        let payload = this.getApiKey() + this.getNullDirKey() + JSON.stringify(encryptedData);
        let res = await this.callApi("set-node", payload, {
          isJson: false
        });
        if (res.hasError) return false;
        newFileKey = res.nodeKey;
      }

      // update current directory with the metadata
      currentDir.childList.push({
        key: newFileKey,
        name: newFileData.name,
        type: newFileData.type,
        stats: {
          size: newFileData.size,
          ctime: Date.now(),
          mtime: Date.now(),
        },
        meta: {
          originalName: name
        },
      });

      // update current node on server
      {
        let encryptedData = await this.encryptText(JSON.stringify(currentDir));
        let payload = this.getApiKey() + currentDirKey + JSON.stringify(encryptedData);
        let res = await this.callApi("set-node", payload, {
          isJson: false
        });
        if (res.hasError) return false;
      }
    },

    async fetchAndDecryptBinaryNode({ key }) {
      let payload = this.getApiKey() + key;
      let res = await this.callApi("get-node", payload, {
        isJson: false
      });
      if (typeof (res) === 'object' && res.hasError) return res;

      let node;
      try {
        node = await this.decryptToArrayBuffer(res);
        return { node, hasError: false };
      } catch (ex) {
        if (ex.name === "OperationError") {
          await this.alert("Error", "Your passphrase is invalid.");
          return { hasError: true, error: { code: "INVALID_PASSPHRASE" } };
        } else {
          throw ex;
        }
      }
    },

  }
}