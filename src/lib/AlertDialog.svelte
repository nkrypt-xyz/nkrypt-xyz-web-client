<script lang="ts">
  import Dialog, { Title, Content, Actions } from "@smui/dialog";
  import Button, { Label } from "@smui/button";
  import CircularProgress from "@smui/circular-progress";

  import { alertDialog, alertDialogResponse } from "../store/ui.js";

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
