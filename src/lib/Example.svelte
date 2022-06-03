<script lang="ts">
  import Button, { Label, Icon } from "@smui/button";
  import { CommonConstant } from "../constant/common-constants.js";

  const clicked = () => {
    console.log("Hi");
  };
</script>

<div>App version: {CommonConstant.APP_VERSION}</div>

<Button on:click={clicked}>
  <Icon class="material-icons">favorite</Icon>
  <Label>Example Button</Label>
</Button>

<style>
</style>
