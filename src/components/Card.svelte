<script>
  export let title;
</script>

<div class="card">
  {#if title}
    <h1 class="card-header">{title}</h1>
  {/if}
  <slot />
</div>
