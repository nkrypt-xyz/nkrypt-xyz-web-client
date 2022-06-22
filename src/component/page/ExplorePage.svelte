<script lang="ts">
  import Button, { Label, Icon } from "@smui/button";
  import IconButton from "@smui/icon-button";
  import { activeBucket, bucketList } from "../../store/content.js";
  import { location, push } from "svelte-spa-router";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
    showAlert,
    showBucketPasswordDialog,
    showConfirmation,
    showPrompt,
  } from "../../store/ui.js";
  import { derived } from "svelte/store";
  import {
    callDirectoryCreateApi,
    callDirectoryGetApi,
  } from "../../integration/content-apis.js";
  import { handleErrorIfAny } from "../../lib/error-handling.js";
  import {
    getPasswordForBucket,
    setPasswordForBucket,
  } from "../../store/password.js";
  import { getOrCollectPasswordForBucket } from "../../lib/password-provider.js";
  import { encryptObject, encryptText } from "../../utility/crypto-utils.js";
  import Breadcrumbs from "./ExplorePage/Breadcrumbs.svelte";
  import DirectorySection from "./ExplorePage/DirectorySection.svelte";
  import FileSection from "./ExplorePage/FileSection.svelte";

  const ROUTE_PREFIX = "/explore/";

  let currentPath: string = null;

  let currentBucketPassword: string = null;

  let currentBucket = null;
  let entityStack = [];

  let childDirectoryList = [];
  let childFileList = [];
  let currentDirectory = null;

  const handleInvalidParameter = async () => {
    await showAlert(
      "Invalid parameters",
      "The link you are using is invalid. Redirecting you to the dashboard."
    );
    push("/dashboard");
    return;
  };

  const loadBucket = async (bucketId): Promise<void> => {
    let bucket = $bucketList.find((bucket) => bucket._id == bucketId);
    if (!bucket) {
      handleInvalidParameter();
      return;
    }
    // console.log("Found bucket:", bucket);
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
    incrementActiveGlobalObtrusiveTaskCount();
    let response = await callDirectoryGetApi({
      bucketId: currentBucket._id,
      directoryId: directoryId,
    });
    if (await handleErrorIfAny(response)) return;
    decrementActiveGlobalObtrusiveTaskCount();
    // console.log("DIRECTORY ", response);
    return response;
  };

  const loadRootDirectory = async (): Promise<void> => {
    let response = await getDirectory(currentBucket.rootDirectoryId);
    // TODO: handle edge case
    if (!response) return;
    entityStack = [response];
  };

  const loadCurrentDirectoryAndChildren = async () => {
    let head = entityStack[entityStack.length - 1];
    // console.log("permanent head", head);
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
      // console.log("temp head", head);

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

  const explorePath = async (explorePath: string) => {
    console.log(`explorePath()`, explorePath);
    currentPath = explorePath;

    let parts = explorePath.split("/").filter((part) => part.length > 0);
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

  const createDirectoryClicked = async () => {
    let name = await showPrompt("Create directory", "Enter directory name");
    if (!name) return;

    incrementActiveGlobalObtrusiveTaskCount();
    let response = await callDirectoryCreateApi({
      bucketId: currentBucket._id,
      name,
      parentDirectoryId: (currentDirectory as any)._id,
      metaData: {},
      encryptedMetaData: await encryptObject({}, currentBucketPassword),
    });
    if (await handleErrorIfAny(response)) return;
    decrementActiveGlobalObtrusiveTaskCount();

    explorePath(currentPath);
  };

  const childDirectoryClicked = async (childDirectory) => {
    console.debug("childDirectory", childDirectory);

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

  const childFileClicked = async (childFile) => {
    console.debug("childFile", childFile);

    alert("work in progress");
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
</script>

<div class="nk-page">
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
        on:click={createDirectoryClicked}
        >create_new_folder
      </IconButton>
    </div>

    <DirectorySection {childDirectoryList} {childDirectoryClicked} />

    <FileSection {childFileList} {childFileClicked} />
  {/if}
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