<script lang="ts">
  // UI / Framework
  import Button, { Label } from "@smui/button";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import FormField from "@smui/form-field";
  import LinearProgress from "@smui/linear-progress";
  import Radio from "@smui/radio";
  // Other imports
  import { storedSettings } from "../../../store/settings.js";
  import { downloadAndDecryptFile } from "../../../lib/crypto-transit.js";
  import { showCommonErrorDialog } from "../../../store/ui.js";
  import { expressBytesPrettified } from "../../../utility/value-utils.js";
  import { decryptToObject } from "../../../utility/crypto-utils.js";

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

  const listMetaDataKeys = (metaData) => {
    const ignoredList = ["size", "mimeType"];
    return Object.keys(metaData).filter((key) => !ignoredList.includes(key));
  };
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
          <div class="section">
            <div class="title">Essentials</div>

            <div class="item">
              <div class="label">Name</div>
              <div class="value">
                {entity.name}
              </div>
            </div>

            <div class="item">
              <div class="label">Size</div>
              <div class="value">
                {expressBytesPrettified(entity.metaData.size)}
              </div>
            </div>

            <div class="item">
              <div class="label">Type</div>
              <div class="value">
                {entity.metaData.mimeType}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="title">Meta Data</div>

            {#each listMetaDataKeys(entity.metaData) as key}
              <div class="item">
                <div class="label">{key}</div>
                <div class="value">
                  {entity.metaData[key]}
                </div>
              </div>
            {/each}
          </div>

          <div class="section">
            <div class="title">Encrypted Meta Data</div>

            {#each listMetaDataKeys(temporarilyDecryptedEncryptedMetaData) as key}
              <div class="item">
                <div class="label">{key}</div>
                <div class="value">
                  {temporarilyDecryptedEncryptedMetaData[key]}
                </div>
              </div>
            {/each}
          </div>
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
