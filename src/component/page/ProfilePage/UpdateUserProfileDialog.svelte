<script lang="ts">
  import Button, { Label } from "@smui/button";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import Textfield from "@smui/textfield";
  import Icon from "@smui/textfield/icon";
  import { form } from "svelte-forms";
  import { callUserUpdateProfileApi } from "../../../integration/user-apis.js";
  import { handleAnyError } from "../../../lib/error-handling.js";
  import { standardField } from "../../../lib/validations.js";
  import { minlength } from "../../../lib/validators.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
    updateUserProfileDialog,
    updateUserProfileDialogResponse,
  } from "../../../store/ui.js";
  import { storedUser } from "../../../store/user.js";

  const displayName = standardField("displayName", "", [minlength(4)]);
  const finalForm = form(displayName);

  let _updateUserProfileDialog = null;
  updateUserProfileDialog.subscribe((value) => {
    _updateUserProfileDialog = value;

    finalForm.clear();
    displayName.set($storedUser.displayName);
  });

  const setAnswer = (answer) => {
    updateUserProfileDialog.set(null);
    updateUserProfileDialogResponse.set(answer);
  };

  const changeProfile = async () => {
    await finalForm.validate();
    if (!$finalForm.valid) return;

    let data = {
      displayName: $displayName.value,
    };

    updateUserProfileDialog.set(false);
    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callUserUpdateProfileApi(data);
      decrementActiveGlobalObtrusiveTaskCount();
      setAnswer(true);
      storedUser.update((user) => {
        user.displayName = data.displayName;
        return user;
      });
    } catch (ex) {
      await handleAnyError(ex);
      updateUserProfileDialog.set(true);
    }
  };
</script>

{#if _updateUserProfileDialog}
  <Dialog
    class="nk-update-user-Profile-dialog"
    bind:open={_updateUserProfileDialog}
    scrimClickAction=""
    escapeKeyAction=""
    aria-labelledby="mandatory-title"
    aria-describedby="mandatory-content"
  >
    <Title id="mandatory-title">Your are changing your login Profile.</Title>
    <Content id="mandatory-content">
      <Textfield
        bind:value={$displayName.value}
        label="Your Username"
        type="text"
        required
        invalid={$displayName.invalid}
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
          changeProfile();
        }}
      >
        <Label>Okay</Label>
      </Button>
    </Actions>
  </Dialog>
{/if}
