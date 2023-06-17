<script>
  export let widget;
  export let wsPush = (ws, topic, status) => {};

  function map(val, in_min, in_max, out_min, out_max) {
    return Math.round(((val - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min);
  }

  $: widget.status, calc();

  let minForMCU = widget.min;
  let maxForMCU = widget.max;

  let valueForUser;

  function calc() {
    valueForUser = Math.round(widget.status);
    //если коэффициент масштабирования присутствует
    if (widget.k) {
      if (widget.k !== 0) {
        //тогда приведем диапазоны
        minForMCU = widget.min / widget.k;
        maxForMCU = widget.max / widget.k;
        valueForUser = map(widget.status, minForMCU, maxForMCU, widget.min, widget.max);
      }
    }
  }
</script>

<!--ползунок работает в режиме для микроконтроллера-->
<div class="text-center">
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="pr-4 text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold">{!widget.descr ? "" : widget.descr} {valueForUser} {widget.after} </label>
</div>
<input
  bind:value={widget.status}
  on:change={() => ((widget.sent = true), wsPush(widget.ws, widget.topic, widget.status))}
  class="form-range range-secondary w-full h-2 p-0 rounded-lg {widget.sent ? 'bg-red-300' : 'bg-gray-300'} 
  focus:outline-none appearance-none"
  type="range"
  min={minForMCU}
  max={maxForMCU} />
