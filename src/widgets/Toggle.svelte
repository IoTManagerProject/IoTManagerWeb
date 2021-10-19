<script context="module">
  import { WSpush } from "../App.svelte";
</script>

<script>
  export let widget;
</script>

<div class="card-items">
  <div class="w-2/3">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="widget-descr-gray">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="w-1/3">
    <div class="flex items-center justify-center w-full">
      <label for={widget.topic} class="items-center cursor-pointer">
        <div class="relative">
          <input id={widget.topic} type="checkbox" class="sr-only" />
          <div class="block bg-gray-600 w-14 h-8 rounded-full" />
          <div class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition" />
        </div>
      </label>
    </div>
  </div>
</div>
