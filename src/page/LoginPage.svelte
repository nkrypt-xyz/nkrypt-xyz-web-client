<script lang="ts">
  import Button, { Label, Icon as ButtonIcon } from "@smui/button";
  import { CommonConstant } from "../constant/common-constants.js";
  import Card, { Content } from "@smui/card";
  import Footer from "../lib/Footer.svelte";
  import Textfield from "@smui/textfield";
  import Icon from "@smui/textfield/icon";
  import HelperText from "@smui/textfield/helper-text";
  import { defaultServerToShow } from "../store/cache.js";

  const loginClicked = () => {
    console.log("Hi");
  };

  let form = {
    server: $defaultServerToShow,
    userName: "",
    password: "",
  };
</script>

<div class="login-page">
  <Card>
    <Content class="content">
      <Textfield bind:value={form.server} label="Server Address">
        <Icon class="material-icons" slot="leadingIcon">dns</Icon>
        <!-- <HelperText slot="helper">Helper Text</HelperText> -->
      </Textfield>

      <br />

      <Textfield bind:value={form.userName} label="User Name">
        <Icon class="material-icons" slot="leadingIcon">person</Icon>
        <!-- <HelperText slot="helper">Helper Text</HelperText> -->
      </Textfield>

      <br />

      <Textfield
        bind:value={form.password}
        label="Account Password"
        type="password"
        required
      >
        <Icon class="material-icons" slot="leadingIcon">password</Icon>
        <!-- <HelperText slot="helper">Helper Text</HelperText> -->
      </Textfield>

      <br />

      <div style="text-align: center;">
        <Button on:click={loginClicked} variant="raised" class="hero-button">
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
