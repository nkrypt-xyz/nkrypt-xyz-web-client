<script lang="ts">
  import Button, { Label, Icon } from "@smui/button";
  import { bucketList, currentBucket } from "../store/content.js";
  import { location, push } from "svelte-spa-router";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
    showAlert,
    showBucketPasswordDialog,
    showConfirmation,
    showPrompt,
  } from "../store/ui.js";
  import { derived } from "svelte/store";
  import {
    callDirectoryCreateApi,
    callDirectoryGetApi,
  } from "../integration/content-apis.js";
  import { handleErrorIfAny } from "../lib/error-handling.js";
  import {
    getPasswordForBucket,
    setPasswordForBucket,
  } from "../store/password.js";
  import { getOrCollectPasswordForBucket } from "../lib/password-provider.js";

  const ROUTE_PREFIX = "/explore/";

  let currentPath: string = null;
  let currentBucketPassword: string = null;
  let entityList = [];

  let childDirectoryList = [];
  let childFileList = [];
  let directory = {};

  const loadBucket = async (bucketId) => {
    let bucket = $bucketList.find((bucket) => bucket._id == bucketId);
    if (!bucket) {
      await showAlert(
        "Invalid parameters",
        "The link you are using is invalid. Redirecting you to the dashboard."
      );
      push("/dashboard");
      return;
    }
    console.log(bucket, bucketId, $bucketList);
    currentBucket.set(bucket);
    return bucket;
  };

  const getBucketPassword = async (bucket) => {
    let bucketPassword = await getOrCollectPasswordForBucket(bucket);
    if (!bucketPassword) {
      await showAlert(
        "Password required",
        "The correct encryption password is required to access this bucket."
      );
      push("/dashboard");
      return;
    }
    setPasswordForBucket(bucket._id, bucketPassword);
    return bucketPassword;
  };

  const loadDirectoryAndChildren = async () => {};

  const explorePath = async (explorePath: string) => {
    console.log(`explorePath()`, explorePath);
    currentPath = explorePath;

    let parts = explorePath.split("/");
    let bucketId = parts.shift();

    let bucket = await loadBucket(bucketId);
    currentBucketPassword = await getBucketPassword(bucket);

    incrementActiveGlobalObtrusiveTaskCount();
    let response = await callDirectoryGetApi({
      bucketId,
      directoryId: bucket.rootDirectoryId,
    });
    if (await handleErrorIfAny(response)) return;
    decrementActiveGlobalObtrusiveTaskCount();

    for (let i = 0; i < parts.length; i++) {
      let entityId = parts[i];
    }

    console.log(response);

    ({ childDirectoryList, childFileList, directory } = response);

    // get bucket
    // set bucket
    // get each directory
    // put each directory in stack
    // if last target is a file, put a ref?
  };

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
      bucketId: $currentBucket._id,
      name,
      parentDirectoryId: (directory as any)._id,
      metaData: {},
      encryptedMetaData: "AAA",
    });
    if (await handleErrorIfAny(response)) return;
    decrementActiveGlobalObtrusiveTaskCount();
  };

  const directoryClicked = async (childDirectory) => {
    console.log("childDirectory", childDirectory);
    let path = `${ROUTE_PREFIX}${$currentBucket._id}/${childDirectory._id}`;
    push(path);
  };
</script>

{#if $currentBucket}
  <div>{$currentBucket.name}</div>

  <Button on:click={createDirectoryClicked} variant="unelevated">
    <Icon class="material-icons">create</Icon>
    <Label>Create Directory</Label>
  </Button>

  <h3>Directories</h3>
  {#if childDirectoryList.length === 0}
    No subdirectories found.
  {/if}
  {#each childDirectoryList as childDirectory, i}
    <div class="directory" on:click={() => directoryClicked(childDirectory)}>
      {childDirectory.name}
    </div>
  {/each}

  <h3>Files</h3>
  {#if childFileList.length === 0}
    No files found.
  {/if}
  {#each childFileList as childFile, i}
    <div>{childFile.name}</div>
  {/each}
{/if}

<style>
  .directory {
    margin: 16px;
  }
</style>
