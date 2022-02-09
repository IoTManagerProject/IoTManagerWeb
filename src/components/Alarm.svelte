<script>
  import CrossIcon from "../svg/Cross.svelte";
  export let title;
  export let showCloseBtn = true;
  export let close = () => {};
</script>

<div class="alm">
  {#if title}
    <div class="flex items-center">
      <div class="w-11/12">
        <h1 class="alm-hdr">{title}</h1>
      </div>
      <div class="flex justify-end w-1/12">
        {#if showCloseBtn}
          <CrossIcon click={() => close()} />
        {/if}
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
    .alm {
      @apply mb-2 w-full p-2 sm:p-2 md:p-2 lg:p-2 xl:px-4 xl:py-2 2xl:px-4 2xl:py-2 bg-white shadow-md lg:shadow-lg border border-gray-200 rounded-lg;
    }
    .alm-hdr {
      @apply text-center text-base text-red-500 pb-0;
    }
  }
</style>
