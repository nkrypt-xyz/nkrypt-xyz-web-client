<script lang="ts">
  import Button, { Label } from "@smui/button";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import IconButton from "@smui/icon-button";
  import LinearProgress from "@smui/linear-progress";
  import Textfield from "@smui/textfield";
  import HelperText from "@smui/textfield/helper-text";
  import { clientErrorDef } from "../../../constant/client-errors.js";
  import { MetaDataConstant } from "../../../constant/meta-data-constants.js";
  import { MiscConstant } from "../../../constant/misc-constants.js";
  import {
    callFileCreateApi,
    callFileSetEncryptedMetaDataApi,
    callFileSetMetaDataApi,
  } from "../../../integration/content-apis.js";
  import { encryptAndUploadFile } from "../../../lib/crypto-transit.js";
  import { ClientError, handleAnyError } from "../../../lib/error-handling.js";
  import {
    generateThumbnail,
    isUploadCandidateLikelyAnImage,
  } from "../../../lib/image-viewer-helper.js";
  import { sanitizeFileName } from "../../../lib/sanitization-utils.js";
  import { storedSettings } from "../../../store/settings.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
  } from "../../../store/ui.js";
  import { encryptObject } from "../../../utility/crypto-utils.js";
  import { expressBytesPrettified } from "../../../utility/value-utils.js";

  let wrapper;

  let acceptFn = null;
  let rejectFn = null;

  let hideFileSelectionTemporarily = false;
  const INITIAL_AUTO_SELECT_ATTEMPT_DELAY_MS = 100;
  const INITIAL_SELECTION_BUTTON_REDISPLAYING_DELAY_MS = 3_000;

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

  let selectedUploadMethod = "basic";
  $: selectedUploadMethod = $storedSettings.uploadMechanism;

  type UploadCandiateBlock = {
    domFile: any;
    fileName: string;
    warningMessage: string;
    uploadProgress: {
      totalBytes: number;
      encryptedBytes: number;
      uploadedBytes: number;
      buffer: number;
      progress: number;
    };
    imageThumbnailContent: string;
    requiresOverwrite: boolean;
    isUploadable: boolean;
  };

  let uploadCandidateBlockList: UploadCandiateBlock[] = [];

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

      uploadCandidateBlockList = [];

      // start the show
      state = FileUploadModalState.FILE_SELECTION;

      internallyTryToTriggerFileSelection();
    });
  }

  const internallyTryToTriggerFileSelection = async () => {
    hideFileSelectionTemporarily = true;
    setTimeout(() => {
      try {
        selectFileToUploadClicked();
        setTimeout(() => {
          hideFileSelectionTemporarily = false;
        }, INITIAL_SELECTION_BUTTON_REDISPLAYING_DELAY_MS);
      } catch (ex) {
        hideFileSelectionTemporarily = false;
      }
    }, INITIAL_AUTO_SELECT_ATTEMPT_DELAY_MS);
  };

  const selectFileToUploadClicked = () => {
    uploadCandidateBlockList = [];
    wrapper.querySelector("#native-file-input").click();
  };

  const populateThumnailsIfRequired = async () => {
    for (let uploadCandidateBlock of uploadCandidateBlockList) {
      if (isUploadCandidateLikelyAnImage(uploadCandidateBlock.domFile.type)) {
        generateThumbnail(uploadCandidateBlock.domFile).then(
          (thumb: string) => {
            console.debug("Image thumbnail", thumb);
            uploadCandidateBlock.imageThumbnailContent = thumb;
            uploadCandidateBlockList = [...uploadCandidateBlockList];
          }
        );
      }
    }
  };

  const performPostNameChangeActions = async () => {
    allowUpload = false;

    for (let uploadCandidateBlock of uploadCandidateBlockList) {
      uploadCandidateBlock.isUploadable = false;
      uploadCandidateBlock.warningMessage = "";
      uploadCandidateBlock.requiresOverwrite = false;

      // sanitize and length check
      uploadCandidateBlock.fileName = sanitizeFileName(
        uploadCandidateBlock.fileName
      );
      if (uploadCandidateBlock.fileName.length < 1) {
        uploadCandidateBlock.warningMessage = `Enter a valid name to contniue.`;
        uploadCandidateBlockList = [...uploadCandidateBlockList];

        return;
      }

      // directories can not be overwritten
      let matchingDirectory = childDirectoryList.find(
        (directory) => directory.name === uploadCandidateBlock.fileName
      );
      if (matchingDirectory) {
        uploadCandidateBlock.warningMessage = `A directory with the expected name "${uploadCandidateBlock.fileName}" already exists.`;
        uploadCandidateBlock.isUploadable = false;
        uploadCandidateBlockList = [...uploadCandidateBlockList];

        return;
      }

      // files can be overwritten
      let matchingFile = childFileList.find(
        (file) => file.name === uploadCandidateBlock.fileName
      );
      if (matchingFile) {
        uploadCandidateBlock.warningMessage = `A file with the expected name "${uploadCandidateBlock.fileName}" already exists. 
      Either rename your file or it will be overwritten.`;
        uploadCandidateBlock.requiresOverwrite = true;
      }

      uploadCandidateBlock.isUploadable = true;
    }

    allowUpload = true;
    uploadCandidateBlockList = [...uploadCandidateBlockList];
  };

  const fileSelected = async (e) => {
    let domFileList = e.target.files;

    for (let domFile of domFileList) {
      uploadCandidateBlockList = [
        ...uploadCandidateBlockList,
        {
          domFile,
          fileName: domFile.name,
          warningMessage: null,
          uploadProgress: null,
          imageThumbnailContent: null,
          isUploadable: false,
          requiresOverwrite: false,
        },
      ];
    }

    console.debug("<File>s selected for uploading:", uploadCandidateBlockList);

    populateThumnailsIfRequired();
    performPostNameChangeActions();
  };

  const setAnswer = (answer) => {
    state = FileUploadModalState.IDLE;
    acceptFn(answer || null);
    return;
  };

  const updateProgressFn = (
    uploadProgressObject,
    totalBytes,
    encryptedBytes,
    uploadedBytes
  ) => {
    console.debug(
      `Upload progress: Encrypted = ${encryptedBytes}/${totalBytes} = ${Math.round(
        (encryptedBytes / totalBytes) * 100
      )}%, Uploaded = ${uploadedBytes}/${totalBytes} = ${Math.round(
        (uploadedBytes / totalBytes) * 100
      )}%`
    );
    Object.assign(uploadProgressObject, {
      totalBytes,
      encryptedBytes,
      uploadedBytes,
      buffer: encryptedBytes / totalBytes || 0,
      progress: uploadedBytes / totalBytes || 0,
    });
    uploadCandidateBlockList = [...uploadCandidateBlockList];
  };

  const uploadUploadCandidate = async (
    uploadCandidateBlock: UploadCandiateBlock
  ) => {
    let fileId = null;
    let { bucketId, _id: parentDirectoryId } = directory;

    if (uploadCandidateBlock.requiresOverwrite) {
      let matchingFile = childFileList.find(
        (file) => file.name === uploadCandidateBlock.fileName
      );
      fileId = matchingFile._id;
    } else {
      incrementActiveGlobalObtrusiveTaskCount();
      let response = await callFileCreateApi({
        bucketId,
        name: uploadCandidateBlock.fileName,
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

    uploadCandidateBlock.uploadProgress = {
      totalBytes: 0,
      encryptedBytes: 0,
      uploadedBytes: 0,
      buffer: 0,
      progress: 0,
    };
    uploadCandidateBlockList = [...uploadCandidateBlockList];

    let response = await encryptAndUploadFile(
      bucketId,
      fileId,
      uploadCandidateBlock.domFile,
      bucketPassword,
      (totalBytes, encryptedBytes, uploadedBytes) =>
        updateProgressFn(
          uploadCandidateBlock.uploadProgress,
          totalBytes,
          encryptedBytes,
          uploadedBytes
        ),
      selectedUploadMethod
    );
    if (response.hasError) {
      throw new ClientError(
        clientErrorDef.NKRE_UNEXPECTED_RESPONSE.code,
        clientErrorDef.NKRE_UNEXPECTED_RESPONSE.message
      );
    }

    {
      incrementActiveGlobalObtrusiveTaskCount();
      let metaData = {
        [MetaDataConstant.ORIGIN_GROUP_NAME]: {
          [MetaDataConstant.ORIGIN.ORIGINATION_SOURCE]:
            MiscConstant.ORIGINATION_SOURCE_UPLOAD,
          [MetaDataConstant.ORIGIN.ORIGINATION_DATE]: Date.now(),
          [MetaDataConstant.ORIGIN.LAST_MODIFIED_DURING_ORIGINATION]:
            uploadCandidateBlock.domFile.lastModified,
        },
        [MetaDataConstant.CORE_GROUP_NAME]: {
          [MetaDataConstant.CORE.SIZE_BEFORE_ENCRYPTION]:
            uploadCandidateBlock.domFile.size,
          [MetaDataConstant.CORE.MIME_TYPE]: uploadCandidateBlock.domFile.type,
        },
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
        [MetaDataConstant.ORIGIN_GROUP_NAME]: {
          [MetaDataConstant.ORIGIN.ORIGINAL_NAME]:
            uploadCandidateBlock.domFile.name,
        },
      };

      if (
        isUploadCandidateLikelyAnImage(uploadCandidateBlock.domFile.type) &&
        uploadCandidateBlock.imageThumbnailContent
      ) {
        encryptedMetaData[MetaDataConstant.IMAGE_GROUP_NAME] = {
          [MetaDataConstant.IMAGE.IMAGE_THUMBNAIL_CONTENT]:
            uploadCandidateBlock.imageThumbnailContent,
        };
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
  };

  const startUploadClicked = async () => {
    try {
      state = FileUploadModalState.FILE_UPLOAD;

      for (let uploadCandidateBlock of uploadCandidateBlockList) {
        await uploadUploadCandidate(uploadCandidateBlock);
      }

      setAnswer(true);
    } catch (ex) {
      await handleAnyError(ex);
      setAnswer(true);
    }
  };

  const removeUploadCandidateBlock = async (uploadCandidateBlock) => {
    let index = uploadCandidateBlockList.indexOf(uploadCandidateBlock);
    if (index === -1) return;
    uploadCandidateBlockList.splice(index, 1);
    uploadCandidateBlockList = [...uploadCandidateBlockList];
  };

  let shouldShowDialog = false;
  let allowCancel = false;
  let allowUpload = false;
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
        multiple
      />

      <Content id="mandatory-content" class="upload-modal-content">
        {#if uploadCandidateBlockList.length > 0}
          {#each uploadCandidateBlockList as uploadCandidateBlock}
            <div class="upload-candidate-block">
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <div
                style="float: right;"
                hidden={state !== FileUploadModalState.FILE_SELECTION}
                on:click={() =>
                  removeUploadCandidateBlock(uploadCandidateBlock)}
              >
                ✖️
              </div>
              <div class="upload-candidate-inner-wrapper">
                <div class="left-side">
                  {#if isUploadCandidateLikelyAnImage(uploadCandidateBlock.domFile.type) && uploadCandidateBlock.imageThumbnailContent}
                    <div>
                      <img
                        class="preview-image"
                        src={uploadCandidateBlock.imageThumbnailContent}
                        alt="Thumbnail of content"
                      />
                    </div>
                  {:else}
                    <IconButton size="mini" class="material-icons"
                      >description
                    </IconButton>
                  {/if}
                </div>
                <div class="right-side" style="flex: 1">
                  <Textfield
                    style="width: 100%"
                    bind:value={uploadCandidateBlock.fileName}
                    label="Name"
                    type="text"
                    required
                    disabled={state !== FileUploadModalState.FILE_SELECTION}
                    on:input={performPostNameChangeActions}
                  >
                    <HelperText slot="helper" persistent>
                      {uploadCandidateBlock.warningMessage || ""}
                    </HelperText>
                  </Textfield>
                </div>
              </div>

              <div class="upload-candidate-essential-info">
                <div class="essential-info-2">
                  {uploadCandidateBlock.domFile.type}
                </div>
                <div style="flex:1" />
                <div class="essential-info-1">
                  {expressBytesPrettified(uploadCandidateBlock.domFile.size)}
                </div>
              </div>

              <div>
                {#if uploadCandidateBlock.uploadProgress}
                  <LinearProgress
                    progress={uploadCandidateBlock.uploadProgress.progress}
                    buffer={uploadCandidateBlock.uploadProgress.buffer}
                  />
                {/if}
              </div>
            </div>
          {/each}
        {/if}

        {#if state === FileUploadModalState.FILE_SELECTION}
          {#if uploadCandidateBlockList.length > 0}
            <div style="margin-top: 8px;">
              <Button
                class="start-upload-button"
                variant="raised"
                on:click={() => startUploadClicked()}
                disabled={!allowUpload}
              >
                <Label>{"Start Upload"}</Label>
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
                class="select-file-button {hideFileSelectionTemporarily
                  ? 'force-hidden'
                  : ''}"
                variant="raised"
                on:click={() => selectFileToUploadClicked()}
              >
                <Label>Select files</Label>
              </Button>
            </div>
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
  * :global(.mdc-text-field__input) {
    font-size: 14px;
  }

  .upload-candidate-block {
    border-radius: 5px;
    border: 1px dotted #dcd8d8;
    margin-bottom: 8px;
    padding: 4px;
    font-size: 12px;
  }

  .upload-candidate-inner-wrapper {
    display: flex;
    align-items: center;
  }

  .left-side {
    padding-right: 4px;
  }

  .preview-image {
    width: 50px;
    height: 50px;
    border: 2px solid white;
    border-radius: 10px;
  }

  .upload-candidate-essential-info {
    font-size: 12px;
    font-family: Roboto, sans-serif;
    line-height: normal;
    display: flex;
    align-items: center;
  }

  .essential-info-1 {
    padding: 4px;
    /* text-decoration: underline; */
    display: inline-block;
    word-spacing: -2px;
  }

  .essential-info-2 {
    padding: 4px;
    text-decoration: underline;
    display: inline-block;
  }

  * :global(.force-hidden) {
    display: none;
  }
</style>
