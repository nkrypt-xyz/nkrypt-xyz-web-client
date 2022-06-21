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

  import Dialog, { Title, Content, Actions } from "@smui/dialog";
  import Button, { Label } from "@smui/button";
  import CircularProgress from "@smui/circular-progress";

  import { promptDialog, promptDialogResponse } from "../store/ui.js";

  const inputText = standardField("inputText", "", [minlength(8)]);
  const finalForm = form(inputText);

  let _promptDialog = null;
  promptDialog.subscribe((value) => {
    _promptDialog = value;
  });

  const setAnswer = (answer) => {
    promptDialog.set(null);
    promptDialogResponse.set(answer);
  };
</script>

{#if _promptDialog}
  <Dialog
    bind:open={_promptDialog}
    scrimClickAction=""
    escapeKeyAction=""
    aria-labelledby="mandatory-title"
    aria-describedby="mandatory-content"
  >
    <Title id="mandatory-title">
      {_promptDialog.title}
    </Title>
    <Content id="mandatory-content">
      <Textfield
        bind:value={$inputText.value}
        label={_promptDialog.message}
        required
      />
    </Content>
    <Actions>
      <Button on:click={() => setAnswer(false)}>
        <Label>Cancel</Label>
      </Button>
      <Button on:click={() => setAnswer($inputText.value)}>
        <Label>Okay</Label>
      </Button>
    </Actions>
  </Dialog>
{/if}
