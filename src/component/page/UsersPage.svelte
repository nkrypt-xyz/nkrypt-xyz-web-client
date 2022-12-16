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
  import { callUserListApi } from "../../integration/user-apis.js";
  import type { User } from "src/model/common.js";

  let userList: User[] = [];

  const loadUserList = async () => {
    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callUserListApi({});
      decrementActiveGlobalObtrusiveTaskCount();
      ({ userList } = response);
      return response;
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };

  loadUserList();
</script>

<div class="nk-page users">
  <div class="nk-page--inner-wrapper--standard">
    {#each userList as user}
      <div class="section">
        <div class="title">{user.userName}</div>

        <div class="item">
          <div class="label">Username</div>
          <div class="value">
            {user.userName}
          </div>
        </div>

        <div class="item">
          <div class="label">Display Name</div>
          <div class="value">
            {user.displayName}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .users {
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
