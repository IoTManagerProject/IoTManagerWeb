<script>
  /**
   * input-date widget: date/time/datetime with timePrecision h/hm/hms (same spec as app WidgetInputDate).
   * Status format: date DD.MM.YYYY, time HH | HH:mm | HH:mm:ss, datetime DD.MM.YYYY HH[:mm][:ss].
   */
  export let widget;
  export let wsPush = (ws, topic, status) => {};

  $: mode = (widget.mode || widget.type || "date").toString().toLowerCase();
  $: rawPrecision = widget.timePrecision || widget.precision || "hm";
  $: timePrecision = ["h", "hm", "hms"].includes(String(rawPrecision).toLowerCase()) ? String(rawPrecision).toLowerCase() : "hm";

  // Bind value for native date input (yyyy-mm-dd)
  let dateInputValue = "";
  // Bind value for native time input (HH:mm or HH:mm:ss)
  let timeInputValue = "";

  function dmyToYmd(s) {
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(s || "").trim());
    if (!m) return "";
    return `${m[3]}-${m[2]}-${m[1]}`;
  }
  function ymdToDmy(s) {
    if (!s || s.length < 10) return "";
    const [y, mo, d] = s.split("-");
    return `${d}.${mo}.${y}`;
  }
  function timeToInput(s) {
    const t = String(s || "").trim();
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
    if (/^\d{2}:\d{2}$/.test(t)) return t;
    if (/^\d{1,2}$/.test(t)) return `${t.padStart(2, "0")}:00`;
    return "";
  }
  function inputTimeToStatus(s) {
    if (timePrecision === "h") return s ? s.slice(0, 2) : "00";
    if (timePrecision === "hms") return s && s.length >= 8 ? s : (s || "00:00") + ":00";
    return s || "00:00";
  }

  $: if (widget && widget.status !== undefined) {
    const v = String(widget.status).trim();
    if (mode === "date") {
      dateInputValue = dmyToYmd(v) || "";
    } else if (mode === "time") {
      timeInputValue = timeToInput(v);
    } else {
      const space = v.indexOf(" ");
      if (space > 0) {
        dateInputValue = dmyToYmd(v.slice(0, space));
        timeInputValue = timeToInput(v.slice(space + 1));
      }
    }
  }

  function commitDate() {
    const dmy = ymdToDmy(dateInputValue);
    if (mode === "date") {
      widget.status = dmy || "01.01.2025";
      widget.sent = true;
      wsPush(widget.ws, widget.topic, widget.status);
    }
  }
  function commitTime() {
    const t = inputTimeToStatus(timeInputValue);
    if (mode === "time") {
      widget.status = t;
      widget.sent = true;
      wsPush(widget.ws, widget.topic, widget.status);
    }
  }
  function commitDatetime() {
    const dmy = ymdToDmy(dateInputValue);
    const t = inputTimeToStatus(timeInputValue);
    widget.status = `${dmy || "01.01.2025"} ${t}`;
    widget.sent = true;
    wsPush(widget.ws, widget.topic, widget.status);
  }
</script>

<div class="crd-itm-psn">
  <div class="w-2/3">
    <p class="pr-4 truncate text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold">{widget.descr || "Date"}</p>
  </div>
  <div class="flex justify-end w-1/3 flex-nowrap gap-1 items-center">
    {#if mode === "date"}
      <input
        class={widget.sent ? "ipt-rnd text-right border-red-500" : "ipt-rnd text-right focus:border-indigo-500"}
        type="date"
        bind:value={dateInputValue}
        on:change={commitDate}
      />
    {:else if mode === "time"}
      <input
        class={widget.sent ? "ipt-rnd text-right border-red-500" : "ipt-rnd text-right focus:border-indigo-500"}
        type="time"
        step={timePrecision === "hms" ? 1 : 60}
        bind:value={timeInputValue}
        on:change={commitTime}
      />
    {:else}
      <input
        class="shrink-0 max-w-[8.5rem] {widget.sent ? 'ipt-rnd text-right border-red-500' : 'ipt-rnd text-right focus:border-indigo-500'}"
        type="date"
        bind:value={dateInputValue}
        on:change={commitDatetime}
      />
      <input
        class="shrink-0 max-w-[6rem] {widget.sent ? 'ipt-rnd text-right border-red-500' : 'ipt-rnd text-right focus:border-indigo-500'}"
        type="time"
        step={timePrecision === "hms" ? 1 : 60}
        bind:value={timeInputValue}
        on:change={commitDatetime}
      />
    {/if}
  </div>
</div>
