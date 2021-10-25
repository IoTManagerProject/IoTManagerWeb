<script context="module">
  import { WSpush } from "../App.svelte";
</script>

<script>
  export let widget;
</script>

<div class="card-items-psn-inline">
  <div class="widget-descr-width-inline">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="widget-descr-style">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="widget-width-inline">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="widget-anydata-style">{!widget.status ? "" : widget.status}</label>
  </div>
</div>
