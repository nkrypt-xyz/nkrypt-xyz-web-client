<script lang="ts">
  import Button, { Label } from "@smui/button";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import { alertDialog, alertDialogResponse } from "../../store/ui.js";

  let _alertDialog = null;
  alertDialog.subscribe((value) => {
    _alertDialog = value;
  });

  const setAnswer = (answer) => {
    alertDialog.set(null);
    alertDialogResponse.set(answer);
  };
</script>

{#if _alertDialog}
  <Dialog
    class="nk-alert-dialog"
    bind:open={_alertDialog}
    scrimClickAction=""
    escapeKeyAction=""
    aria-labelledby="mandatory-title"
    aria-describedby="mandatory-content"
  >
    <Title id="mandatory-title">{_alertDialog.title}</Title>
    <Content id="mandatory-content">{_alertDialog.message}</Content>
    <Actions>
      <Button on:click={() => setAnswer(true)}>
        <Label>Okay</Label>
      </Button>
    </Actions>
  </Dialog>
{/if}
