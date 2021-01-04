
if (!window.loadingWorkloadCount) {
  window.loadingWorkloadCount = 0;
}

import { date } from 'quasar';

export let CommonMixin = {

  created() {
  },

  data() {
    return {
      apiKey: null,
      validation: {
        username: [
          v => !!v || "Please enter your user name",
          v =>
            (v && v.length >= 3 && v.length <= 32) ||
            "Please enter a correct user name"
        ],
        password: [
          v => !!v || "Please enter your password",
          v =>
            (v && v.length >= 8 && v.length <= 32) ||
            "Please enter your password correctly"
        ],
        password: [
          v => !!v || "Please enter your passphrase",
          v =>
            (v && v.length >= 8 && v.length <= 32) ||
            "Your passphrase must be between 8 to 32 characters"
        ],
        phone: [
          v => !!v || "Please enter a phone number",
          v =>
            (v && v.length >= 6 && v.length <= 14) ||
            "Please enter a correct phone number"
        ],
        required: [
          v => !!v || "Please enter this information"]
      }
    }
  },

  methods: {
    // ---------------------------------------- Navigation

    navigateBack() {
      this.$emit("navigate-back");
    },

    // ---------------------------------------- DOM Utils

    clearInputFile(f) {
      if (!f.value) return;
      try {
        f.value = "";
      } catch (err) { }
      if (f.value) {
        var form = document.createElement("form"),
          parentNode = f.parentNode,
          ref = f.nextSibling;
        form.appendChild(f);
        form.reset();
        parentNode.insertBefore(f, ref);
      }
    },

    // ---------------------------------------- Common dialogs and toasts

    notifyPositive(message) {
      this.$q.notify({
        type: "positive",
        position: 'bottom-left',
        message,
        timeout: 2000
      });
    },

    alert(title, message) {
      return new Promise(accept => {
        this.$q.dialog({
          title,
          message
        }).onOk(() => {
          accept(true);
        }).onCancel(() => {
          accept(false);
        }).onDismiss(() => {
          accept(false);
        })
      })
    },

    confirm(title, message) {
      return new Promise(accept => {
        this.$q.dialog({
          title,
          message,
          cancel: true,
          persistent: true
        }).onOk(() => {
          accept(true);
        }).onCancel(() => {
          accept(false);
        }).onDismiss(() => {
          accept(false);
        })
      })
    },

    prompt(title, message, defaultValue) {
      return new Promise(accept => {
        this.$q.dialog({
          title,
          message,
          prompt: {
            model: defaultValue,
            type: 'text'
          },
          cancel: true,
          persistent: true
        }).onOk(data => {
          accept(data);
        }).onCancel(() => {
          accept(false);
        }).onDismiss(() => {
          accept(false);
        })
      })
    },

    // ---------------------------------------- Date formatting

    toDatetimeStamp(dateString) {
      if (!dateString) return null;
      return (new Date(dateString)).getTime() || null;
    },

    toDateString(datetimeStamp) {
      if (!datetimeStamp) return '';
      return (new Date(datetimeStamp)).toISOString().split('T')[0];
    },

    toDatetimeString(datetimeStamp) {
      if (!datetimeStamp) return '';
      return (new Date(datetimeStamp)).toISOString().split('.')[0].replace('T', ' ');
    },

    formatDate(date1, format) {
      return date.formatDate(date1, format)
    },

    // ---------------------------------------- Storage

    setApiKey(apiKey) {
      localStorage.setItem('nkrypt-xyz-apiKey', JSON.stringify(apiKey));
      this.$emit('api-key-change');
    },

    getApiKey() {
      let val = localStorage.getItem('nkrypt-xyz-apiKey');
      if (val) return JSON.parse(val);
    },

    // ----------------------------------------

    showHideLoading() {
      if (window.loadingWorkloadCount === 0) {
        if (this.$q.loading.isActive) {
          this.$q.loading.hide();
        }
      } else {
        if (!this.$q.loading.isActive) {
          this.$q.loading.show();
        }
      }
    },

    addLoadingWorkload() {
      window.loadingWorkloadCount += 1;
      setTimeout(() => {
        this.showHideLoading();
      }, 100);
    },

    reduceLoadingWorkload() {
      window.loadingWorkloadCount -= 1;
      setTimeout(() => {
        this.showHideLoading();
      }, 300);
    },

    // ---------------------------------------- API

    async callApi(path, requestPayload = {}, { isJson = true, auth = true, blocking = true, suppressErrors = false } = {}) {

      if (blocking) {
        this.addLoadingWorkload();
      }

      // local or remote
      let baseUri = this.$appEnv.apiBaseUri;

      // add authentication if needed
      if (isJson & auth) {
        requestPayload.apiKey = this.getApiKey();
      }

      await this.sleep(500);

      // call api
      let uri = baseUri + path;
      let responsePayload;
      try {
        this.$axios.defaults.baseURL = '';
        if (isJson) {
          this.$axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
        } else {
          this.$axios.defaults.headers.post['Content-Type'] = 'text/plain;charset=utf-8';
        }
        responsePayload = await this.$axios.post(uri, requestPayload)
        responsePayload = responsePayload.data;
      } catch (ex) {
        // keep log. necessary to debug
        console.error(ex);
        responsePayload = {
          hasError: true,
          error: {
            code: 'NETWORK_ERROR',
            message: "Unable to connect to the server. Please make sure you are connected to the internet."
          }
        }
      }

      // keep log until app is stable
      console.log({ path, requestPayload, responsePayload });

      if (blocking) {
        this.reduceLoadingWorkload();
      }

      if (typeof (responsePayload) === 'object') {
        if (responsePayload.hasError && (responsePayload.error.code === 'APIKEY_EXPIRED' || responsePayload.error.code === 'APIKEY_INVALID')) {
          this.$router.push({ path: "/login" });
          return responsePayload;
        }

        if (responsePayload.hasError && (!suppressErrors || responsePayload.error.code === 'NETWORK_ERROR')) {
          await this.alert("Error", responsePayload.error.message);
        }
      }

      return responsePayload;
    },

    // ---------------------------------------- Misc utils

    async sleep(duration) {
      return new Promise(accept => {
        setTimeout(accept, duration);
      });
    },
  }

}