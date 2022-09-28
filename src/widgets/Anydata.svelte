<script>
  export let widget;
  export let value;
  value = value;

  $: widget.status, blink();

  let prevStatus;

  let green = false;

  function blink() {
    if (widget.status) {
      if (widget.status != prevStatus) {
        setTimeout(stopBlink, 500);
        green = true;
      }
      prevStatus = widget.status;
    }
  }

  function stopBlink() {
    green = false;
  }
</script>

<div class="crd-itm-psn">
  <div class="w-2/3">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="wgt-dscr-stl">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="flex justify-end w-1/3">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="wgt-adt-stl {green ? 'text-green-500' : ''}">{!widget.status ? "" : widget.status}</label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="wgt-adt-stl {green ? 'text-green-500' : ''}">&nbsp;{!widget.after ? "" : widget.after}</label>
  </div>
</div>
