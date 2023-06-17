<script>
  export let widget;
  export let value;
  value = value;

  $: widget.status, blink(), colorSet();

  let prevStatus;

  let green = false;

  function blink() {
    if (widget.status) {
      if (widget.status != prevStatus) {
        setTimeout(stopBlink, 300);
        green = true;
      }
      prevStatus = widget.status;
    }
  }

  function stopBlink() {
    green = false;
  }

  let setedColor;

  function colorSet() {
    if (widget.color) {
      if (widget.color.length > 1) {
        for (let i = 0; i < widget.color.length; i++) {
          if (i > 0) {
            if (widget.status > widget.color[i - 1].level && widget.status < widget.color[i].level) {
              setedColor = widget.color[i].value;
              console.log("[i]", "color: " + setedColor);
              return;
            }
          }
        }
      }
    }
  }
</script>

<div class="crd-itm-psn">
  <div class="w-2/3">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="pr-4 text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="flex justify-end w-1/3">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="wgt-adt-stl text-{setedColor}-500 {green ? 'text-green-500' : ''}">{!widget.status ? "" : widget.status}</label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="wgt-adt-stl text-{setedColor}-500 {green ? 'text-green-500' : ''}">&nbsp;{!widget.after ? "" : widget.after}</label>
  </div>
</div>
