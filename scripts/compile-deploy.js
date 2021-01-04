
const shell = require('shelljs');
const pathlib = require('path');
const fslib = require('fs');
const { updateBuildNumber } = require('./build-number');
const copyDir = require('copy-dir');

const publishMain = () => {
  let commmand = 'gcloud app deploy --quiet --project nkrypt-xyz';
  let res = shell.exec(commmand);
  if (res.code !== 0) {
    shell.echo(`Error: ${commmand} failed`);
    shell.exit(1);
  }
}

const buildMain = () => {
  let commmand = 'npm run build';
  let res = shell.exec(commmand);
  if (res.code !== 0) {
    shell.echo(`Error: ${commmand} failed`);
    shell.exit(1);
  }
}

const updateAppYaml = () => {
  const stringToMatch = 'precache-manifest';
  let newPrecacheManifestName = fslib.readdirSync('./dist/pwa')
    .filter(name => name.indexOf(stringToMatch) === 0)
    .pop();
  if (!newPrecacheManifestName) {
    throw new Error("No precache manifest found");
  }
  let content = fslib.readFileSync('./app.yaml', 'utf8');
  content = content.replace(/precache.*.js/gi, newPrecacheManifestName);
  fslib.writeFileSync('./app.yaml', content, 'utf8');
}

const injectLocalServiceWorker = () => {
  let swPath = './dist/pwa/service-worker.js';
  let sw = fslib.readFileSync(swPath, 'utf8');
  let needle = `importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");`;
  if (sw.indexOf(needle) === -1) {
    throw new Error("Unable to update service worker");
  }
  let replace = `
    // 
    importScripts("js/workbox-v5.1.3/workbox-sw.js");

    workbox.setConfig({
      modulePathPrefix: 'js/workbox-v5.1.3/'
    });
`;
  sw = sw.replace(needle, replace)
  fslib.writeFileSync(swPath, sw, 'utf8');
}

updateBuildNumber('./', '/src/layouts/MainLayout.vue');
buildMain();
injectLocalServiceWorker();
copyDir.sync('./src/sw-manual/workbox-v5.1.3', './dist/pwa/js/workbox-v5.1.3');
updateAppYaml();
publishMain();