<script>
  export let title = false;
  export let show = true;
</script>

{#if show}
  <div class="crd">
    {#if title}
      <h1 class="crd-hdr">{title}</h1>
    {/if}
    <slot />
  </div>
{/if}

<style lang="postcss" global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer components {
    .crd {
      @apply w-full mt-4 p-2 sm:p-2 md:p-2 lg:p-2 xl:px-4 xl:py-4 2xl:px-4 2xl:py-4 bg-white shadow-md lg:shadow-lg border border-gray-200 rounded-lg;
    }
    .crd-hdr {
      @apply text-center text-lg text-gray-500 font-bold pb-2;
    }
  }
</style>
