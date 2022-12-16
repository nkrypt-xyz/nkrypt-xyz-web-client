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
  } from "../../../integration/content-apis.js";
  import { handleAnyError } from "../../../lib/error-handling.js";
  // Other imports

  export let childDirectoryList = [];
  export let childDirectoryClicked = null;
  export let refreshExplorePage = null;
  export let viewPropertiesOfChildDirectoryClicked = null;

  let menu: Menu;
  let possibleChildDirectory = null;

  const renameClicked = async (childDirectory) => {
    console.log("To rename", childDirectory);

    let answer = await showPrompt(
      "Renaming Directory",
      `Enter the new name for the directory "${childDirectory.name}"`
    );

    if (!answer || answer.trim().length < 1) return;

    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callDirectoryRenameApi({
        bucketId: childDirectory.bucketId,
        directoryId: childDirectory._id,
        name: answer,
      });
      decrementActiveGlobalObtrusiveTaskCount();
    } catch (ex) {
      await handleAnyError(ex);
    }

    await refreshExplorePage();
  };

  const deleteClicked = async (childDirectory) => {
    console.log("To delete", childDirectory);

    let answer = await showConfirmation(
      "Confirm Deletion",
      `Are you sure you want to delete the directory "${childDirectory.name}"? The directory and every directory or file it contains will be deleted permanently.`
    );

    if (!answer) return;

    try {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callDirectoryDeleteApi({
        bucketId: childDirectory.bucketId,
        directoryId: childDirectory._id,
      });
      decrementActiveGlobalObtrusiveTaskCount();
    } catch (ex) {
      await handleAnyError(ex);
    }

    await refreshExplorePage();
  };

  const viewPropertiesClicked = async (childDirectory) => {
    console.log("To view properties", childDirectory);

    await viewPropertiesOfChildDirectoryClicked(childDirectory);
  };
</script>

<div class="directory-section-header">Directories</div>

<div class="directory-section-container">
  {#if childDirectoryList.length === 0}
    <div class="no-directory">No subdirectories found.</div>
  {/if}
  {#each childDirectoryList as childDirectory, i}
    <div class="directory">
      <Icon
        class="material-icons"
        on:click={() => childDirectoryClicked(childDirectory)}
      >
        folder
      </Icon>
      <div class="title" on:click={() => childDirectoryClicked(childDirectory)}>
        {childDirectory.name}
      </div>

      <div class="action-menu-trigger">
        <Icon
          class="material-icons"
          on:click={() => {
            menu.setOpen(true);
            // TODO improve upon this unfortunate hack
            possibleChildDirectory = childDirectory;
          }}
        >
          more_vert
        </Icon>
        <Menu bind:this={menu} anchorCorner="TOP_RIGHT">
          <List>
            <Item on:SMUI:action={() => childDirectoryClicked(possibleChildDirectory)}>
              <Text>Open</Text>
            </Item>
            <Item on:SMUI:action={() => renameClicked(possibleChildDirectory)}>
              <Text>Rename</Text>
            </Item>
            <Item on:SMUI:action={() => deleteClicked(possibleChildDirectory)}>
              <Text>Delete</Text>
            </Item>
            <Separator />
            <Item
              on:SMUI:action={() =>
                viewPropertiesClicked(possibleChildDirectory)}
            >
              <Text>Properties</Text>
            </Item>
          </List>
        </Menu>
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
    margin-top: 2px;
    cursor: pointer;
    flex: 1;
  }

  .directory .action-menu-trigger {
    margin-top: 2px;
    cursor: pointer;
  }
</style>
