<script>
  /**
   * Linear progress bar. Read-only; displays status within min..max.
   * No wsPush (display only).
   */
  export let widget;

  $: numStatus = Number(widget.status);
  $: numMin = Number(widget.min) ?? 0;
  $: numMax = Number(widget.max) ?? 100;
  $: safeMax = numMax <= numMin ? numMin + 1 : numMax;
  $: value = Math.max(0, Math.min(1, (numStatus - numMin) / (safeMax - numMin)));
  $: pct = Math.round(value * 100);
</script>

<div class="crd-itm-psn flex flex-col items-stretch h-auto mb-4">
  <p class="pr-4 truncate text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold">{!widget.descr ? "" : widget.descr}</p>
  <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
    <div
      class="h-full bg-indigo-500 rounded-full transition-all duration-300"
      style="width: {pct}%"
      role="progressbar"
      aria-valuenow={numStatus}
      aria-valuemin={numMin}
      aria-valuemax={safeMax}
    ></div>
  </div>
  <p class="text-sm text-gray-500 mt-1">{widget.before || ""}{numStatus} / {safeMax}{widget.after || ""}</p>
</div>
