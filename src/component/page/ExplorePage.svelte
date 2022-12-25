<script lang="ts">
  // UI / Framework
  import IconButton from "@smui/icon-button";
  import { encryptAndUploadArrayBuffer } from "../../lib/crypto-transit-basic.js";
  import { location, push } from "svelte-spa-router";
  import { derived } from "svelte/store";
  // Other imports
  import {
    callDirectoryCreateApi,
    callDirectoryGetApi,
    callDirectoryMoveApi,
    callFileCreateApi,
    callFileMoveApi,
    callFileRenameApi,
    callFileSetEncryptedMetaDataApi,
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
    showPrompt,
  } from "../../store/ui.js";
  import { encryptObject } from "../../utility/crypto-utils.js";
  import Breadcrumbs from "./ExplorePage/Breadcrumbs.svelte";
  import DirectorySection from "./ExplorePage/DirectorySection.svelte";
  import FileOperationModal from "./ExplorePage/FileOperationModal.svelte";
  import FileSection from "./ExplorePage/FileSection.svelte";
  import FileBulkUploadModal from "./ExplorePage/FileBulkUploadModal.svelte";
  import PropertiesModal from "./ExplorePage/PropertiesModal.svelte";
  import { MiscConstant } from "../../constant/misc-constants.js";
  import { createTextFile } from "./ExplorePage/create-text-file.js";
  import { MetaDataConstant } from "../../constant/meta-data-constants.js";
  import { ClipboardAction } from "./ExplorePage/clipboard-helper.js";
  import Clipboard from "./ExplorePage/Clipboard.svelte";

  let _bucketList = [];
  bucketList.subscribe((value) => {
    _bucketList = value;
  });

  const ROUTE_PREFIX = "/explore/";

  let currentPath: string = null;

  let currentBucketPassword: string = null;

  let currentBucket = null;
  let entityStack = [];

  let childDirectoryList = [];
  let childFileList = [];
  let currentDirectory = null;

  let clipboard = null;

  const handleInvalidParameter = async () => {
    await showAlert(
      "Invalid parameters",
      "The link you are using is invalid. Redirecting you to the dashboard."
    );
    push("/dashboard");
    return;
  };

  const loadBucket = async (bucketId): Promise<void> => {
    let bucket = _bucketList.find((bucket) => bucket._id == bucketId);
    if (!bucket) {
      handleInvalidParameter();
      return;
    }
    currentBucket = bucket;
    activeBucket.set(currentBucket);
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

  const getDirectory = async (directoryId: string) => {
    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callDirectoryGetApi({
        bucketId: currentBucket._id,
        directoryId: directoryId,
      });
      decrementActiveGlobalObtrusiveTaskCount();
      return response;
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };

  const loadRootDirectory = async (): Promise<void> => {
    let response = await getDirectory(currentBucket.rootDirectoryId);
    // TODO: handle edge case
    if (!response) return;
    entityStack = [response];
  };

  const loadCurrentDirectoryAndChildren = async () => {
    let head = entityStack[entityStack.length - 1];
    ({ directory: currentDirectory, childDirectoryList, childFileList } = head);
  };

  const loadEntityStack = async (parts: string[]) => {
    let fileId = null;
    for (let i = 0; i < parts.length; i++) {
      if (fileId) {
        console.error(new Error(`Files cannot contain children.`));
        handleInvalidParameter();
        return;
      }

      let entityId = parts[i];
      let head = entityStack[entityStack.length - 1];

      if (head.childDirectoryList.find((child) => child._id === entityId)) {
        // it is a directory

        let response = await getDirectory(entityId);
        // TODO: handle edge case
        if (!response) return;
        entityStack = [...entityStack, response];
      } else if (head.childFileList.find((child) => child._id === entityId)) {
        // it is a file
        alert("File handling is a work in progress.");
      } else {
        console.error(
          new Error(
            `Directory "${head.name}"" has no directory/file with ID "${entityId}".`
          )
        );
        handleInvalidParameter();
        return;
      }
    }
  };

  const explorePath = async (pathToExplore: string) => {
    console.debug(`explorePath(${pathToExplore})`);
    currentPath = pathToExplore;

    let parts = pathToExplore.split("/").filter((part) => part.length > 0);
    let bucketId = parts.shift();

    await loadBucket(bucketId);
    await loadCurrentBucketPassword();
    await loadRootDirectory();
    await loadEntityStack(parts);
    await loadCurrentDirectoryAndChildren();
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
      explorePath(pathString);
    }
  });

  const initiateMoveFn = async (childEntity, isDirectory: boolean) => {
    clipboard = {
      action: ClipboardAction.CUT,
      isDirectory,
      childEntity,
      entityStack: JSON.parse(JSON.stringify(entityStack)),
    };
    console.debug("Putting in clipboard", clipboard);
  };

  const performClipboardActionFn = async (affirmative: boolean) => {
    if (!affirmative) {
      clipboard = null;
      return;
    }

    if (clipboard.isDirectory) {
      try {
        incrementActiveGlobalObtrusiveTaskCount();
        let data = {
          bucketId: currentBucket._id,
          directoryId: clipboard.childEntity._id,
          newName: clipboard.childEntity.name,
          newParentDirectoryId: currentDirectory._id,
        };
        await callDirectoryMoveApi(data);
        decrementActiveGlobalObtrusiveTaskCount();
      } catch (ex) {
        await handleAnyError(ex);
      }
    } else {
      try {
        incrementActiveGlobalObtrusiveTaskCount();
        let data = {
          bucketId: currentBucket._id,
          fileId: clipboard.childEntity._id,
          newName: clipboard.childEntity.name,
          newParentDirectoryId: currentDirectory._id,
        };
        await callFileMoveApi(data);
        decrementActiveGlobalObtrusiveTaskCount();
      } catch (ex) {
        await handleAnyError(ex);
      }
    }

    clipboard = null;
    await refreshExplorePage();
  };

  const createDirectoryClicked = async () => {
    try {
      let name = await showPrompt(
        "Create directory",
        "Enter directory name",
        ""
      );
      if (!name) return;

      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callDirectoryCreateApi({
        bucketId: currentBucket._id,
        name,
        parentDirectoryId: (currentDirectory as any)._id,
        metaData: {
          [MetaDataConstant.ORIGIN_GROUP_NAME]: {
            [MetaDataConstant.ORIGIN.ORIGINATION_SOURCE]:
              MiscConstant.ORIGINATION_SOURCE_CREATE_DIRECTORY,
            [MetaDataConstant.ORIGIN.ORIGINATION_DATE]: Date.now(),
          },
        },
        encryptedMetaData: await encryptObject({}, currentBucketPassword),
      });
      decrementActiveGlobalObtrusiveTaskCount();

      explorePath(currentPath);
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };

  const createFileClicked = async () => {
    try {
      let name = await showPrompt("Create a text file", "Enter file name", "");
      if (!name) return;

      await createTextFile(
        currentBucket,
        currentDirectory,
        currentBucketPassword,
        name
      );
      explorePath(currentPath);
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };

  const childDirectoryClicked = async (childDirectory) => {
    console.debug("Tapped sub-directory:", childDirectory);

    let path = `${ROUTE_PREFIX}${currentBucket._id}`;
    if (entityStack.length > 1) {
      path +=
        "/" +
        entityStack
          .slice(1)
          .map((e) => e.directory._id)
          .join("/");
    }
    path += `/${childDirectory._id}`;
    push(path);
  };

  let fileOperationModal;
  const childFileClicked = async (childFile) => {
    console.debug("Tapped file:", childFile);

    let nullableResponse = await fileOperationModal.showModal({
      file: childFile,
      bucketPassword: currentBucketPassword,
    });

    console.debug(
      "File operation modal closed with response:",
      nullableResponse
    );
  };

  const breadcrumbClicked = async (targetEntity) => {
    let path = `${ROUTE_PREFIX}${currentBucket._id}`;
    if (targetEntity) {
      for (let i = 1; i < entityStack.length; i++) {
        let entity = entityStack[i];
        path += "/" + entity.directory._id;
        if (targetEntity.directory._id === entity.directory._id) break;
      }
    }
    push(path);
  };

  const goUpClicked = async () => {
    if (entityStack.length > 2) {
      breadcrumbClicked(entityStack[entityStack.length - 2]);
    } else {
      breadcrumbClicked(null);
    }
  };

  const refreshExplorePage = async (hardRefresh = false) => {
    if (hardRefresh) {
      childDirectoryList = [];
      childFileList = [];
    }
    await explorePath(currentPath);
  };

  const refreshClicked = async () => {
    refreshExplorePage(true);
  };

  let fileUploadModal;
  const fileUploadClicked = async () => {
    let directoryEntity = entityStack[entityStack.length - 1];
    let nullableResponse = await fileUploadModal.showAndUploadFile({
      ...directoryEntity,
      bucketPassword: currentBucketPassword,
    });
    console.debug("File upload results:", nullableResponse);
    if (nullableResponse && !nullableResponse.hasError) {
      explorePath(currentPath);
    }
  };

  let propertiesModal;

  const viewPropertiesOfChildDirectoryClicked = async (childDirectory) => {
    let nullableResponse = await propertiesModal.showModal({
      entity: childDirectory,
      isDirectory: true,
      bucketPassword: currentBucketPassword,
    });
  };

  const viewPropertiesOfChildFileClicked = async (childFile) => {
    let nullableResponse = await propertiesModal.showModal({
      entity: childFile,
      isDirectory: false,
      bucketPassword: currentBucketPassword,
    });
  };
</script>

<FileBulkUploadModal bind:this={fileUploadModal} />
<FileOperationModal bind:this={fileOperationModal} />
<PropertiesModal bind:this={propertiesModal} />

<div class="nk-page">
  <div class="nk-page--inner-wrapper--standard gb--no-padding-on-mobile">
    {#if currentBucket}
      <Breadcrumbs {breadcrumbClicked} {entityStack} {currentBucket} />

      <div class="control-row">
        <IconButton
          disabled={entityStack.length <= 1}
          size="mini"
          class="material-icons control-row-icon-button"
          on:click={goUpClicked}
          >arrow_upward
        </IconButton>

        <IconButton
          size="mini"
          class="material-icons control-row-icon-button"
          on:click={refreshClicked}
          >refresh
        </IconButton>

        <IconButton
          size="mini"
          class="material-icons control-row-icon-button"
          on:click={createDirectoryClicked}
          >create_new_folder
        </IconButton>

        <IconButton
          size="mini"
          class="material-icons control-row-icon-button"
          on:click={createFileClicked}
          >post_add
        </IconButton>

        <IconButton
          size="mini"
          class="material-icons control-row-icon-button"
          on:click={fileUploadClicked}
          >file_upload
        </IconButton>
      </div>

      <Clipboard {performClipboardActionFn} {clipboard} />

      <DirectorySection
        {childDirectoryList}
        {childDirectoryClicked}
        {refreshExplorePage}
        {initiateMoveFn}
        {viewPropertiesOfChildDirectoryClicked}
      />

      <FileSection
        {childFileList}
        {childFileClicked}
        {refreshExplorePage}
        {initiateMoveFn}
        {viewPropertiesOfChildFileClicked}
      />
    {/if}
  </div>
</div>

<style>
  .control-row {
    margin-left: 4px;
    margin-top: 8px;
    display: flex;
    align-items: center;
  }

  .control-row :global(.control-row-icon-button) {
    background-color: #dfdfdf;
    border-radius: 50%;
    margin-right: 4px;
  }

  .control-row :global(.control-row-icon-button:not([disabled])) {
    color: #0275d8;
  }
</style>
