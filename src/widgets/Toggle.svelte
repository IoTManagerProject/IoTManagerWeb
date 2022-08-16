<script>
  import App from "../App.svelte";
  export let widget;
  export let toggleState = false;
  export let wsPush = (ws, topic, status) => {};

  $: widget.status, setValue();

  function setValue() {
    if (widget.status == "1") {
      toggleState = true;
    } else if (widget.status == "0") {
      toggleState = false;
    }
  }

  function changeValue() {
    widget.sent = true;
    if (toggleState) {
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
        <input bind:checked={toggleState} on:change={() => (changeValue(), wsPush(widget.ws, widget.topic, widget.status))} id={widget.topic} type="checkbox" class="sr-only" />
        <div class="block {toggleState ? 'bg-blue-600' : 'bg-gray-600'} w-10 h-6 rounded-full shadow-lg" />
        <div class="dot {widget.sent ? 'bg-red-300' : 'bg-gray-100'} absolute left-1 top-1  w-4 h-4 rounded-full transition shadow-lg" />
      </div>
    </label>
  </div>
</div>
