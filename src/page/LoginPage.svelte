<script lang="ts">
  import Button, { Label, Icon as ButtonIcon } from "@smui/button";
  import { CommonConstant } from "../constant/common-constants.js";
  import Card, { Content } from "@smui/card";
  import Footer from "../lib/Footer.svelte";
  import Textfield from "@smui/textfield";
  import Icon from "@smui/textfield/icon";
  import HelperText from "@smui/textfield/helper-text";
  import { defaultServerToShow } from "../store/cache.js";
  import { form, field } from "svelte-forms";
  import { required, min } from "svelte-forms/validators";
  import { callUserLoginApi } from "../integration/user-apis.js";
  import { minlength } from "../lib/validators.js";
  import { standardField } from "../lib/validations.js";
  import { extract } from "../utility/misc-utils.js";

  const loginClicked = async () => {
    let payload = extract($finalForm.summary, ["userName", "password"]);
    let response = await callUserLoginApi($server.value, payload);
  };

  const server = standardField("server", $defaultServerToShow, [minlength(4)]);
  const userName = standardField("userName", "", [minlength(4)]);
  const password = standardField("password", "", [minlength(8)]);
  const finalForm = form(server, userName, password);
</script>

<div class="login-page">
  <Card>
    <Content class="content">
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
