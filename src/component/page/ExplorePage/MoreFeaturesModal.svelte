<script lang="ts">
  import Button, { Label } from "@smui/button";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import { epochToPrettyDateTime } from "../../../lib/date-helper.js";
  import { arrayDistinct, deepMerge } from "../../../lib/misc-utils.js";
  import { decryptToObject } from "../../../utility/crypto-utils.js";
  import DownloadAsZipModal from "./DownloadAsZipModal.svelte";

  const MoreFeaturesModalState = {
    IDLE: "IDLE",
    ACTIVE: "ACTIVE",
  };

  let state = MoreFeaturesModalState.IDLE;

  let entity = null;
  let isDirectory = false;
  let bucketPassword = null;

  let hasChanges = false;

  let acceptFn = null;
  let rejectFn = null;

  let wrapper;

  let temporarilyDecryptedEncryptedMetaData = {};

  let downloadAsZipModal = null;

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

      console.debug("Showing more features of entity", {
        entity,
        isDirectory,
        metaData: entity.metaData,
        temporarilyDecryptedEncryptedMetaData,
      });

      acceptFn = accept;
      rejectFn = reject;

      // start the show
      state = MoreFeaturesModalState.ACTIVE;
    });
  }

  const setAnswer = (answer) => {
    hasChanges = false;
    state = MoreFeaturesModalState.IDLE;
    temporarilyDecryptedEncryptedMetaData = {};
    acceptFn(answer || null);
    return;
  };

  const downloadAsZipClicked = async () => {
    state = MoreFeaturesModalState.IDLE;
    let nullableResponse = await downloadAsZipModal.showModal({
      entity,
      isDirectory,
      bucketPassword,
    });
    state = MoreFeaturesModalState.ACTIVE;
    setAnswer(null);
  };

  let shouldShowDialog = false;
  $: {
    shouldShowDialog = state !== MoreFeaturesModalState.IDLE;
  }
</script>

<DownloadAsZipModal bind:this={downloadAsZipModal} />
{#if shouldShowDialog}
  <div bind:this={wrapper}>
    <Dialog
      bind:open={shouldShowDialog}
      scrimClickAction=""
      escapeKeyAction=""
      aria-labelledby="mandatory-title"
      aria-describedby="mandatory-content"
    >
      <Title id="mandatory-title">More Options</Title>

      <Content id="mandatory-content">
        {#if entity}
          <Button
            class="start-upload-button"
            variant="raised"
            on:click={() => downloadAsZipClicked()}
          >
            <Label>Download as ZIP</Label>
          </Button>
        {/if}
      </Content>
      <Actions>
        <Button
          on:click={(e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
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
