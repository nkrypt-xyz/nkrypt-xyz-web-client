<script lang="ts">
  // UI / Framework
  import Button, { Icon, Label } from "@smui/button";
  import { callMetricsGetSummaryApi } from "../../integration/metrics-apis.js";
  import { handleAnyError } from "../../lib/error-handling.js";
  // Other imports
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
    showAlert,
    showConfirmation,
  } from "../../store/ui.js";
  import { callBucketListApi } from "../../integration/content-apis.js";
  import type { Bucket } from "src/model/common.js";
  import { push } from "svelte-spa-router";

  let bucketList: Bucket[] = [];

  const loadBucketList = async () => {
    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callBucketListApi({});
      decrementActiveGlobalObtrusiveTaskCount();
      ({ bucketList } = response);
      return response;
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };

  loadBucketList();

  const bucketOpenClicked = async (bucket: Bucket) => {
    push(`/explore/${bucket._id}`);
  };

  const bucketManageClicked = async (bucket: Bucket) => {
    push(`/bucket/edit/${bucket._id}`);
  };
</script>

<div class="nk-page buckets">
  <div class="nk-page--inner-wrapper--standard">
    {#each bucketList as bucket}
      <div class="section">
        <div class="title">{bucket.name}</div>

        <div class="item">
          <div class="label">Name</div>
          <div class="value">
            {bucket.name}
          </div>
        </div>

        <div class="item">
          <div class="label">Spec</div>
          <div class="value">
            {bucket.cryptSpec}
          </div>
        </div>

        <div class="item">
          <Button
            variant="unelevated"
            on:click={() => bucketOpenClicked(bucket)}
          >
            <Icon class="material-icons">folder_open</Icon>
            <Label>Open</Label>
          </Button>

          <Button
            variant="outlined"
            style="margin-left: 4px;"
            on:click={() => bucketManageClicked(bucket)}
          >
            <Icon class="material-icons">tune</Icon>
            <Label>Manage</Label>
          </Button>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .buckets {
  }

  .section {
    margin-bottom: 8px;
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
  }

  .section .item .value {
    flex: 2;
  }
</style>
