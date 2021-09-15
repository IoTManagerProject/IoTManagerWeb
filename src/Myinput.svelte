<script context="module">
  import { WSpush } from "./App.svelte";
</script>

<script>
  export let title;
  export let value;
  export let topic;
  export let ws;
  export let type;
</script>

<div class="container">
<<<<<<< HEAD
  <div class="card-items">
    <div class="md:w-6/12">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="widget-descr-gray-left">{!descr ? "" : descr}</label>
=======
  <div class="block-psn-center-when-md">
    <div class="md:w-1/2">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="descr-gray-left">{title}</label>
>>>>>>> parent of 37f43f0 (changes2)
    </div>
    <div class="md:w-1/2">
      <!-- on:change={WSpush(ws, topic, value)} -->
      {#if type == "number"}
        <input class="widget-input-indigo" on:change={WSpush(ws, topic, value)} bind:value type="number" />
      {/if}
      {#if type == "text"}
        <input class="widget-input-indigo" on:change={WSpush(ws, topic, value)} bind:value type="text" />
      {/if}
      {#if type == "date"}
        <input class="widget-input-indigo" on:change={WSpush(ws, topic, value)} bind:value type="date" />
      {/if}
      {#if type == "time"}
        <input class="widget-input-indigo" on:change={WSpush(ws, topic, value)} bind:value type="time" />
      {/if}
    </div>
<<<<<<< HEAD
    {#if after}
      <div class="md:1/12">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="widget-after">{!after ? "" : after}</label>
      </div>
    {/if}
=======
    <!-- <div class="md:w-3/3"> -->
    <!--  <button on:click={WSpush(ws, topic, value)} class="btn-indigo" type="button">Set</button> -->
    <!-- </div> -->
>>>>>>> parent of 37f43f0 (changes2)
  </div>
</div>
