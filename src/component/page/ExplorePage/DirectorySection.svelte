<script lang="ts">
  import Button, { Label, Icon } from "@smui/button";

  export let childDirectoryList = [];
  export let childDirectoryClicked = null;
</script>

<div class="directory-section-header">Directories</div>

<div class="directory-section-container">
  {#if childDirectoryList.length === 0}
    <div class="no-directory">No subdirectories found.</div>
  {/if}
  {#each childDirectoryList as childDirectory, i}
    <div
      class="directory"
      on:click={() => childDirectoryClicked(childDirectory)}
    >
      <Icon class="material-icons">folder</Icon>
      <div class="title">
        {childDirectory.name}
      </div>
    </div>
  {/each}
</div>

<style>
  .directory-section-header {
    background-color: rgb(206, 206, 206);
    font-size: 12px;
    padding: 4px;
    padding-right: 4px;
    text-align: left;
    color: rgb(126, 125, 125);
  }

  .directory-section-container {
    margin: 4px;
  }

  .no-directory {
    text-align: center;
    color: rgb(126, 125, 125);
    font-size: 12px;
    margin: 8px;
  }

  .directory {
    display: flex;
    align-items: center;
    margin: 8px;
  }

  .directory :global(.material-icons) {
    font-size: 24px;
    margin-right: 8px;
  }

  .directory .title {
    margin-top: 4px;
  }
</style>
