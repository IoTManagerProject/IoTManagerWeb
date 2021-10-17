<script context="module">
  import { WSpush } from "../App.svelte";
</script>

<script>
  export let widget;
  export let value;
</script>

<div class="card-items">
  <div class="md:w-2/3 lg:w-2/3 2xl:w-2/3">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="widget-descr-gray-left">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="md:w-1/3 lg:w-1/3 2xl:w-1/3">
    {#if widget.type == "number"}
      <input on:change={WSpush(widget.ws, widget.topic, widget.status)} bind:value class="widget-input-indigo text-right" step="0.1" type="number" />
    {/if}
    {#if widget.type == "text"}
      <input on:change={WSpush(widget.ws, widget.topic, widget.status)} bind:value class="widget-input-indigo text-right" type="text" />
    {/if}
    {#if widget.type == "date"}
      <input on:change={WSpush(widget.ws, widget.topic, widget.status)} bind:value class="widget-input-indigo text-right" type="date" />
    {/if}
    {#if widget.type == "time"}
      <input on:change={WSpush(widget.ws, widget.topic, widget.status)} bind:value class="widget-input-indigo text-right" type="time" />
    {/if}
  </div>
</div>
