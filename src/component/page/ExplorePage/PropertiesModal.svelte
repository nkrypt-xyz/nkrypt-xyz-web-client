<script lang="ts">
  import Button, { Label } from "@smui/button";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import { epochToPrettyDateTime } from "../../../lib/date-helper.js";
  import { arrayDistinct, deepMerge } from "../../../lib/misc-utils.js";
  import { decryptToObject } from "../../../utility/crypto-utils.js";

  const prettifyGroupName = (key) => {
    const map = {
      core: "Core",
      origin: "Origin",
      image: "Image",
      serverSpecified: "Specified by Server",
    };
    if (key in map) {
      return map[key];
    }
    return key;
  };

  const prettifyEntryName = (key) => {
    const map = {
      sizeBeforeEncryption: "Size",
      mimeType: "Type",
      originalName: "Original Name",
      originationSource: "Source",
      originationDate: "Date Originated",
      imageThumbnailContent: "Thumnail",
      createdAt: "Created",
      updatedAt: "Updated",
      contentUpdatedAt: "Content Updated",
      name: "Name",
    };
    if (key in map) {
      return map[key];
    }
    if (key.replace(LOCK_EMOJI, "") in map) {
      return map[key.replace(LOCK_EMOJI, "")] + LOCK_EMOJI;
    }
    return key;
  };

  const prettifyEntryValue = (groupName, key, value) => {
    try {
      key = key.replace(LOCK_EMOJI, "");
      if (groupName === "image" && key === "imageThumbnailContent") {
        return (String(value) || "").substring(0, 16) + "...";
      } else if (
        (groupName === "origin" && key === "originationDate") ||
        (groupName === "serverSpecified" &&
          ["createdAt", "updatedAt", "contentUpdatedAt"].includes(key))
      ) {
        return value ? epochToPrettyDateTime(value) : "Never";
      } else if (groupName === "origin" && key === "originationSource") {
        return (
          {
            upload: "Upload",
            createFile: "File created by user",
            createDirectory: "Directory created by user",
          }[value] || value
        );
      } else if (value === null) {
        return "Null";
      }

      return value;
    } catch (ex) {
      return value;
    }
  };

  const preferredGroupOrder = ["core", "origin"];
  const LOCK_EMOJI = "🔒";

  const PropertiesModalState = {
    IDLE: "IDLE",
    ACTIVE: "ACTIVE",
  };

  let state = PropertiesModalState.IDLE;

  let entity = null;
  let isDirectory = false;
  let bucketPassword = null;

  let hasChanges = false;

  let acceptFn = null;
  let rejectFn = null;

  let wrapper;

  let temporarilyDecryptedEncryptedMetaData = {};

  let combinedMetaData = [];
  let combinedGroupNames = [];

  export function showModal(params: {
    entity;
    isDirectory;
    bucketPassword;
  }): Promise<string> {
    return new Promise<string>(async (accept, reject) => {
      ({ entity, isDirectory, bucketPassword } = params);

      temporarilyDecryptedEncryptedMetaData = await decryptToObject(
        entity.encryptedMetaData,
        bucketPassword
      );

      for (let key in temporarilyDecryptedEncryptedMetaData) {
        for (let keyInner in temporarilyDecryptedEncryptedMetaData[key]) {
          temporarilyDecryptedEncryptedMetaData[key][keyInner + LOCK_EMOJI] =
            temporarilyDecryptedEncryptedMetaData[key][keyInner];
          delete temporarilyDecryptedEncryptedMetaData[key][keyInner];
        }
      }

      let serverSpecified = {
        name: entity.name,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      };
      if (!isDirectory) {
        (<any>serverSpecified).contentUpdatedAt = entity.contentUpdatedAt;
      }

      combinedMetaData = deepMerge(
        entity.metaData,
        temporarilyDecryptedEncryptedMetaData,
        {
          serverSpecified: serverSpecified,
        }
      );
      combinedGroupNames = arrayDistinct(
        [].concat(
          preferredGroupOrder.filter((name) =>
            Object.hasOwn(combinedMetaData, name)
          ),
          Object.keys(combinedMetaData)
        )
      );

      console.debug("Inspecting metaData of entity", {
        entity,
        isDirectory,
        metaData: entity.metaData,
        temporarilyDecryptedEncryptedMetaData,
      });

      acceptFn = accept;
      rejectFn = reject;

      // start the show
      state = PropertiesModalState.ACTIVE;
    });
  }

  const setAnswer = (answer) => {
    hasChanges = false;
    state = PropertiesModalState.IDLE;
    temporarilyDecryptedEncryptedMetaData = {};
    acceptFn(answer || null);
    return;
  };

  let shouldShowDialog = false;
  $: {
    shouldShowDialog = state !== PropertiesModalState.IDLE;
  }
</script>

{#if shouldShowDialog}
  <div bind:this={wrapper}>
    <Dialog
      bind:open={shouldShowDialog}
      scrimClickAction=""
      escapeKeyAction=""
      aria-labelledby="mandatory-title"
      aria-describedby="mandatory-content"
    >
      <Title id="mandatory-title">Properties</Title>

      <Content id="mandatory-content">
        {#if entity}
          {#if combinedGroupNames.length === 0}
            <div class="no-metadata">This file/directory has no MetaData.</div>
          {/if}
          {#each combinedGroupNames as groupName}
            <div class="section">
              <div class="title">{prettifyGroupName(groupName)}</div>

              {#each Object.keys(combinedMetaData[groupName]) as entryName}
                <div class="item">
                  <div class="label">{prettifyEntryName(entryName)}</div>
                  <div class="value">
                    {prettifyEntryValue(
                      groupName,
                      entryName,
                      combinedMetaData[groupName][entryName]
                    )}
                  </div>
                </div>
              {/each}
            </div>
          {/each}
        {/if}
      </Content>
      <Actions>
        <Button
          on:click={(e) => {
            e.preventDefault();
            setAnswer(false);
          }}
        >
          <Label>Close</Label>
        </Button>
      </Actions>
    </Dialog>
  </div>
{/if}

<style>
  .section {
    margin-top: 6px;
    font-size: 12px;
  }

  .section .title {
    background-color: #2a8dc7;
    color: white;
    padding: 8px;
  }

  .section .item {
    display: flex;
    padding: 4px;

    background-color: #bbd6e6;
  }

  .section .item .label {
    flex: 1;
    padding-right: 4px;
  }

  .section .item .value {
    flex: 2;
  }
</style>
