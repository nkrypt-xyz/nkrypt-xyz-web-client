<script lang="ts">
  // UI / Framework
  import { Icon } from "@smui/button";
  import Menu from "@smui/menu";
  import List, { Item, Separator, Text } from "@smui/list";
  import Button, { Label } from "@smui/button";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
    showConfirmation,
    showPrompt,
  } from "../../../store/ui.js";
  import {
    callDirectoryDeleteApi,
    callDirectoryGetApi,
    callDirectoryRenameApi,
    callFileDeleteApi,
    callFileRenameApi,
  } from "../../../integration/content-apis.js";
  import { handleAnyError } from "../../../lib/error-handling.js";
  // Other imports

  export let childFileList = [];
  export let childFileClicked = null;
  export let refreshExplorePage = null;
  export let viewPropertiesOfChildFileClicked = null;
  export let initiateMoveFn = null;

  // known and acceptable minor memory leak.
  let menus = {};

  const renameClicked = async (childFile) => {
    let answer = await showPrompt(
      "Renaming Directory",
      `Enter the new name for the directory "${childFile.name}"`,
      childFile.name
    );

    if (!answer || answer.trim().length < 1) return;

    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callFileRenameApi({
        bucketId: childFile.bucketId,
        fileId: childFile._id,
        name: answer,
      });
      decrementActiveGlobalObtrusiveTaskCount();
    } catch (ex) {
      await handleAnyError(ex);
    }

    await refreshExplorePage();
  };

  const deleteClicked = async (childFile) => {
    let answer = await showConfirmation(
      "Confirm Deletion",
      `Are you sure you want to delete the file "${childFile.name}"? The file will be deleted permanently.`
    );

    if (!answer) return;

    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callFileDeleteApi({
        bucketId: childFile.bucketId,
        fileId: childFile._id,
      });
      decrementActiveGlobalObtrusiveTaskCount();
    } catch (ex) {
      await handleAnyError(ex);
    }

    await refreshExplorePage();
  };

  const cutClicked = async (childFile) => {
    initiateMoveFn(childFile, false);
  };

  const viewPropertiesClicked = async (childFile) => {
    await viewPropertiesOfChildFileClicked(childFile);
  };
</script>

<div class="file-section-header">Files</div>

<div class="file-section-container">
  {#if childFileList.length === 0}
    <div class="no-file">No files found.</div>
  {/if}
  {#each childFileList as childFile, i}
    <div class="file">
      <Icon class="material-icons" on:click={() => childFileClicked(childFile)}>
        file_present
      </Icon>
      <div class="title" on:click={() => childFileClicked(childFile)}>
        {childFile.name}
      </div>

      <div class="action-menu-trigger">
        <Icon
          class="material-icons"
          on:click={() => {
            menus[childFile._id].setOpen(true);
          }}
        >
          more_vert
        </Icon>
        <Menu bind:this={menus[childFile._id]} anchorCorner="TOP_RIGHT">
          <List>
            <Item on:SMUI:action={() => childFileClicked(childFile)}>
              <Text>Open</Text>
            </Item>
            <Item on:SMUI:action={() => renameClicked(childFile)}>
              <Text>Rename</Text>
            </Item>
            <Item on:SMUI:action={() => cutClicked(childFile)}>
              <Text>Cut</Text>
            </Item>
            <Item on:SMUI:action={() => deleteClicked(childFile)}>
              <Text>Delete</Text>
            </Item>
            <Separator />
            <Item on:SMUI:action={() => viewPropertiesClicked(childFile)}>
              <Text>Properties</Text>
            </Item>
          </List>
        </Menu>
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
    flex: 1;
    white-space: break-spaces;
    overflow-wrap: anywhere;
  }

  .file .action-menu-trigger {
    margin-top: 2px;
    cursor: pointer;
  }
</style>
