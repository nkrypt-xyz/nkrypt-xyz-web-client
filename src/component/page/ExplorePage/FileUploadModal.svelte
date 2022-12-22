<script lang="ts">
  // UI / Framework
  import Button, { Label } from "@smui/button";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import FormField from "@smui/form-field";
  import LinearProgress from "@smui/linear-progress";
  import Radio from "@smui/radio";
  import Textfield from "@smui/textfield";
  import HelperText from "@smui/textfield/helper-text";
  import { storedSettings } from "../../../store/settings.js";
  // Other imports
  import {
    callFileCreateApi,
    callFileSetEncryptedMetaDataApi,
    callFileSetMetaDataApi,
  } from "../../../integration/content-apis.js";
  import { encryptAndUploadFile } from "../../../lib/crypto-transit.js";
  import { handleAnyError } from "../../../lib/error-handling.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
  } from "../../../store/ui.js";
  import { encryptObject } from "../../../utility/crypto-utils.js";
  import { expressBytesPrettified } from "../../../utility/value-utils.js";
  import {
    generateThumbnail,
    isLikelyImage,
    isUploadCandidateLikelyAnImage,
  } from "../../../lib/image-viewer-helper.js";

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

  let imageThumbnailContent = null;

  let selectedUploadMethod = "basic";

  $: selectedUploadMethod = $storedSettings.uploadMechanism;

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

      imageThumbnailContent = null;
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

    if (isUploadCandidateLikelyAnImage(uploadCandidate.type)) {
      generateThumbnail(uploadCandidate).then((thumb) => {
        console.debug("Image thumbnail", thumb);
        imageThumbnailContent = thumb;
      });
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
    try {
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
        return;
      }

      {
        incrementActiveGlobalObtrusiveTaskCount();
        let metaData = {
          size: uploadCandidate.size,
          mimeType: uploadCandidate.type,
        };
        let response = await callFileSetMetaDataApi({
          bucketId,
          fileId,
          metaData,
        });
        decrementActiveGlobalObtrusiveTaskCount();
      }

      {
        incrementActiveGlobalObtrusiveTaskCount();
        let encryptedMetaData = {
          originalName: uploadCandidate.name,
        };

        if (
          isUploadCandidateLikelyAnImage(uploadCandidate.type) &&
          imageThumbnailContent
        ) {
          encryptedMetaData["imageThumbnailContent"] = imageThumbnailContent;
        }

        let response = await callFileSetEncryptedMetaDataApi({
          bucketId,
          fileId,
          encryptedMetaData: await encryptObject(
            encryptedMetaData,
            bucketPassword
          ),
        });
        decrementActiveGlobalObtrusiveTaskCount();
      }

      setAnswer(response);
      return;
    } catch (ex) {
      return await handleAnyError(ex);
    }
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

            {#if isUploadCandidateLikelyAnImage(uploadCandidate.type) && imageThumbnailContent}
              <div>
                <img src={imageThumbnailContent} alt="Thumbnail of content" />
              </div>
            {/if}
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
