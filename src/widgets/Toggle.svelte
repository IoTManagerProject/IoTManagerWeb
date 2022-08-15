<script>
  import App from "../App.svelte";
  import { onMount } from "svelte";
  onMount(async () => {
    setDefaultValue();
  });
  export let widget;

  export let wsPush = (ws, topic, status) => {};

  let st = false;

  function setDefaultValue() {
    if (widget.status == "1") {
      st = true;
    } else if (widget.status == "0") {
      st = false;
    }
  }

  function changeValue() {
    if (st) {
      widget.status = "1";
    } else {
      widget.status = "0";
    }
  }
</script>

<div class="crd-itm-psn">
  <div class="w-2/3">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="wgt-dscr-stl">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="flex justify-end w-1/3">
    <label for={widget.topic} class="items-center cursor-pointer">
      <div class="relative">
        <input bind:checked={st} on:change={() => (changeValue(), wsPush(widget.ws, widget.topic, widget.status))} id={widget.topic} type="checkbox" class="sr-only" />
        <div class="block bg-gray-600 w-10 h-6 rounded-full" />
        <div class="dot {widget['send'] == true ? 'bg-red-400' : 'bg-white'} absolute left-1 top-1  w-4 h-4 rounded-full transition" />
      </div>
    </label>
  </div>
</div>
