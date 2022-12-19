<script lang="ts">
  // UI / Framework
  import { location, push } from "svelte-spa-router";
  import Button, { Label } from "@smui/button";
  import Card, { Content } from "@smui/card";
  import Checkbox from "@smui/checkbox";
  import FormField from "@smui/form-field";
  import Textfield from "@smui/textfield";
  import HelperText from "@smui/textfield/helper-text";
  import Icon from "@smui/textfield/icon";
  import { form } from "svelte-forms";
  import { replace } from "svelte-spa-router";
  import { ClientError, handleAnyError } from "../../lib/error-handling.js";
  import { standardField } from "../../lib/validations.js";
  // Other imports
  import { BUCKET_CRYPTO_SPEC } from "../../constant/crypto-specs.js";
  import {
    callBucketCreateApi,
    callBucketListApi,
    callBucketSetAuthorizationApi,
  } from "../../integration/content-apis.js";
  import { minlength } from "../../lib/validators.js";
  import { bucketList } from "../../store/content.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
    showAlert,
  } from "../../store/ui.js";
  import { encryptText } from "../../utility/crypto-utils.js";
  import { testConstants } from "../../constant/test-constants.js";
  import { onMount } from "svelte";
  import { derived } from "svelte/store";
  import { MiscConstant } from "../../constant/misc-constants.js";
  import { callUserFindApi } from "../../integration/user-apis.js";
  import {
    callAdminAddUserApi,
    callAdminSetGlobalPermissionsApi,
  } from "../../integration/admin-apis.js";
  import {
    bucketPermissionDetails,
    defaultBucketPermissions,
    defaultGlobalPermissions,
    globalPermissionDetails,
  } from "../../lib/permissions-helper.js";
  import { getOrCollectPasswordForBucket } from "../../lib/password-provider.js";
  import IconButton from "@smui/icon-button";
  import { storedUser } from "../../store/user.js";
  import { toast } from "@zerodevx/svelte-toast";

  const ROUTE_PREFIX = "/bucket/edit/";

  let isLoaded: boolean = false;
  let bucketId = null;
  let bucket = null;
  let bucketPassword = null;
  let newTargetUserUserName = "";

  const resetData = () => {
    isLoaded = false;
    bucket = null;
    bucketId = null;
    bucketPassword = null;
    newTargetUserUserName = "";
  };

  const returnToPreviousPage = () => {
    resetData();
    push("/dashboard");
  };

  const getUser = async (userName: string) => {
    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let { userList } = await callUserFindApi({
        filters: [{ by: "userName", userId: null, userName }],
        includeGlobalPermissions: true,
      });
      if (userList.length !== 1) {
        throw new ClientError("USER_INVALID", "Expected exactly one user.");
      }
      decrementActiveGlobalObtrusiveTaskCount();
      return userList[0];
    } catch (ex) {
      await handleAnyError(ex);
      return false;
    }
  };

  const embedUserList = async () => {
    try {
      let userFilterList = bucket.bucketAuthorizations.map((authorization) => {
        return {
          by: "userId",
          userId: authorization.userId,
          userName: null,
        };
      });
      incrementActiveGlobalObtrusiveTaskCount();
      let { userList } = await callUserFindApi({
        filters: userFilterList,
        includeGlobalPermissions: false,
      });
      if (userList.length !== userFilterList.length) {
        throw new ClientError(
          "USER_LIST_INVALID",
          "One or more user data mismatch found."
        );
      }

      bucket.bucketAuthorizations.forEach((authorization) => {
        authorization.user = userList.find(
          (user) => user._id === authorization.userId
        );
        authorization.isExpanded = false;
      });

      decrementActiveGlobalObtrusiveTaskCount();
      return true;
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };

  const getBucketList = async () => {
    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callBucketListApi({});
      decrementActiveGlobalObtrusiveTaskCount();
      let { bucketList } = response;
      return bucketList;
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };

  const handleInvalidParameter = async () => {
    await showAlert(
      "Invalid parameters",
      "The link you are using is invalid. Redirecting you to the dashboard."
    );
    returnToPreviousPage();
    return;
  };

  const loadBucket = async (bucketId) => {
    let bucketList = await getBucketList();
    if (!bucketList) return;
    bucket = bucketList.find((bucket) => bucket._id == bucketId);
    console.log("Loaded bucket", bucket);
    if (!bucket) {
      handleInvalidParameter();
      return;
    }
    return true;
  };

  const loadCurrentBucketPassword = async () => {
    bucketPassword = await getOrCollectPasswordForBucket(bucket);
    if (!bucketPassword) {
      await showAlert(
        "Password required",
        "The correct encryption password is required to access this bucket."
      );
      returnToPreviousPage();
      return;
    }
    return true;
  };

  const loadPage = async (pathString) => {
    isLoaded = false;
    bucketId = pathString;
    {
      let wasSuccesful = await loadBucket(bucketId);
      if (!wasSuccesful) return;
    }
    {
      let wasSuccesful = loadCurrentBucketPassword();
      if (!wasSuccesful) return;
    }
    {
      let wasSuccesful = await embedUserList();
      if (!wasSuccesful) return;
    }
    isLoaded = true;
  };

  // Watch parameter changes
  location.subscribe((location) => {
    if (location && location.indexOf(ROUTE_PREFIX) > -1) {
      let pathString = (location as string).replace(ROUTE_PREFIX, "");
      loadPage(pathString);
    }
  });

  const authorizeNewTargetUser = async () => {
    newTargetUserUserName = newTargetUserUserName.trim();
    let existing = bucket.bucketAuthorizations.find(
      (authorization) => authorization.user.userName === newTargetUserUserName
    );
    if (existing) {
      await showAlert(
        "Already authorized",
        "The selected user is already authorized to this bucket"
      );
      return;
    }
    let user = await getUser(newTargetUserUserName);
    if (!user) return;

    bucket.bucketAuthorizations = [
      ...bucket.bucketAuthorizations,
      {
        userId: user._id,
        user: user,
        notes: `Pending authorizion. Added by ${$storedUser.userName}`,
        permissions: JSON.parse(JSON.stringify(defaultBucketPermissions)),
        isExpanded: true,
      },
    ];
  };

  const saveClicked = async () => {
    try {
      incrementActiveGlobalObtrusiveTaskCount();

      for (let authorization of bucket.bucketAuthorizations) {
        let res = await callBucketSetAuthorizationApi({
          bucketId,
          permissionsToSet: authorization.permissions,
          targetUserId: authorization.user._id,
        });
        console.log(res);
      }

      toast.push("Your changes have been saved.");

      let pathString = ($location as string).replace(ROUTE_PREFIX, "");
      loadPage(pathString);

      decrementActiveGlobalObtrusiveTaskCount();
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };
</script>

<div class="nk-page user-save">
  <div class="nk-page--inner-wrapper--standard">
    {#if bucket && isLoaded}
      <div class="section">
        <div class="title">{bucket.name}</div>

        <div class="item">
          <div class="label">Id</div>
          <div class="value">
            {bucket._id}
          </div>
        </div>

        <div class="item">
          <div class="label">Spec</div>
          <div class="value">
            {bucket.cryptSpec}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="title">MetaData</div>
        {#each Object.keys(bucket.metaData) as key}
          <div class="item">
            <div class="label">
              {key}
            </div>
            <div class="value">
              {bucket.metaData[key]}
            </div>
          </div>
        {/each}
      </div>

      <Card>
        <Content class="content">
          {#each bucket.bucketAuthorizations as authorization}
            <div class="authorization-block">
              <div class="authorization--title">
                <div>
                  <div class="authorization--display-name">
                    {authorization.user.displayName}
                  </div>
                  <div class="authorization--user-name">
                    @{authorization.user.userName}
                  </div>
                </div>
                <div style="flex: 1" />
                <IconButton
                  on:click={() =>
                    (authorization.isExpanded = !authorization.isExpanded)}
                >
                  {#if authorization.isExpanded}
                    <Icon class="material-icons">expand_less</Icon>
                  {:else}
                    <Icon class="material-icons">expand_more</Icon>
                  {/if}
                </IconButton>
              </div>
              {#if authorization.isExpanded}
                <div>
                  <div class="notes">{authorization.notes}</div>
                  {#each Object.keys(authorization.permissions) as key}
                    <FormField>
                      <Checkbox bind:checked={authorization.permissions[key]} />
                      <span slot="label">{bucketPermissionDetails[key]}</span>
                    </FormField>
                    <br />
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </Content>
      </Card>

      <div class="nk--button-row">
        <Button on:click={saveClicked} variant="raised" class="hero-button">
          <Icon class="material-icons">save</Icon>
          <Label>Save Changes</Label>
        </Button>
      </div>

      <Card style="margin-top:12px;">
        <Content class="content">
          <div style="font-weight: 500; color: grey;">
            Authorize another user
          </div>
          <div style="display: flex;">
            <Textfield
              bind:value={newTargetUserUserName}
              label="UserName of new user"
              type="text"
              style="flex: 1"
            >
              <Icon class="material-icons" slot="leadingIcon">person_add</Icon>
            </Textfield>
            <IconButton
              on:click={authorizeNewTargetUser}
              disabled={newTargetUserUserName.length === 0}
            >
              <Icon class="material-icons">send</Icon>
            </IconButton>
          </div>
        </Content>
      </Card>
    {/if}
  </div>
</div>

<style>
  * :global(.textfield) {
    width: 100%;
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

  .authorization--title {
    display: flex;
    align-items: baseline;
  }

  .authorization--display-name {
    font-size: 14px;
  }

  .authorization--user-name {
    font-size: 12px;
    color: grey;
  }

  .notes {
    font-size: 12px;
    color: grey;
    font-style: italic;
  }
</style>
