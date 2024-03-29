<script lang="ts">
  import Button, { Icon, Label } from "@smui/button";
  import {
    callUserSessionListApi,
    callUserSessionLogoutAllApi,
  } from "../../integration/user-apis.js";
  import { epochToPrettyDateTime } from "../../lib/date-helper.js";
  import { handleAnyError } from "../../lib/error-handling.js";
  import { globalPermissionDetails } from "../../lib/permissions-helper.js";
  import { performUserLogout } from "../../lib/session.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
    showUpdateUserPasswordDialog,
    showUpdateUserProfileDialog,
  } from "../../store/ui.js";
  import { storedUser } from "../../store/user.js";
  import UpdateUserPasswordDialog from "./ProfilePage/UpdateUserPasswordDialog.svelte";
  import UpdateUserProfileDialog from "./ProfilePage/UpdateUserProfileDialog.svelte";

  let sessionList = [];

  const loadSessionList = async () => {
    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callUserSessionListApi({});
      decrementActiveGlobalObtrusiveTaskCount();
      ({ sessionList } = response);
      return response;
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };

  loadSessionList();

  const logoutFromAllDevicesClicked = async () => {
    try {
      incrementActiveGlobalObtrusiveTaskCount();
      await callUserSessionLogoutAllApi({
        message: "User initiated logout from all devices.",
      });
      decrementActiveGlobalObtrusiveTaskCount();
      await performUserLogout();
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };
</script>

<UpdateUserPasswordDialog />
<UpdateUserProfileDialog />
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

    <div class="section">
      <div class="title">Permissions</div>

      {#each Object.keys($storedUser.globalPermissions || {}) as key}
        <div class="item">
          <div class="label" style="flex: 4">
            {globalPermissionDetails[key]}
          </div>
          <div class="value">
            {$storedUser.globalPermissions[key] ? "Allowed" : "Not allowed"}
          </div>
        </div>
      {/each}
    </div>

    <div class="nk--button-row">
      <Button
        variant="raised"
        class="hero-button"
        on:click={showUpdateUserProfileDialog}
      >
        <Icon class="material-icons">person</Icon>
        <Label>Update Profile</Label>
      </Button>
      <Button
        variant="raised"
        class="hero-button"
        on:click={showUpdateUserPasswordDialog}
      >
        <Icon class="material-icons">password</Icon>
        <Label>Change Login Password</Label>
      </Button>
    </div>

    <div class="section">
      <div class="title">Sessions (up to last 20)</div>

      {#each sessionList as session}
        <div
          class="item"
          style="padding-bottom: 8px; border-bottom: 1px solid #dddddd;"
        >
          <div class="label" style="flex: 4; font-size: 12px;">
            Login: {epochToPrettyDateTime(session.createdAt)}
            {#if session.hasExpired}
              <br />
              Expiry: {epochToPrettyDateTime(session.expiredAt)}
              <br />
              <div style="font-style: italic;">
                ({session.expireReason})
              </div>
            {/if}
          </div>
          <div class="value" style="flex: 1; font-size: 12px;">
            {session.isCurrentSession ? "(Current session)" : ""}
            {session.hasExpired ? "(Expired)" : ""}
          </div>
        </div>
      {/each}
    </div>

    <div class="nk--button-row">
      <Button
        variant="raised"
        class="hero-button"
        on:click={logoutFromAllDevicesClicked}
      >
        <Icon class="material-icons">person</Icon>
        <Label>Logout from all Sessions</Label>
      </Button>
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
