<script>
  /**
   * Doughnut chart. Read-only. status = number (0..max); optional widget.color.
   */
  export let widget;

  $: numStatus = Number(widget.status);
  $: numMax = Number(widget.max) ?? 100;
  $: safeMax = numMax <= 0 ? 100 : numMax;
  $: value = Math.max(0, Math.min(1, numStatus / safeMax));
  $: stroke = widget.stroke ?? 12;
  $: r = 40;
  $: c = 2 * Math.PI * r;
  $: dash = value * c;
</script>

<div class="crd-itm-psn flex flex-col items-center h-auto mb-4">
  <p class="pr-4 truncate text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold">{!widget.descr ? "" : widget.descr}</p>
  <div class="relative inline-flex items-center justify-center" style="width: 90px; height: 90px;">
    <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" stroke-width={stroke} />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={widget.color || "#6366f1"}
        stroke-width={stroke}
        stroke-dasharray={c}
        stroke-dashoffset={c - dash}
        stroke-linecap="round"
        style="transition: stroke-dashoffset 0.3s ease;"
      />
    </svg>
    <span class="absolute text-gray-600 font-bold text-sm">{widget.before || ""}{numStatus}{widget.after || ""}</span>
  </div>
</div>
