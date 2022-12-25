<script lang="ts">
  export let currentBucket = null;
  export let entityStack = null;
  export let breadcrumbClicked = null;
</script>

<div class="breadcrumb-container">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="breadcrumb breadcrumb-bucket"
    draggable="true"
    on:click={() => breadcrumbClicked(null)}
  >
    {currentBucket.name}
  </div>
  {#each entityStack.slice(1) as entity, i}
    <div class="breadcrumb-divider">&gt;</div>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="breadcrumb breadcrumb-directory"
      draggable="true"
      on:click={() => breadcrumbClicked(entity)}
    >
      {entity.directory.name}
    </div>
  {/each}
</div>

<style>
  .breadcrumb-container {
    background-color: rgb(206, 206, 206);
    font-size: 12px;
    padding-left: 4px;
  }

  .breadcrumb-divider {
    display: inline-block;
    color: rgb(128, 128, 128);
  }

  .breadcrumb {
    cursor: pointer;
    display: inline-block;
    margin: 8px 2px;
    color: #0275d8;
  }

  .breadcrumb:hover {
    text-decoration: underline;
  }

  .breadcrumb:last-child {
    color: rgb(126, 125, 125);
    text-decoration: none;
  }

  .breadcrumb-bucket {
    color: #0275d8;
  }
</style>
