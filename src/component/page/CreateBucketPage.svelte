<script lang="ts">
  // UI / Framework
  import Button, { Label } from "@smui/button";
  import Card, { Content } from "@smui/card";
  import Textfield from "@smui/textfield";
  import HelperText from "@smui/textfield/helper-text";
  import Icon from "@smui/textfield/icon";
  import { form } from "svelte-forms";
  import { replace } from "svelte-spa-router";
  import { handleAnyError } from "../../lib/error-handling.js";
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

  const NEW_BUCKET_ID = "new";

  const name = standardField("name", "", [minlength(4)]);
  const encryptionPassword = standardField(
    "encryptionPassword",
    "PleaseChangeMe@YourEarliest2Day",
    [minlength(8)]
  );
  const finalForm = form(name, encryptionPassword);

  const saveClicked = async () => {
    try {
      let bucketPassword = $encryptionPassword.value;

      incrementActiveGlobalObtrusiveTaskCount();

      let cryptDataObject = await encryptText(
        BUCKET_CRYPTO_SPEC,
        bucketPassword
      );

      let cryptData = JSON.stringify(cryptDataObject);

      let response = await callBucketCreateApi({
        name: $name.value,
        cryptSpec: BUCKET_CRYPTO_SPEC,
        cryptData,
        metaData: {
          createFrom: "nkrypt.xyz app",
        },
      });

      let response2 = await callBucketListApi({});

      bucketList.set(response2.bucketList);

      replace("/dashboard");
      decrementActiveGlobalObtrusiveTaskCount();
    } catch (ex) {
      return await handleAnyError(ex);
    }
  };
</script>

<div class="create-bucket-page nk-page">
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
