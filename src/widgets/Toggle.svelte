<script context="module">
  import { WSpush } from "../App.svelte";
</script>

<script>
  export let widget;
</script>

<div class="card-items-psn-inline">
  <div class="widget-descr-width-2-3">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="widget-descr-style">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="widget-width-toggle">
    <label for={widget.topic} class="items-center cursor-pointer">
      <div class="relative">
        <input on:change={() => ((widget["send"] = true), WSpush(widget.ws, widget.topic, widget.status))} bind:value={widget.status} id={widget.topic} type="checkbox" class="sr-only" />
        <div class="block bg-gray-600 w-14 h-8 rounded-full" />
        <div class="dot {widget['send'] == true ? 'bg-red-400' : 'bg-white'} absolute left-1 top-1  w-6 h-6 rounded-full transition" />
      </div>
    </label>
  </div>
</div>
