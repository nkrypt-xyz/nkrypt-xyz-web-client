<script lang="ts">
  // UI / Framework
  import Button, { Label } from "@smui/button";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import Textfield from "@smui/textfield";
  import HelperText from "@smui/textfield/helper-text";
  import Icon from "@smui/textfield/icon";
  import { form } from "svelte-forms";
  import { standardField } from "../../lib/validations.js";
  import { minlength } from "../../lib/validators.js";
  // Other imports
  import {
    bucketPasswordDialog,
    bucketPasswordDialogResponse,
  } from "../../store/ui.js";

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
    class="nk-bucket-password-dialog"
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
