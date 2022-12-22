<script lang="ts">
  // UI / Framework
  import IconButton from "@smui/icon-button";
  import {
    downloadAndDecryptFileIntoArrayBuffer,
    encryptAndUploadArrayBuffer,
  } from "../../lib/crypto-transit-basic.js";
  import { location, push } from "svelte-spa-router";
  import { derived } from "svelte/store";
  // Other imports
  import {
    callDirectoryCreateApi,
    callDirectoryGetApi,
    callFileGetApi,
    callFileSetMetaDataApi,
  } from "../../integration/content-apis.js";
  import { handleAnyError } from "../../lib/error-handling.js";
  import { getOrCollectPasswordForBucket } from "../../lib/password-provider.js";
  import { activeBucket, bucketList } from "../../store/content.js";
  import { setPasswordForBucket } from "../../store/password.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
    showAlert,
    showCommonErrorDialog,
    showConfirmation,
    showPrompt,
    showThreeStateConfirmation,
    ThreeStateConfirmationState,
  } from "../../store/ui.js";
  import { encryptObject } from "../../utility/crypto-utils.js";
  import Breadcrumbs from "./ExplorePage/Breadcrumbs.svelte";
  import DirectorySection from "./ExplorePage/DirectorySection.svelte";
  import FileOperationModal from "./ExplorePage/FileOperationModal.svelte";
  import FileSection from "./ExplorePage/FileSection.svelte";
  import FileUploadModal from "./ExplorePage/FileUploadModal.svelte";
  import PropertiesModal from "./ExplorePage/PropertiesModal.svelte";
  import { convertSmallUint8ArrayToString } from "../../utility/buffer-utils.js";
  import CircularProgress from "@smui/circular-progress";
  import Textfield from "@smui/textfield";
  import HelperText from "@smui/textfield/helper-text";
  import Button, { Label, Icon } from "@smui/button";
  import { text } from "svelte/internal";

  const ROUTE_PREFIX = "/edit-plain-text/";

  let currentPath: string = null;

  let currentBucketPassword: string = null;

  let currentBucket = null;
  let entityStack = [];

  let currentFile = null;

  let isLoaded = false;
  let textContent = "";

  let isDirty = false;

  const handleInvalidParameter = async () => {
    await showAlert(
      "Invalid parameters",
      "The link you are using is invalid. Redirecting you to the dashboard."
    );
    returnToPreviousPage();
    return;
  };

  const loadBucket = async (bucketId): Promise<void> => {
    let bucket = $bucketList.find((bucket) => bucket._id == bucketId);
    if (!bucket) {
      handleInvalidParameter();
      return;
    }
    currentBucket = bucket;
  };

  const loadCurrentBucketPassword = async (): Promise<void> => {
    let bucketPassword = await getOrCollectPasswordForBucket(currentBucket);
    if (!bucketPassword) {
      await showAlert(
        "Password required",
        "The correct encryption password is required to access this bucket."
      );
      push("/dashboard");
      return;
    }
    setPasswordForBucket(currentBucket._id, bucketPassword);
    currentBucketPassword = bucketPassword;
  };

  const getFile = async (fileId: string) => {
    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callFileGetApi({
        bucketId: currentBucket._id,
        fileId,
      });
      decrementActiveGlobalObtrusiveTaskCount();
      return response;
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };

  const returnToPreviousPage = () => {
    resetData();
    history.back();
  };

  const loadFile = async (fileId: string) => {
    let response = await getFile(fileId);
    currentFile = response.file;

    if (!currentFile) {
      await showAlert(
        "File not found",
        "The link you provided does not point to a file in the given bucket"
      );
      returnToPreviousPage();
      return;
    }

    try {
      let uInt8Array = await downloadAndDecryptFileIntoArrayBuffer(
        currentFile.bucketId,
        currentFile._id,
        currentBucketPassword,
        () => {}
      );
      textContent = new TextDecoder().decode(uInt8Array);
      isLoaded = true;
      isDirty = false;
    } catch (ex) {
      await showCommonErrorDialog(ex);
      returnToPreviousPage();
      return;
    }
  };

  const openPlainTextFile = async (bucketIdAndFileId: string) => {
    console.debug(`openPlainTextFile(${bucketIdAndFileId})`);
    currentPath = bucketIdAndFileId;

    isLoaded = false;

    let parts = bucketIdAndFileId.split("/").filter((part) => part.length > 0);
    let bucketId = parts.shift();
    let fileId = parts.shift();

    await loadBucket(bucketId);
    await loadCurrentBucketPassword();
    await loadFile(fileId);
  };

  // Watch parameter changes
  const derived1 = derived([location, bucketList], ([$a, $b]) => [$a, $b]);
  derived1.subscribe(([location, bucketList]) => {
    if (
      location &&
      bucketList.length > 0 &&
      location.indexOf(ROUTE_PREFIX) > -1
    ) {
      let pathString = (location as string).replace(ROUTE_PREFIX, "");
      openPlainTextFile(pathString);
    }
  });

  const resetData = () => {
    isLoaded = false;
    isDirty = false;
    textContent = null;
    currentBucket = null;
    currentBucketPassword = null;
    currentFile = null;
    currentPath = null;
  };

  const saveFile = async () => {
    const encoder = new TextEncoder();
    let encodedData = encoder.encode(textContent);

    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await encryptAndUploadArrayBuffer(
        currentFile.bucketId,
        currentFile._id,
        encodedData.buffer,
        currentBucketPassword,
        () => {}
      );
      isDirty = false;
      decrementActiveGlobalObtrusiveTaskCount();

      {
        incrementActiveGlobalObtrusiveTaskCount();
        let metaData = {
          size: encodedData.byteLength,
          mimeType: currentFile.metaData.mimeType,
        };
        let response = await callFileSetMetaDataApi({
          bucketId: currentBucket._id,
          fileId: currentFile._id,
          metaData,
        });
        decrementActiveGlobalObtrusiveTaskCount();
      }

      return true;
    } catch (ex) {
      await showCommonErrorDialog(ex);
      return false;
    }
  };

  const saveClicked = async () => {
    await saveFile();
  };

  const closeClicked = async () => {
    if (isDirty) {
      let answer = await showThreeStateConfirmation(
        "Save changes",
        "Save your changed before you exit?"
      );
      if (answer === ThreeStateConfirmationState.YES) {
        let wasSuccessful = await saveFile();
        if (!wasSuccessful) return;
      } else if (answer === ThreeStateConfirmationState.NO) {
        ("pass");
      } else if (answer === ThreeStateConfirmationState.CANCEL) {
        return;
      }
    }

    returnToPreviousPage();
  };

  const textChanged = () => {
    isDirty = true;
  };
