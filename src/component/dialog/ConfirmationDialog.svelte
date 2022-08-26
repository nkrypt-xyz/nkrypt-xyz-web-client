<script lang="ts">
  import Dialog, { Title, Content, Actions } from "@smui/dialog";
  import Button, { Label } from "@smui/button";
  import CircularProgress from "@smui/circular-progress";

  import {
    confirmationDialog,
    confirmationDialogResponse,
  } from "../../store/ui.js";

  let _confirmationDialog = null;
  confirmationDialog.subscribe((value) => {
    _confirmationDialog = value;
  });

  const setAnswer = (answer) => {
    confirmationDialog.set(null);
    confirmationDialogResponse.set(answer);
  };
</script>

{#if _confirmationDialog}
  <Dialog
  class="nk-confirmation-dialog"
    bind:open={_confirmationDialog}
    scrimClickAction=""
    escapeKeyAction=""
    aria-labelledby="mandatory-title"
    aria-describedby="mandatory-content"
  >
    <Title id="mandatory-title">{_confirmationDialog.title}</Title>
    <Content id="mandatory-content">{_confirmationDialog.message}</Content>
    <Actions>
      <Button on:click={() => setAnswer(false)}>
        <Label>No</Label>
      </Button>
      <Button on:click={() => setAnswer(true)}>
        <Label>Yes</Label>
      </Button>
    </Actions>
  </Dialog>
{/if}
