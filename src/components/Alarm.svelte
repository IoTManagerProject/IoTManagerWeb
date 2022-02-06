<script>
  export let title;
</script>

<div class="alm">
  {#if title}
    <h1 class="alm-hdr">{title}</h1>
  {/if}
  <slot />
</div>

<style lang="postcss" global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer components {
    .alm-hdr {
      @apply text-center text-base text-gray-500 font-bold pb-0;
    }
    .alm {
      @apply mb-4 w-full p-2 sm:p-2 md:p-2 lg:p-2 xl:px-4 xl:py-2 2xl:px-4 2xl:py-2 bg-red-100 shadow-md lg:shadow-lg border border-gray-300 rounded;
    }
  }
</style>