</script>

<div class="nk-page">
  <div class="nk-page--inner-wrapper--standard">
    {#if currentBucket && isLoaded}
      <div class="file-name">
        <div class="file-name-text">{currentFile.name}</div>
        <Icon class="file-name-icon material-icons">edit</Icon>
      </div>

      <textarea
        class="plain-text-textarea"
        bind:value={textContent}
        on:keypress={textChanged}
      />

      <div class="button-row">
        <Button
          class="close-button"
          variant="raised"
          color="secondary"
          on:click={() => closeClicked()}
        >
          <Label>Close</Label>
        </Button>
        <Button
          class="save-button"
          variant="raised"
          on:click={() => saveClicked()}
        >
          <Label>Save</Label>
        </Button>
      </div>
    {:else}
      <div style="text-align: center; margin-top: calc(40vh - 30px);">
        <CircularProgress style="height: 48px; width: 48px;" indeterminate />
        <div style="color: grey;">Loading content</div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* clear browser's default style */
  .plain-text-textarea {
    border: none;
    overflow: auto;
    outline: none;

    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;

    resize: none;
    white-space: pre;
    overflow-wrap: normal;
    overflow-x: scroll;
  }

  .file-name {
    display: flex;
    justify-content: end;
    align-items: center;
    margin-bottom: 8px;
  }

  .file-name-text {
    display: inline-block;
  }

  * :global(.file-name-icon) {
    font-size: 20px !important;
    margin-left: 4px;
  }

  .plain-text-textarea {
    width: 100%;
    height: calc(100vh - 64px - 0px - 50px - 100px);
    font-family: "Courier New", Courier, monospace;
    font-size: 14px;
    background-color: #fffdd0;
  }
</style>
