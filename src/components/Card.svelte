<script>
  export let title;
</script>

<div class="crd">
  {#if title}
    <h1 class="crd-hdr">{title}</h1>
  {/if}
  <slot />
</div>

<style lang="postcss" global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer components {
    .crd {
      @apply w-full p-2 sm:p-2 md:p-2 lg:p-2 xl:px-8 xl:py-4 2xl:px-8 2xl:py-4 bg-white rounded-lg shadow-md lg:shadow-lg border border-gray-100;
    }
    .crd-hdr {
      @apply text-center text-lg text-gray-500 font-bold pb-4;
    }
  }
</style>
