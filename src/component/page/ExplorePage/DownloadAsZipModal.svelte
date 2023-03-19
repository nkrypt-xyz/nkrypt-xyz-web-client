<script lang="ts">
  import Button, { Label } from "@smui/button";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import { epochToPrettyDateTime } from "../../../lib/date-helper.js";
  import { arrayDistinct, deepMerge, sleep } from "../../../lib/misc-utils.js";
  import { decryptToObject } from "../../../utility/crypto-utils.js";
  import * as zip from "@zip.js/zip.js";
  import { downloadAndDecryptFileIntoArrayBuffer } from "../../../lib/crypto-transit-basic.js";
  import { callDirectoryGetApi } from "../../../integration/content-apis.js";
  import { handleAnyError } from "../../../lib/error-handling.js";
  import * as promisekeeper from "@ishafayet/promisekeeper";

  const CONCURRENT_ZIP_PROCESSES = 4;

  const DownloadAsZipModalState = {
    IDLE: "IDLE",
    ACTIVE: "ACTIVE",
  };

  let state = DownloadAsZipModalState.IDLE;

  let entity = null;
  let isDirectory = false;
  let bucketPassword = null;

  let hasChanges = false;

  let acceptFn = null;
  let rejectFn = null;

  let wrapper;

  let temporarilyDecryptedEncryptedMetaData = {};

  let directoriesDiscovered = 0;
  let filesDiscovered = 0;
  let filesDownloaded = 0;
  let filesZipped = 0;
  let stateMessage = "";

  let isAborted = true;

  export function showModal(params: {
    entity;
    isDirectory;
    bucketPassword;
  }): Promise<string> {
    return new Promise<string>(async (accept, reject) => {
      isAborted = false;

      ({ entity, isDirectory, bucketPassword } = params);

      temporarilyDecryptedEncryptedMetaData = await decryptToObject(
        entity.encryptedMetaData,
        bucketPassword
      );

      console.debug("Going to create zip of entity", {
        entity,
        isDirectory,
        metaData: entity.metaData,
        temporarilyDecryptedEncryptedMetaData,
      });

      acceptFn = accept;
      rejectFn = reject;

      directoriesDiscovered = 0;
      filesDiscovered = 0;
      filesDownloaded = 0;
      filesZipped = 0;
      stateMessage = "";

      // start the show
      state = DownloadAsZipModalState.ACTIVE;

      prepareZipToBeDownloaded();
    });
  }

  const setAnswer = (answer) => {
    isAborted = true;
    hasChanges = false;
    state = DownloadAsZipModalState.IDLE;
    temporarilyDecryptedEncryptedMetaData = {};
    acceptFn(answer || null);
    return;
  };

  const initiateFileDownloadFromBlob = (blob: Blob, fileNameForDownloading) => {
    let url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileNameForDownloading;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  const getDirectory = async (directoryId: string, bucketId: string) => {
    try {
      let response = await callDirectoryGetApi({
        bucketId: bucketId,
        directoryId: directoryId,
      });
      return response;
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };

  const recursivelyIncludeInZip = async (
    zipWriter: zip.ZipWriter<any>,
    parentDirectoryPath,
    entity,
    isDirectory,
    promiseMakerList
  ) => {
    if (isDirectory) {
      directoriesDiscovered += 1;

      let entityWrapper = await getDirectory(entity._id, entity.bucketId);

      for (let childDirectory of entityWrapper.childDirectoryList) {
        await recursivelyIncludeInZip(
          zipWriter,
          parentDirectoryPath + "/" + entity.name,
          childDirectory,
          true,
          promiseMakerList
        );
      }

      for (let childFile of entityWrapper.childFileList) {
        await recursivelyIncludeInZip(
          zipWriter,
          parentDirectoryPath + "/" + entity.name,
          childFile,
          false,
          promiseMakerList
        );
      }

      return;
    }

    if (isAborted) return;

    filesDiscovered += 1;

    promiseMakerList.push(async () => {
      let decryptedArrayBuffer = await downloadAndDecryptFileIntoArrayBuffer(
        entity.bucketId,
        entity._id,
        bucketPassword,
        () => {}
      );

      filesDownloaded += 1;

      let stream = new ReadableStream({
        start(controller) {
          controller.enqueue(decryptedArrayBuffer);
          controller.close();
        },
      });

      filesZipped += 1;

      await zipWriter.add(parentDirectoryPath + "/" + entity.name, stream);
    });
  };

  const prepareZipToBeDownloaded = async () => {
    const zipFileWriter = new zip.BlobWriter();
    const zipWriter = new zip.ZipWriter(zipFileWriter);

    stateMessage = "Exploring...";

    let promiseMakerList = [];
    await recursivelyIncludeInZip(
      zipWriter,
      "",
      entity,
      isDirectory,
      promiseMakerList
    );

    stateMessage = "Downloading, Decrypting and Archiving...";
    if (isAborted) return;

    await promisekeeper.mapList(
      CONCURRENT_ZIP_PROCESSES,
      promiseMakerList,
      async (fn) => {
        await fn();
      }
    );

    stateMessage = "Preparing Zip File...";
    if (isAborted) return;
    await sleep(100);

    await zipWriter.close();
    const zipFileBlob = await zipFileWriter.getData();

    stateMessage = "Initiating download...";
    if (isAborted) return;

    initiateFileDownloadFromBlob(zipFileBlob, entity.name + ".zip");

    setTimeout(() => {
      setAnswer(null);
    }, 1000);
  };

  let shouldShowDialog = false;
  $: {
    shouldShowDialog = state !== DownloadAsZipModalState.IDLE;
  }
</script>

{#if shouldShowDialog}
  <div bind:this={wrapper}>
    <Dialog
      bind:open={shouldShowDialog}
      scrimClickAction=""
      escapeKeyAction=""
      aria-labelledby="mandatory-title"
      aria-describedby="mandatory-content"
    >
      <Title id="mandatory-title">Download as ZIP</Title>

      <Content id="mandatory-content">
        {#if entity}
          <div>
            <div style="margin-bottom: 12px;">{stateMessage}</div>

            <div>Directories Discovered: {directoriesDiscovered}</div>
            <div>Files Discovered: {filesDiscovered}</div>
            <div>Files Downloaded: {filesDownloaded}</div>
            <div>Files Zipped: {filesZipped}</div>
          </div>
        {/if}
      </Content>
      <Actions>
        <Button
          on:click={(e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            setAnswer(false);
          }}
        >
          <Label>Abort</Label>
        </Button>
      </Actions>
    </Dialog>
  </div>
{/if}

<style>
  .section {
    margin-top: 6px;
    font-size: 12px;
  }

  .section .title {
    background-color: #2a8dc7;
    color: white;
    padding: 8px;
  }

  .section .item {
    display: flex;
    padding: 4px;

    background-color: #bbd6e6;
  }

  .section .item .label {
    flex: 1;
    padding-right: 4px;
  }

  .section .item .value {
    flex: 2;
  }
</style>
