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
</script>

<div class="nk-page profile">
  <div class="nk-page--inner-wrapper--standard">
    <div class="section">
      <div class="title">User Details</div>

      <div class="item">
        <div class="label">Username</div>
        <div class="value">
          {$storedUser.userName}
        </div>
      </div>

      <div class="item">
        <div class="label">UserID</div>
        <div class="value">
          {$storedUser.userId}
        </div>
      </div>

      <div class="item">
        <div class="label">Display Name</div>
        <div class="value">
          {$storedUser.displayName}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .profile {
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
