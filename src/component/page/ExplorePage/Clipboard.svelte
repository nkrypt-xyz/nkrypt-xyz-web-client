<script lang="ts">
  import IconButton from "@smui/icon-button";
  import { ClipboardAction } from "./clipboard-helper.js";

  export let clipboard = null;
  export let performClipboardActionFn = null;

  const getEntityFlowFromClipboard = (clipboard) => {
    let path = [
      ...clipboard.entityStack.map((entity) => entity.directory.name),
      clipboard.childEntity.name,
    ].join(" / ");
    return path;
  };
</script>

{#if clipboard}
  <div class="clipboard-header">
    {clipboard.action === ClipboardAction.CUT ? "Moving file" : "Copying file"}
  </div>
  <div class="clipboard-body">
    <div class="clipboard-message">
      {clipboard.action === ClipboardAction.CUT ? "Move" : "Copy"}
      <span class="clipboard-path">{getEntityFlowFromClipboard(clipboard)}</span
      > here?
    </div>
    <div class="clipboard-actions">
      <IconButton
        size="mini"
        class="material-icons clipboard-button"
        on:click={() => performClipboardActionFn(false)}
        >cancel
      </IconButton>
      <IconButton
        size="mini"
        class="material-icons clipboard-button"
        on:click={() => performClipboardActionFn(true)}
        >content_paste
      </IconButton>
    </div>
  </div>
{/if}

<style>
  .clipboard-header {
    background-color: rgb(206, 206, 206);
    font-size: 12px;
    padding: 4px;
    padding-right: 4px;
    text-align: left;
    color: rgb(126, 125, 125);
  }

  .clipboard-body {
    font-size: 12px;
    margin: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .clipboard-message {
    flex: 1;
  }

  * :global(.clipboard-button) {
    margin-bottom: 0px !important;
  }

  .clipboard-path {
    background: #f0ffff;
    padding: 0px 4px;
  }
</style>
