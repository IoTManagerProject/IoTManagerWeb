<script>
  /**
   * input-number widget: int/float with min, max, step, decimals (same spec as app WidgetInputNumber).
   * Publishes value to topic/control (int: "123", float: "123.45").
   */
  export let widget;
  export let wsPush = (ws, topic, status) => {};

  $: mode = (widget.mode || widget.type || "int").toString().toLowerCase();
  $: isFloat = mode === "float";
  $: decimals = Math.max(0, Math.min(6, Math.trunc(Number(widget.decimals ?? widget.precision ?? 0) || 0)));
  $: min = Number(widget.min);
  $: max = Number(widget.max);
  $: step = Number(widget.step);
  $: numMin = Number.isFinite(min) ? min : (isFloat ? 0 : 0);
  $: numMax = Number.isFinite(max) ? max : (isFloat ? 100 : 100);
  $: stepVal = Number.isFinite(step) && step > 0 ? step : (isFloat ? Math.pow(10, -decimals) : 1);
  $: stepAttr = isFloat && decimals > 0 ? stepVal : Math.max(1, Math.trunc(stepVal));

  function onInputChange() {
    widget.sent = true;
    const v = Number(widget.status);
    const s = Number.isFinite(v)
      ? (isFloat && decimals >= 0 ? v.toFixed(decimals) : String(Math.trunc(v)))
      : (widget.status != null ? String(widget.status) : "");
    widget.status = s;
    wsPush(widget.ws, widget.topic, widget.status);
  }
</script>

<div class="crd-itm-psn">
  <div class="w-2/3">
    <p class="pr-4 truncate text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold">{widget.descr || "Number"}</p>
  </div>
  <div class="flex justify-end w-1/3">
    <input
      class={widget.sent ? "ipt-rnd text-right border-red-500" : "ipt-rnd text-right focus:border-indigo-500"}
      type="number"
      min={numMin}
      max={numMax}
      step={stepAttr}
      bind:value={widget.status}
      on:change={onInputChange}
    />
  </div>
</div>
