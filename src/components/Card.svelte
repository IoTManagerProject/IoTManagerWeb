<script>
  import CloudIcon from "../svg/Cloud.svelte";
  export let title;
  export let cloud = false;
  export let cloudColor;
</script>

<div class="crd">
  {#if title && !cloud}
    <h1 class="crd-hdr">{title}</h1>
  {:else if title && cloud}
    <div class="flex items-center">
      <div class="w-11/12">
        <h1 class="crd-hdr">{title}</h1>
      </div>
      <div class="flex justify-end w-1/12">
        <CloudIcon color={cloudColor} />
      </div>
    </div>
  {/if}
  <slot />
</div>

<style lang="postcss" global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer components {
    .crd {
      @apply w-full mb-2 p-2 sm:p-2 md:p-2 lg:p-2 xl:px-8 xl:py-4 2xl:px-8 2xl:py-4 bg-white shadow-md lg:shadow-lg border border-gray-200 rounded-lg;
    }
    .crd-hdr {
      @apply text-center text-lg text-gray-500 font-bold pb-4;
    }
  }
</style>
