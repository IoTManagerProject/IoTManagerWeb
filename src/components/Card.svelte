<script>
  export let title;
</script>

<div class="crd">
  {#if title}
    <h1 class="crd-hdr">{title}</h1>
  {/if}
  <slot />
</div>
