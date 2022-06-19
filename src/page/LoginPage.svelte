<script lang="ts">
  // UI
  import Button, { Label, Icon as ButtonIcon } from "@smui/button";
  import Card, { Content } from "@smui/card";
  import Footer from "../lib/Footer.svelte";
  import Textfield from "@smui/textfield";
  import Icon from "@smui/textfield/icon";
  import HelperText from "@smui/textfield/helper-text";
  // Extern
  import { form, field } from "svelte-forms";
  import { required, min } from "svelte-forms/validators";
  import { replace } from "svelte-spa-router";
  // Intern
  import { standardField } from "../lib/validations.js";
  import { CommonConstant } from "../constant/common-constants.js";
  import { suggestedServerUrl } from "../store/cache.js";
  import { callUserLoginApi } from "../integration/user-apis.js";
  import { minlength } from "../lib/validators.js";
  import { extract } from "../utility/misc-utils.js";
  import { currentUser } from "../store/user.js";
  import { currentSession } from "../store/session.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
  } from "../store/ui.js";
  import { handleErrorIfAny } from "../lib/error-handling.js";

  const loginClicked = async () => {
    let payload = extract($finalForm.summary, ["userName", "password"]);
    incrementActiveGlobalObtrusiveTaskCount();
    let response = await callUserLoginApi($server.value, payload);
    if (await handleErrorIfAny(response)) return;
    decrementActiveGlobalObtrusiveTaskCount();

    let { apiKey } = response;
    let { userName, displayName, _id: userId } = response.user;

    currentUser.set({ userName, displayName, userId });
    currentSession.set({ apiKey, serverUrl: $server.value });

    suggestedServerUrl.set($server.value);

    replace("/dashboard");
  };

  const server = standardField("server", $suggestedServerUrl, [minlength(4)]);
  const userName = standardField("userName", "admin", [minlength(4)]);
  const password = standardField(
    "password",
    "PleaseChangeMe@YourEarliest2Day",
    [minlength(8)]
  );
  const finalForm = form(server, userName, password);
</script>

<div class="login-page">
  <Card>
    <Content class="content">
      <h3>Welcome to nkrypt.xyz</h3>
      <Textfield bind:value={$server.value} label="Server Address" type="text">
        <Icon class="material-icons" slot="leadingIcon">dns</Icon>
        <!-- <HelperText slot="helper">Helper Text</HelperText> -->
      </Textfield>

      <br />

      <Textfield bind:value={$userName.value} label="User Name" type="text">
        <Icon class="material-icons" slot="leadingIcon">person</Icon>
        <!-- <HelperText slot="helper">Helper Text</HelperText> -->
      </Textfield>

      <br />

      <Textfield
        bind:value={$password.value}
        label="Account Password"
        type="password"
        required
      >
        <Icon class="material-icons" slot="leadingIcon">password</Icon>
        <!-- <HelperText slot="helper">Helper Text</HelperText> -->
      </Textfield>

      <br />

      <div style="text-align: center;">
        <Button
          disabled={!($finalForm.dirty && $finalForm.valid)}
          on:click={loginClicked}
          variant="raised"
          class="hero-button"
        >
          <Icon class="material-icons">login</Icon>
          <Label>Login</Label>
        </Button>
      </div>
    </Content>
  </Card>
</div>
<Footer />

<style>
  .login-page {
    height: calc(100vh - 80px);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .login-page :global(.hero-button) {
    margin-top: 20px;
  }
</style>
