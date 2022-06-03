<script lang="ts">
  import logo from "./asset/logo-512-sqr.png";
  import Example from "./lib/Example.svelte";
</script>

<main>
  <img src={logo} alt="logo-512-sqr" />
  <h1>Test</h1>
  <Example />
</main>

<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
</style>
