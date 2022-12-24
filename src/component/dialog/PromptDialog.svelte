<script lang="ts">
  // UI / Framework
  import Textfield from "@smui/textfield";
  import { form } from "svelte-forms";
  import { standardField } from "../../lib/validations.js";
  import { minlength } from "../../lib/validators.js";
  import Button, { Label } from "@smui/button";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  // Other imports
  import { promptDialog, promptDialogResponse } from "../../store/ui.js";

  const inputText = standardField("inputText", "", [minlength(8)]);
  const finalForm = form(inputText);

  let _promptDialog = null;
  promptDialog.subscribe((value) => {
    _promptDialog = value;

    if (_promptDialog && _promptDialog.defaultValue !== null) {
      inputText.set(_promptDialog.defaultValue);
    }
  });

  const setAnswer = (answer) => {
    promptDialog.set(null);
    promptDialogResponse.set(answer);
  };

  const getType = (_promptDialog) => {
    return _promptDialog.masked ? "password" : "text";
  };
</script>

{#if _promptDialog}
  <Dialog
    class="nk-prompt-dialog"
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
        type={getType(_promptDialog)}
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
