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
  } from "../../integration/content-apis.js";
  import { minlength } from "../../lib/validators.js";
  import { bucketList } from "../../store/content.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
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
    defaultGlobalPermissions,
    globalPermissionDetails,
  } from "../../lib/permissions-helper.js";

  const MODES = {
    CREATE: "CREATE",
    UPDATE: "UPDATE",
  };

  let mode = null;
  let userId = null;
  let globalPermissions = null;

  const ROUTE_PREFIX = "/user/save/";

  const displayName = standardField("displayName", "", [minlength(4)]);
  const userName = standardField("userName", "", [minlength(4)]);
  const password = standardField("password", "", [minlength(8)]);

  const finalForm = form(displayName, userName, password);

  const assingUser = (user) => {
    displayName.set(user.displayName);
    userName.set(user.userName);
    password.set(user.password || "");

    if (!("globalPermissions" in user)) {
      user.globalPermissions = JSON.parse(
        JSON.stringify(defaultGlobalPermissions)
      );
    }

    globalPermissions = user.globalPermissions;
  };

  const getUser = async (userId: string) => {
    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let { userList } = await callUserFindApi({
        filters: [{ by: "userId", userId, userName: null }],
        includeGlobalPermissions: true,
      });
      if (userList.length !== 1) {
        throw new ClientError("USER_INVALID", "Expected exactly one user.");
      }
      decrementActiveGlobalObtrusiveTaskCount();
      return userList[0];
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };

  const loadUser = async () => {
    if (mode === MODES.UPDATE) {
      let user = await getUser(userId);
      if (!user) return;
      assingUser(user);
    } else {
      assingUser({
        displayName: "",
        userName: "",
        password: "",
      });
    }
  };

  const loadPage = async (pathString) => {
    if (pathString === MiscConstant.NEW_ID_PLACEHOLDER) {
      mode = MODES.CREATE;
      userId = null;
    } else {
      mode = MODES.UPDATE;
      userId = pathString;
    }
    await loadUser();
  };

  // Watch parameter changes
  location.subscribe((location) => {
    if (location && location.indexOf(ROUTE_PREFIX) > -1) {
      let pathString = (location as string).replace(ROUTE_PREFIX, "");
      loadPage(pathString);
    }
  });

  const saveClicked = async () => {
    try {
      let data = $finalForm.summary;
      incrementActiveGlobalObtrusiveTaskCount();
      if (mode === MODES.CREATE) {
        ({ userId } = await callAdminAddUserApi(<any>data));
      } else {
        ("pass");
      }
      await callAdminSetGlobalPermissionsApi({
        userId,
        globalPermissions,
      });
      push("/users");
      decrementActiveGlobalObtrusiveTaskCount();
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };

  const titleText = (mode) =>
    mode == MODES.CREATE ? "Adding user" : "Updating user";
  const updateButtonText = (mode) =>
    mode == MODES.CREATE ? "Add user" : "Update user";
</script>

<div class="nk-page user-save">
  <div class="nk-page--inner-wrapper--standard">
    <h3>{titleText(mode)}</h3>

    <Card>
      <Content class="content">
        <Textfield
          class="textfield"
          bind:value={$userName.value}
          label="UserName (Must be unique)"
          type="text"
          required
          disabled={mode == MODES.UPDATE}
        >
          <Icon class="material-icons" slot="leadingIcon">account_circle</Icon>
        </Textfield>

        <br />

        <Textfield
          class="textfield"
          bind:value={$displayName.value}
          label="Display Name"
          type="text"
          required
          disabled={mode == MODES.UPDATE}
        >
          <Icon class="material-icons" slot="leadingIcon">account_circle</Icon>
        </Textfield>

        <br />

        {#if mode == MODES.CREATE}
          <Textfield
            class="textfield"
            bind:value={$password.value}
            label="Login password"
            type="password"
            required
          >
            <Icon class="material-icons" slot="leadingIcon">key</Icon>
            <HelperText persistent slot="helper">
              User will log in using this password. This is separate from bucket
              passwords.
            </HelperText>
          </Textfield>
        {/if}

        <br />

        {#if globalPermissions}
          <div>
            Permissions
            <div>
              {#each Object.keys(globalPermissions) as key}
                <FormField>
                  <Checkbox bind:checked={globalPermissions[key]} />
                  <span slot="label">{globalPermissionDetails[key]}</span>
                </FormField>
                <br />
              {/each}
            </div>
          </div>
        {/if}
      </Content>
    </Card>

    <div class="nk--button-row">
      <Button
        disabled={!(
          (mode === MODES.CREATE && $finalForm.dirty && $finalForm.valid) ||
          mode === MODES.UPDATE
        )}
        on:click={saveClicked}
        variant="raised"
        class="hero-button"
      >
        <Icon class="material-icons">save</Icon>
        <Label>{updateButtonText(mode)}</Label>
      </Button>
    </div>
  </div>
</div>

<style>
  * :global(.textfield) {
    width: 100%;
  }
</style>
