<script lang="ts">
  // UI / Framework
  import Button, { Icon, Label } from "@smui/button";
  // Other imports
  import { showAlert, showConfirmation } from "../../store/ui.js";

  const clicked = async () => {
    let ans = await showConfirmation("Example Title", "Example Text");
    await showAlert("Another Title", "Another Text");
  };
</script>

<div class="nk-page">
  DASHBOARD <br />

  <Button on:click={clicked}>
    <Icon class="material-icons">favorite</Icon>
    <Label>Example Button</Label>
  </Button>
</div>

<style>
</style>
