<script lang="ts">
  // UI / Framework
  import Button, { Icon, Label } from "@smui/button";
  import { storedUser } from "../../store/user.js";
  import { callMetricsGetSummaryApi } from "../../integration/metrics-apis.js";
  import { handleAnyError } from "../../lib/error-handling.js";
  // Other imports
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
    showAlert,
    showConfirmation,
  } from "../../store/ui.js";

  let metrics = null;

  const loadMetrics = async () => {
    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callMetricsGetSummaryApi({});
      decrementActiveGlobalObtrusiveTaskCount();
      metrics = response;
      return response;
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };

  const formatSize = (bytes) => {
    let value = Math.round(((bytes || 0) / 1000 / 1000 / 1000) * 100) / 100;
    return `${value} GB`;
  };

  loadMetrics();
</script>

<div class="nk-page dashboard">
  Welcome, {$storedUser.displayName}

  {#if metrics && metrics.disk}
    <div class="section">
      <div class="title">Disk Usage</div>

      <div class="item">
        <div class="label">Used</div>
        <div class="value">
          {formatSize(metrics.disk.usedBytes)}
        </div>
      </div>

      <div class="item">
        <div class="label">Total</div>
        <div class="value">
          {formatSize(metrics.disk.totalBytes)}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard {
    padding: 8px;
  }

  .section {
    margin-top: 6px;
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
