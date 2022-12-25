<script lang="ts">
  import Button, { Icon, Label } from "@smui/button";
  import CircularProgress from "@smui/circular-progress";
  import { location } from "svelte-spa-router";
  import { derived } from "svelte/store";
  import { callFileGetApi } from "../../integration/content-apis.js";
  import { downloadAndDecryptFileIntoArrayBuffer } from "../../lib/crypto-transit-basic.js";
  import { handleAnyError } from "../../lib/error-handling.js";
  import {
    navigateToPreviousPageOrDashboard,
    navigateToRoute,
  } from "../../lib/navigation-helper.js";
  import { getOrCollectPasswordForBucket } from "../../lib/password-provider.js";
  import { bucketList } from "../../store/content.js";
  import { setPasswordForBucket } from "../../store/password.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
    showAlert,
    showCommonErrorDialog,
  } from "../../store/ui.js";

  const ROUTE_PREFIX = "/view-image/";

  let currentPath: string = null;

  let currentBucketPassword: string = null;

  let currentBucket = null;

  let currentFile = null;

  let isLoaded = false;
  let imageDataUrl = "";

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
      navigateToRoute("/dashboard");
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
    navigateToPreviousPageOrDashboard();
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
      imageDataUrl = URL.createObjectURL(
        new Blob([uInt8Array.buffer], { type: currentFile.mimeType })
      );
      isLoaded = true;
    } catch (ex) {
      await showCommonErrorDialog(ex);
      returnToPreviousPage();
      return;
    }
  };

  const openImageFile = async (bucketIdAndFileId: string) => {
    console.debug(`openImageFile(${bucketIdAndFileId})`);
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
      openImageFile(pathString);
    }
  });

  const resetData = () => {
    isLoaded = false;
    imageDataUrl = null;
    currentBucket = null;
    currentBucketPassword = null;
    currentFile = null;
    currentPath = null;
  };

  const closeClicked = async () => {
    returnToPreviousPage();
  };
</script>

<div class="nk-page">
  <div class="nk-page--inner-wrapper--standard">
    {#if currentBucket && isLoaded}
      <div class="file-name">
        <div class="file-name-text">{currentFile.name}</div>
        <Icon class="file-name-icon material-icons">image</Icon>
      </div>

      <img class="preview-image" src={imageDataUrl} alt="Actual content" />

      <div class="button-row">
        <Button
          class="close-button"
          variant="raised"
          color="secondary"
          on:click={() => closeClicked()}
        >
          <Label>Close</Label>
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

  .preview-image {
    width: 100%;
    max-height: calc(100vh - 64px - 0px - 50px - 100px);
    font-family: "Courier New", Courier, monospace;
    font-size: 14px;
    background-color: #fffdd0;
  }
</style>
