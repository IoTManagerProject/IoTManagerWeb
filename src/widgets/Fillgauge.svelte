<script>
  /**
   * Fill gauge (liquid/level style). Read-only. status within min..max.
   * Round circle with wave animation on fill top edge (same as app).
   */
  import { onMount, onDestroy } from 'svelte';

  export let widget;

  const SIZE = 120;
  const STROKE = 4;
  const WAVE_AMPLITUDE = 4;
  const WAVE_FREQUENCY = 0.08;
  const WAVE_POINTS = 40;
  const WAVE_ANIMATION_MS = 80;

  let phase = 0;
  let animationId = 0;
  const clipId = 'fillgauge-clip-' + (widget.topic || widget.ws || '').toString().replace(/[^a-z0-9]/gi, '') + '-' + Math.random().toString(36).slice(2);

  function buildWavePath(fillRatio, phaseVal, cx, cy, innerR, amplitude) {
    const bottomY = cy + innerR;
    const topY = cy + innerR - 2 * innerR * fillRatio;
    const leftX = cx - innerR;
    const rightX = cx + innerR;
    const waveY = (x) => topY + amplitude * Math.sin((x - cx) * WAVE_FREQUENCY + phaseVal);
    let d = `M ${leftX} ${bottomY} L ${leftX} ${waveY(leftX)}`;
    for (let i = 1; i <= WAVE_POINTS; i++) {
      const x = leftX + (rightX - leftX) * (i / WAVE_POINTS);
      d += ` L ${x} ${waveY(x)}`;
    }
    d += ` L ${rightX} ${bottomY} Z`;
    return d;
  }

  $: numStatus = Number(widget.status);
  $: numMin = Number(widget.min) ?? 0;
  $: numMax = Number(widget.max) ?? 100;
  $: safeMax = numMax <= numMin ? numMin + 1 : numMax;
  $: value = Math.max(0, Math.min(1, (numStatus - numMin) / (safeMax - numMin)));
  $: pct = Math.round(value * 100);
  $: fillColor = widget.color || '#3b82f6';

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = (SIZE - STROKE) / 2;
  const innerR = r - STROKE / 2;
  const amplitude = Math.max(1, WAVE_AMPLITUDE);

  $: wavePath = buildWavePath(value, phase, cx, cy, innerR, amplitude);

  onMount(() => {
    animationId = setInterval(() => {
      phase = (phase + 0.15) % (Math.PI * 2);
    }, WAVE_ANIMATION_MS);
  });

  onDestroy(() => {
    if (animationId) clearInterval(animationId);
  });
</script>

<div class="crd-itm-psn flex flex-col items-center h-auto mb-4">
  <p class="w-full text-center truncate text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold mb-2">{!widget.descr ? "" : widget.descr}</p>
  <!-- Round gauge with wave (same as app: SVG circle + clipped wave path) -->
  <div class="relative" style="width: {SIZE}px; height: {SIZE}px;">
    <svg width={SIZE} height={SIZE} viewBox="0 0 {SIZE} {SIZE}" class="absolute inset-0">
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={innerR} />
        </clipPath>
      </defs>
      <!-- Circle border and empty fill -->
      <circle cx={cx} cy={cy} r={r} stroke="#e5e7eb" stroke-width={STROKE} fill="#f3f4f6" />
      <!-- Wave fill clipped to circle -->
      <g clip-path={"url(#" + clipId + ")"}>
        <path d={wavePath} fill={fillColor} />
      </g>
    </svg>
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span class="text-lg font-bold text-gray-700">{widget.before || ""}{numStatus}{widget.after || ""}</span>
    </div>
  </div>
</div>
