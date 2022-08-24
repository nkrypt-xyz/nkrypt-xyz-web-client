<script lang="ts">
  // UI
  import Textfield from "@smui/textfield";
  import Icon from "@smui/textfield/icon";
  import HelperText from "@smui/textfield/helper-text";
  import Radio from "@smui/radio";
  import FormField from "@smui/form-field";
  // Extern
  import { form, field } from "svelte-forms";
  import { required, min } from "svelte-forms/validators";
  import { replace } from "svelte-spa-router";
  // Intern
  import { standardField } from "../../../lib/validations.js";
  import { CommonConstant } from "../../../constant/common-constants.js";
  import { callUserLoginApi } from "../../../integration/user-apis.js";
  import { minlength } from "../../../lib/validators.js";
  import { extract } from "../../../utility/misc-utils.js";
  import { storedUser } from "../../../store/user.js";
  import { storedSession } from "../../../store/session.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
  } from "../../../store/ui.js";
  import {
    callBucketCreateApi,
    callBucketListApi,
    callFileCreateApi,
  } from "../../../integration/content-apis.js";
  import { encryptObject, encryptText } from "../../../utility/crypto-utils.js";
  import { bucketList } from "../../../store/content.js";
  import Dialog, { Title, Content, Actions } from "@smui/dialog";
  import Button, { Label } from "@smui/button";
  import CircularProgress from "@smui/circular-progress";
  import { expressBytesPrettified } from "../../../utility/value-utils.js";
  import { handleErrorIfAny } from "../../../lib/error-handling.js";
  import { encryptAndUploadFile } from "../../../lib/crypto-transit.js";
  import LinearProgress from "@smui/linear-progress";

  const FileUploadModalState = {
    IDLE: "IDLE",
    FILE_SELECTION: "FILE_SELECTION",
    FILE_UPLOAD: "FILE_UPLOAD",
  };

  let state = FileUploadModalState.IDLE;

  let directory = null;
  let childDirectoryList = [];
  let childFileList = [];
  let bucketPassword = null;

  let acceptFn = null;
  let rejectFn = null;

  let wrapper;
  let uploadCandidate = null;
  let fileName = "";

  let warningMessage = null;
  let uploadProgress = null;

  let selectedUploadMethod = "basic";

  export function showAndUploadFile(params: {
    directory;
    childDirectoryList;
    childFileList;
    bucketPassword;
  }): Promise<string> {
    return new Promise<string>((accept, reject) => {
      ({ directory, childDirectoryList, childFileList, bucketPassword } =
        params);
      acceptFn = accept;
      rejectFn = reject;

      uploadCandidate = null;
      fileName = "";

      // start the show
      state = FileUploadModalState.FILE_SELECTION;
      warningMessage = null;
    });
  }

  const selectFileToUploadClicked = () => {
    wrapper.querySelector("#native-file-input").click();
  };

  const fileSelected = async (e) => {
    uploadCandidate = e.target.files[0] || null;
    fileName = "";
    fileNameChanged();
    if (uploadCandidate) {
      console.debug("<File> selected for uploading:", uploadCandidate);
      fileName = sanitizeFileName(uploadCandidate.name);
      fileNameChanged();
    }
  };

  const setAnswer = (answer) => {
    state = FileUploadModalState.IDLE;
    acceptFn(answer || null);
    return;
  };

  // TODO strip unsupported characters
  const sanitizeFileName = (_fileName) => {
    return _fileName;
  };

  const fileNameChanged = () => {
    warningMessage = null;
    requiresOverwrite = false;

    if (fileName.length === 0) {
      allowUpload = false;
      return;
    }

    // directories can not be overwritten
    let matchingDirectory = childDirectoryList.find(
      (directory) => directory.name === fileName
    );
    if (matchingDirectory) {
      warningMessage = `A directory with the expected name "${fileName}" already exists.`;
      allowUpload = false;
      return;
    }

    // files can be overwritten
    let matchingFile = childFileList.find((file) => file.name === fileName);
    if (matchingFile) {
      warningMessage = `A file with the expected name "${fileName}" already exists. 
      Either rename your file or overwrite.`;
      requiresOverwrite = true;
    }

    allowUpload = true;
  };

  const updateProgressFn = (totalBytes, encryptedBytes, uploadedBytes) => {
    console.debug(
      `Upload progress: Encrypted = ${encryptedBytes}/${totalBytes} = ${Math.round(
        (encryptedBytes / totalBytes) * 100
      )}%, Uploaded = ${uploadedBytes}/${totalBytes} = ${Math.round(
        (uploadedBytes / totalBytes) * 100
      )}%`
    );
    uploadProgress = {
      totalBytes,
      encryptedBytes,
      uploadedBytes,
      buffer: encryptedBytes / totalBytes || 0,
      progress: uploadedBytes / totalBytes || 0,
    };
  };

  const startUploadClicked = async () => {
    let fileId = null;
    let { bucketId, _id: parentDirectoryId } = directory;

    if (requiresOverwrite) {
      let matchingFile = childFileList.find((file) => file.name === fileName);
      fileId = matchingFile._id;
    } else {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callFileCreateApi({
        bucketId,
        name: fileName,
        parentDirectoryId,
        metaData: {},
        encryptedMetaData: await encryptObject({}, bucketPassword),
      });
      if (response.hasError) {
        setAnswer(null);
        await handleErrorIfAny(response);
        return;
      }
      decrementActiveGlobalObtrusiveTaskCount();
      ({ fileId } = response);
    }

    state = FileUploadModalState.FILE_UPLOAD;
    uploadProgress = {
      totalBytes: 0,
      encryptedBytes: 0,
    };
    let response = await encryptAndUploadFile(
      bucketId,
      fileId,
      uploadCandidate,
      bucketPassword,
      updateProgressFn,
      selectedUploadMethod
    );
    if (response.hasError) {
      setAnswer(null);
      await handleErrorIfAny(response);
      return;
    }

    setAnswer(response);
    return;
  };

  let shouldShowDialog = false;
  let allowCancel = false;
  let allowUpload = false;
  let requiresOverwrite = false;
  $: {
    shouldShowDialog = state !== FileUploadModalState.IDLE;
    allowCancel = state !== FileUploadModalState.FILE_UPLOAD;
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
        >{state === FileUploadModalState.FILE_UPLOAD
          ? "Uploading file"
          : "Upload file"}
      </Title>

      <input
        type="file"
        id="native-file-input"
        on:change={fileSelected}
        style="display:none;"
      />

      <Content id="mandatory-content">
        {#if uploadCandidate}
          <div class="upload-summary">
            <div>
              <span class="title">Original Name: </span>
              <span class="value">{uploadCandidate.name}</span>
            </div>
            <div>
              <span class="title">Size before encryption: </span>
              <span class="value"
                >{expressBytesPrettified(uploadCandidate.size)}</span
              >
            </div>
            <div>
              <span class="title">Type: </span>
              <span class="value">{uploadCandidate.type}</span>
            </div>
          </div>
        {/if}

        {#if state === FileUploadModalState.FILE_SELECTION}
          {#if uploadCandidate}
            <Textfield
              style="width: 100%"
              bind:value={fileName}
              label="File name"
              type="text"
              required
              on:input={fileNameChanged}
            >
              <HelperText slot="helper" persistent>
                {warningMessage || ""}
              </HelperText>
            </Textfield>
          {/if}
        {/if}

        {#if state === FileUploadModalState.FILE_SELECTION}
          <!-- File selection buttons - start -->
          {#if uploadCandidate}
            <div style="margin-top: 8px;">
              <Button
                class="start-upload-button"
                variant="raised"
                on:click={() => startUploadClicked()}
                disabled={!allowUpload}
              >
                <Label>{requiresOverwrite ? "Overwrite" : "Start Upload"}</Label
                >
              </Button>
              <Button
                class="select-file-button"
                variant="outlined"
                on:click={() => selectFileToUploadClicked()}
              >
                <Label>Select again</Label>
              </Button>
            </div>
          {:else}
            <div>
              <Button
                class="select-file-button"
                variant="raised"
                on:click={() => selectFileToUploadClicked()}
              >
                <Label>Select a file</Label>
              </Button>
            </div>
          {/if}
          <!-- File selection buttons - end -->
        {/if}

        {#if state === FileUploadModalState.FILE_SELECTION}
          {#if uploadCandidate}
            <h4>Upload method</h4>
            <div class="upload-method">
              <FormField>
                <Radio
                  bind:group={selectedUploadMethod}
                  value={"basic"}
                  touch
                />
                <span slot="label">Basic</span>
              </FormField>
              <FormField>
                <Radio
                  bind:group={selectedUploadMethod}
                  value={"stream"}
                  touch
                />
                <span slot="label">Streaming</span>
              </FormField>
              <FormField>
                <Radio bind:group={selectedUploadMethod} value={"vfs"} touch />
                <span slot="label">Virtual File System</span>
              </FormField>
            </div>
          {/if}
        {/if}

        {#if state === FileUploadModalState.FILE_UPLOAD}
          <!-- Upload - start -->
          <div class="uploading-message">Encrypting and uploading file</div>
          {#if uploadProgress}
            <LinearProgress
              progress={uploadProgress.progress}
              buffer={uploadProgress.buffer}
            />
          {/if}
          <!-- Upload - end -->
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
  .upload-summary {
    font-size: 12px;
  }

  .upload-summary .title {
    font-weight: 600;
  }

  .uploading-message {
    margin-top: 8px;
    margin-bottom: 8px;
  }
</style>
