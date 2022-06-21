<script lang="ts">
  // UI
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
  import { storedUser } from "../store/user.js";
  import { storedSession } from "../store/session.js";
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

  import Dialog, { Title, Content, Actions } from "@smui/dialog";
  import Button, { Label } from "@smui/button";
  import CircularProgress from "@smui/circular-progress";

  import {
    bucketPasswordDialog,
    bucketPasswordDialogResponse,
  } from "../store/ui.js";

  const encryptionPassword = standardField(
    "encryptionPassword",
    "PleaseChangeMe@YourEarliest2Day",
    [minlength(8)]
  );
  const finalForm = form(encryptionPassword);

  let _bucketPasswordDialog = null;
  bucketPasswordDialog.subscribe((value) => {
    _bucketPasswordDialog = value;
  });

  const setAnswer = (answer) => {
    bucketPasswordDialog.set(null);
    bucketPasswordDialogResponse.set(answer);
  };
</script>

{#if _bucketPasswordDialog}
  <Dialog
    bind:open={_bucketPasswordDialog}
    scrimClickAction=""
    escapeKeyAction=""
    aria-labelledby="mandatory-title"
    aria-describedby="mandatory-content"
  >
    <Title id="mandatory-title">
      Password for bucket: {_bucketPasswordDialog.bucketName}
    </Title>
    <Content id="mandatory-content">
      <Textfield
        bind:value={$encryptionPassword.value}
        label="Encryption password"
        type="password"
        required
      >
        <Icon class="material-icons" slot="leadingIcon">key</Icon>
        <HelperText slot="helper"
          >This is separate from your login password and is specific to this
          bucket
        </HelperText>
      </Textfield>
    </Content>
    <Actions>
      <Button on:click={() => setAnswer(false)}>
        <Label>Cancel</Label>
      </Button>
      <Button on:click={() => setAnswer($encryptionPassword.value)}>
        <Label>Okay</Label>
      </Button>
    </Actions>
  </Dialog>
{/if}
