<script>
  export let widget;
  export let wsPush = (ws, topic, status) => {};
  export let val = 0;

  function map(val, in_min, in_max, out_min, out_max) {
    return Math.round(((val - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min);
  }

  $: widget.status, calc();

  function calc() {
    val = map(widget.status, 0, 1024, widget.min, widget.max);
  }
</script>

<!--<div class="text-center">-->
<!-- svelte-ignore a11y-label-has-associated-control -->
<label class="wgt-dscr-stl">{!widget.descr ? "" : widget.descr} {val} {widget.after}</label>
<!--</div>-->
<input
  bind:value={widget.status}
  on:change={() => ((widget.sent = true), wsPush(widget.ws, widget.topic, widget.status))}
  class="form-range range-secondary w-full h-2 p-0 rounded-lg {widget.sent ? 'bg-red-300' : 'bg-gray-300'} 
  focus:outline-none appearance-none"
  type="range"
  min="0"
  max="1024" />
