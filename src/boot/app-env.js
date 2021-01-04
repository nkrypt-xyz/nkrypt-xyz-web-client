
import Vue from 'vue'

let mode, apiBaseUri;

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  mode = 'development';
  apiBaseUri = `http://${window.location.hostname}:9003/api/`;
} else {
  mode = 'production';
  apiBaseUri = 'https://server.nkrypt.xyz/api/';
}

Vue.prototype.$appEnv = {
  mode, apiBaseUri
};
