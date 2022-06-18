<script lang="ts">
  import Button, { Label, Icon } from "@smui/button";
  import { showAlert, showConfirmation } from "../store/ui.js";
  const clicked = async () => {
    let ans = await showConfirmation("Example Title", "Example Text");
    await showAlert("Another Title", "Another Text");
  };
</script>

DASHBOARD <br />

<Button on:click={clicked}>
  <Icon class="material-icons">favorite</Icon>
  <Label>Example Button</Label>
</Button>

<style>
</style>
