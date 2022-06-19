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
  import { callUserLoginApi } from "../integration/user-apis.js";
  import { minlength } from "../lib/validators.js";
  import { extract } from "../utility/misc-utils.js";
  import { currentUser } from "../store/user.js";
  import { currentSession } from "../store/session.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
  } from "../store/ui.js";
  import {
    callBucketCreateApi,
    callBucketListApi,
  } from "../integration/content-apis.js";
  import { encryptText } from "../utility/crypto-utils.js";
  import { BUCKET_CRYPTO_SPEC } from "../lib/crypto.js";
  import { bucketList } from "../store/content.js";
  import { handleErrorIfAny } from "../lib/error-handling.js";

  const NEW_BUCKET_ID = "new";

  const name = standardField("name", "", [minlength(4)]);
  const encryptionPassword = standardField(
    "encryptionPassword",
    "PleaseChangeMe@YourEarliest2Day",
    [minlength(8)]
  );
  const finalForm = form(name, encryptionPassword);

  const saveClicked = async () => {
    let bucketPassword = $encryptionPassword.value;

    incrementActiveGlobalObtrusiveTaskCount();

    let cryptDataObject = await encryptText(BUCKET_CRYPTO_SPEC, bucketPassword);

    let cryptData = JSON.stringify(cryptDataObject);

    let response = await callBucketCreateApi({
      name: $name.value,
      cryptSpec: BUCKET_CRYPTO_SPEC,
      cryptData,
      metaData: {
        createFrom: "nkrypt.xyz app",
      },
    });
    if (await handleErrorIfAny(response)) return;

    let response2 = await callBucketListApi({});
    if (await handleErrorIfAny(response)) return;

    bucketList.set(response2.bucketList);

    replace("/dashboard");
    decrementActiveGlobalObtrusiveTaskCount();
  };
</script>

<div class="create-bucket-page">
  <h3>Create New Bucket</h3>

  <Card>
    <Content class="content">
      <Textfield
        bind:value={$name.value}
        label="Name of the bucket"
        type="text"
      >
        <Icon class="material-icons" slot="leadingIcon">takeout_dining</Icon>
      </Textfield>

      <br />

      <Textfield
        bind:value={$encryptionPassword.value}
        label="Encryption password"
        type="password"
        required
      >
        <Icon class="material-icons" slot="leadingIcon">key</Icon>
        <HelperText slot="helper"
          >This is separate from your login password. This is also, completely
          non-recoverable. If you forget the encryption password, you will loose
          access to the bucket.</HelperText
        >
      </Textfield>

      <br />

      <Button
        disabled={!($finalForm.dirty && $finalForm.valid)}
        on:click={saveClicked}
        variant="raised"
        class="hero-button"
      >
        <Icon class="material-icons">save</Icon>
        <Label>Create Bucket</Label>
      </Button>
    </Content>
  </Card>
</div>

<style>
  .create-bucket-page {
    width: calc(100% - 16px);
    max-width: 800px;
    margin-right: auto;
    margin-left: auto;
  }

  .create-bucket-page :global(.hero-button) {
    margin-top: 20px;
  }

  .create-bucket-page :global(.content) {
    text-align: center;
  }
</style>
