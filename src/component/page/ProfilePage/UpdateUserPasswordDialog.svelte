<script lang="ts">
  import Button, { Label } from "@smui/button";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import Textfield from "@smui/textfield";
  import Icon from "@smui/textfield/icon";
  import { form } from "svelte-forms";
  import { callUserUpdatePasswordApi } from "../../../integration/user-apis.js";
  import { handleAnyError } from "../../../lib/error-handling.js";
  import { performUserLogout } from "../../../lib/session.js";
  import { standardField } from "../../../lib/validations.js";
  import { minlength } from "../../../lib/validators.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
    showAlert,
    updateUserPasswordDialog,
    updateUserPasswordDialogResponse
  } from "../../../store/ui.js";

  const existingPassword = standardField("existingPassword", "", [
    minlength(8),
  ]);
  const newPassword = standardField("newPassword", "", [minlength(8)]);
  const finalForm = form(existingPassword, newPassword);

  let _updateUserPasswordDialog = null;
  updateUserPasswordDialog.subscribe((value) => {
    _updateUserPasswordDialog = value;

    finalForm.clear();
  });

  const setAnswer = (answer) => {
    updateUserPasswordDialog.set(null);
    updateUserPasswordDialogResponse.set(answer);
  };

  const changePassword = async () => {
    await finalForm.validate();
    if (!$finalForm.valid) return;

    let data = {
      currentPassword: $existingPassword.value,
      newPassword: $newPassword.value,
    };

    updateUserPasswordDialog.set(false);
    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callUserUpdatePasswordApi(data);
      decrementActiveGlobalObtrusiveTaskCount();
      setAnswer(true);
      await showAlert(
        "Password updated",
        "Your login password has been updated. Please sign in again."
      );
      await performUserLogout({ navigateToDashboard: true });
    } catch (ex) {
      await handleAnyError(ex);
      updateUserPasswordDialog.set(true);
    }
  };
</script>

{#if _updateUserPasswordDialog}
  <Dialog
    class="nk-update-user-password-dialog"
    bind:open={_updateUserPasswordDialog}
    scrimClickAction=""
    escapeKeyAction=""
    aria-labelledby="mandatory-title"
    aria-describedby="mandatory-content"
  >
    <Title id="mandatory-title">Your are changing your login password.</Title>
    <Content id="mandatory-content">
      <Textfield
        bind:value={$existingPassword.value}
        label="Existing login password"
        type="password"
        required
        invalid={$existingPassword.invalid}
      >
        <Icon class="material-icons" slot="leadingIcon">key</Icon>
      </Textfield>
      <br />
      <Textfield
        bind:value={$newPassword.value}
        label="New login password"
        type="password"
        required
        invalid={$newPassword.invalid}
      >
        <Icon class="material-icons" slot="leadingIcon">key</Icon>
      </Textfield>
    </Content>
    <Actions>
      <Button on:click={() => setAnswer(false)}>
        <Label>Cancel</Label>
      </Button>
      <Button
        on:click={(e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          e.stopPropagation();
          changePassword();
        }}
      >
        <Label>Okay</Label>
      </Button>
    </Actions>
  </Dialog>
{/if}
