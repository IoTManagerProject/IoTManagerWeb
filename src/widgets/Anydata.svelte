<script>
  export let widget;
  export let value;
  value = value;
</script>

<div class="crd-itm-psn">
  <div class="wgt-dscr-w">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="wgt-dscr-stl">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="wgt-w">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="wgt-adt-stl">{!widget.status ? "" : widget.status}</label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="wgt-adt-stl">&nbsp;{!widget.after ? "" : widget.after}</label>
  </div>
</div>
