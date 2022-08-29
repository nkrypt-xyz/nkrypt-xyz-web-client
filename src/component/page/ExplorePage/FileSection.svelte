<script lang="ts">
  // UI / Framework
  import { Icon } from "@smui/button";
  // Other imports

  export let childFileList = [];
  export let childFileClicked = null;
</script>

<div class="file-section-header">Files</div>

<div class="file-section-container">
  {#if childFileList.length === 0}
    <div class="no-file">No files found.</div>
  {/if}
  {#each childFileList as childFile, i}
    <div class="file" on:click={() => childFileClicked(childFile)}>
      <Icon class="material-icons">file_present</Icon>
      <div class="title">
        {childFile.name}
      </div>
    </div>
  {/each}
</div>

<style>
  .file-section-header {
    background-color: rgb(206, 206, 206);
    font-size: 12px;
    padding: 4px;
    padding-right: 4px;
    text-align: left;
    color: rgb(126, 125, 125);
  }

  .file-section-container {
    margin: 4px;
  }

  .no-file {
    text-align: center;
    color: rgb(126, 125, 125);
    font-size: 12px;
    margin: 8px;
  }

  .file {
    display: flex;
    align-items: center;
    margin: 8px;
  }

  .file :global(.material-icons) {
    font-size: 24px;
    margin-right: 8px;
  }

  .file .title {
    margin-top: 2px;
    cursor: pointer;
  }
</style>
