<script>
  import CloudIcon from "../../svg/Cloud.svelte";

  export let deviceList = [];
  export let selectedWs = 0;
  export let showDropdown = true;
  export let socketConnected = false;
  export let devicesDropdownChange = () => {};
</script>

<header class="h-10 w-full bg-gray-100 overflow-auto shadow-md">
  <div class="flex content-center items-center justify-end">
    {#if showDropdown}
      <div class="px-15 py-1">
        <select class="border border-indigo-500 border-1" bind:value={selectedWs} on:change={() => devicesDropdownChange()}>
          {#each deviceList as device}
            <option value={device.ws}>
              {device.name}
            </option>
          {/each}
        </select>
      </div>
    {/if}
    <div class="pl-4 pr-4 py-1">
      <CloudIcon color={socketConnected === true ? "text-green-500" : "text-red-500"} />
    </div>
  </div>
</header>
