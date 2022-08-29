<script lang="ts">
  // UI / Framework
  import Button, { Label } from "@smui/button";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import FormField from "@smui/form-field";
  import LinearProgress from "@smui/linear-progress";
  import Radio from "@smui/radio";
  // Other imports
  import { downloadAndDecryptFile } from "../../../lib/crypto-transit.js";
  import { showCommonErrorDialog } from "../../../store/ui.js";
  import { expressBytesPrettified } from "../../../utility/value-utils.js";

  const FileOperationModalState = {
    IDLE: "IDLE",
    PROVIDE_OPTIONS: "PROVIDE_OPTIONS",
    FILE_DOWNLOAD: "FILE_DOWNLOAD",
  };

  let state = FileOperationModalState.IDLE;

  let file = null;
  let bucketPassword = null;

  let acceptFn = null;
  let rejectFn = null;

  let wrapper;

  let warningMessage = null;
  let downloadProgress = null;

  let selectedDownloadMethod = "basic";

  export function showModal(params: { file; bucketPassword }): Promise<string> {
    return new Promise<string>((accept, reject) => {
      ({ file, bucketPassword } = params);
      acceptFn = accept;
      rejectFn = reject;

      // start the show
      state = FileOperationModalState.PROVIDE_OPTIONS;
      warningMessage = null;
    });
  }

  const setAnswer = (answer) => {
    state = FileOperationModalState.IDLE;
    acceptFn(answer || null);
    return;
  };

  const downloadProgressFn = (totalBytes, downloadedBytes, decryptedBytes) => {
    console.debug(
      `Download progress: Download = ${downloadedBytes}/${totalBytes} = ${Math.round(
        (downloadedBytes / totalBytes) * 100
      )}%, Decrypted = ${decryptedBytes}/${totalBytes} = ${Math.round(
        (decryptedBytes / totalBytes) * 100
      )}%`
    );
    downloadProgress = {
      totalBytes,
      downloadedBytes,
      decryptedBytes,
      buffer: downloadedBytes / totalBytes || 0,
      progress: decryptedBytes / totalBytes || 0,
    };
  };

  const startDownloadClicked = async () => {
    state = FileOperationModalState.FILE_DOWNLOAD;
    try {
      let response = await downloadAndDecryptFile(
        file.bucketId,
        file._id,
        file.name,
        bucketPassword,
        downloadProgressFn,
        selectedDownloadMethod
      );
      console.debug("File download results:", response);
    } catch (ex) {
      await showCommonErrorDialog(ex);
    }
    state = FileOperationModalState.PROVIDE_OPTIONS;
  };

  let shouldShowDialog = false;
  let allowCancel = false;
  $: {
    shouldShowDialog = state !== FileOperationModalState.IDLE;
    allowCancel = state !== FileOperationModalState.FILE_DOWNLOAD;
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
      <Title id="mandatory-title"
        >{state === FileOperationModalState.FILE_DOWNLOAD
          ? "Downloading file"
          : "Previewing file"}
      </Title>

      <Content id="mandatory-content">
        {#if file}
          <div class="download-summary">
            <div>
              <span class="title">Original Name: </span>
              <span class="value">{file.name}</span>
            </div>
            <div>
              <span class="title">Size before encryption: </span>
              <span class="value">{expressBytesPrettified(file.size)}</span>
            </div>
            <div>
              <span class="title">Type: </span>
              <span class="value">{file.type}</span>
            </div>
          </div>

          {#if state === FileOperationModalState.PROVIDE_OPTIONS}
            <Button
              class="start-download-button"
              variant="raised"
              on:click={() => startDownloadClicked()}
            >
              <Label>Decrypt and download</Label>
            </Button>

            <h4>Download method</h4>
            <div class="upload-method">
              <FormField>
                <Radio
                  bind:group={selectedDownloadMethod}
                  value={"basic"}
                  touch
                />
                <span slot="label">Basic</span>
              </FormField>
              <FormField>
                <Radio
                  bind:group={selectedDownloadMethod}
                  value={"stream"}
                  touch
                />
                <span slot="label">Streaming</span>
              </FormField>
              <FormField>
                <Radio
                  bind:group={selectedDownloadMethod}
                  value={"vfs"}
                  touch
                />
                <span slot="label">Virtual File System</span>
              </FormField>
            </div>
          {/if}

          {#if state === FileOperationModalState.FILE_DOWNLOAD}
            <!-- Download - start -->
            <div class="downloading-message">
              Downloading and decrypting file
            </div>
            {#if downloadProgress}
              <LinearProgress
                progress={downloadProgress.progress}
                buffer={downloadProgress.buffer}
              />
            {/if}
            <!-- Download - end -->
          {/if}
        {/if}
      </Content>
      <Actions>
        {#if allowCancel}
          <Button
            on:click={(e) => {
              e.preventDefault();
              setAnswer(false);
            }}
          >
            <Label>Cancel</Label>
          </Button>
        {/if}
      </Actions>
    </Dialog>
  </div>
{/if}

<style>
  .download-summary {
    font-size: 12px;
    margin-bottom: 8px;
  }

  .download-summary .title {
    font-weight: 600;
  }

  .downloading-message {
    margin-top: 8px;
    margin-bottom: 8px;
  }
</style>
