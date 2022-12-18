<script lang="ts">
  // UI / Framework
  import Button, { Label } from "@smui/button";
  import Checkbox from "@smui/checkbox";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import FormField from "@smui/form-field";
  import LinearProgress from "@smui/linear-progress";
  import Radio from "@smui/radio";
  import Textfield from "@smui/textfield";
  import { storedUser } from "../../store/user.js";
  import { callMetricsGetSummaryApi } from "../../integration/metrics-apis.js";
  import { handleAnyError } from "../../lib/error-handling.js";
  // Other imports
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
    showAlert,
    showConfirmation,
  } from "../../store/ui.js";
  import { storedSettings } from "../../store/settings.js";
  import { performUserLogout } from "../../lib/session.js";

  const hardWipeClicked = () => {
    setTimeout(async () => {
      try {
        await performUserLogout({ navigateToDashboard: false });
      } catch (_) {
        ("pass");
      }

      localStorage.clear();

      // @ts-expect-error
      window.location.reload(true);
    }, 1);
  };
</script>

<div class="nk-page settings">
  <div class="nk-page--inner-wrapper--standard">
    <div class="section">
      <div class="title">Upload Mechanism</div>

      <div class="upload-method">
        <FormField>
          <Radio
            bind:group={$storedSettings.uploadMechanism}
            value={"basic"}
            touch
          />
          <span slot="label">Basic</span>
        </FormField>
        <FormField>
          <Radio
            bind:group={$storedSettings.uploadMechanism}
            value={"stream"}
            touch
          />
          <span slot="label">Streaming</span>
        </FormField>
        <FormField>
          <Radio
            bind:group={$storedSettings.uploadMechanism}
            value={"chunkedStream"}
            touch
          />
          <span slot="label">Quantized Streams (Multi-request)</span>
        </FormField>
      </div>
    </div>

    <div class="section">
      <div class="title">Download Mechanism</div>

      <div class="download-method">
        <FormField>
          <Radio
            bind:group={$storedSettings.downloadMechanism}
            value={"basic"}
            touch
          />
          <span slot="label">Basic</span>
        </FormField>
        <FormField>
          <Radio
            bind:group={$storedSettings.downloadMechanism}
            value={"stream"}
            touch
          />
          <span slot="label">Streaming</span>
        </FormField>
        <FormField>
          <Radio
            bind:group={$storedSettings.downloadMechanism}
            value={"fs"}
            touch
          />
          <span slot="label">Direct File System</span>
        </FormField>
      </div>
    </div>

    <div class="section">
      <div class="title">Plain Text Editor</div>
      <FormField>
        <Checkbox
          bind:checked={$storedSettings.plainTextEditorNoRestrictions}
        />
        <span slot="label">Allow opening all (potentially unsupported) files with plain text editor.</span>
      </FormField>
    </div>

    <div class="section">
      <div class="title">Wipe AppData on Device</div>
      <div style="margin-top: 4px; margin-bottom: 4px; padding: 4px">
        You can delete all AppData on this Device by clicking the button below.
        No data on the server will be altered.
      </div>
      <Button
        class="hard-wipe-button"
        variant="outlined"
        on:click={() => hardWipeClicked()}
      >
        <Label>Hard wipe app data</Label>
      </Button>
    </div>
  </div>
</div>

<style>
  .settings {
  }

  .section {
    margin-bottom: 6px;
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
  }

  .section .item .value {
    flex: 2;
  }
</style>
