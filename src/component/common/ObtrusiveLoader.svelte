<script lang="ts">
  import CircularProgress from "@smui/circular-progress";
  import Dialog, { Content } from "@smui/dialog";
  import { activeGlobalObtrusiveTaskCount } from "../../store/ui.js";

  let isOpen = false;
  activeGlobalObtrusiveTaskCount.subscribe((value) => {
    isOpen = value > 0;
  });
</script>

<Dialog
  bind:open={isOpen}
  scrimClickAction=""
  escapeKeyAction=""
  aria-labelledby="mandatory-title"
  aria-describedby="mandatory-content"
  surface$style="width: 64px; max-width: 64px; background-color: transparent !important; box-shadow: none;"
>
  <Content id="mandatory-content">
    <div style="display: flex; justify-content: center">
      <CircularProgress style="height: 32px; width: 32px;" indeterminate />
    </div>
    <!-- Note: The following has no function. It's just to suppress a strange mdc error -->
    <div tabindex="0" />
  </Content>
</Dialog>
