<script lang="ts">
  // UI / Framework
  import Button, { Label } from "@smui/button";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  // Other imports
  import {
    confirmationThreeStateDialog,
    confirmationThreeStateDialogResponse,
    ThreeStateConfirmationState,
  } from "../../store/ui.js";

  let _confirmationThreeStateDialog = null;
  confirmationThreeStateDialog.subscribe((value) => {
    _confirmationThreeStateDialog = value;
  });

  const setAnswer = (answer) => {
    confirmationThreeStateDialog.set(null);
    confirmationThreeStateDialogResponse.set(answer);
  };
</script>

{#if _confirmationThreeStateDialog}
  <Dialog
    class="nk-confirmation-dialog"
    bind:open={_confirmationThreeStateDialog}
    scrimClickAction=""
    escapeKeyAction=""
    aria-labelledby="mandatory-title"
    aria-describedby="mandatory-content"
  >
    <Title id="mandatory-title">{_confirmationThreeStateDialog.title}</Title>
    <Content id="mandatory-content"
      >{_confirmationThreeStateDialog.message}</Content
    >
    <Actions>
      <Button on:click={() => setAnswer(ThreeStateConfirmationState.YES)}>
        <Label>Yes</Label>
      </Button>
      <Button on:click={() => setAnswer(ThreeStateConfirmationState.NO)}>
        <Label>No</Label>
      </Button>
      <Button on:click={() => setAnswer(ThreeStateConfirmationState.CANCEL)}>
        <Label>Cancel</Label>
      </Button>
    </Actions>
  </Dialog>
{/if}
