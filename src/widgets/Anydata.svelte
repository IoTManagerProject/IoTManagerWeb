<script>
  export let widget;
  export let value;
  value = value;
</script>

<div class="card-items-psn">
  <div class="widget-descr-width">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="widget-descr-style">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="widget-width">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="widget-anydata-style">{!widget.status ? "" : widget.status}</label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="widget-anydata-style">&nbsp;{!widget.after ? "" : widget.after}</label>
  </div>
</div>
