<script>
  export let widget;
  export let wsPush = (ws, topic, status) => {};
  //let newFormat;

  //$: widget.status, calc();

  function selectFromMarkerToMarker(str, tofind, number) {
    //if (str.indexOf(tofind) == -1) {
    //  return "not found";
    //}
    str += tofind;
    let i = 0;
    do {
      if (i == number) {
        return selectToMarker(str, tofind);
      }
      str = deleteBeforeDelimiter(str, tofind);
      i++;
    } while (str.length != 0);

    return "not found";
  }

  function selectToMarker(str, found) {
    let p = str.indexOf(found);
    return str.substring(0, p);
  }

  function deleteBeforeDelimiter(str, found) {
    let p = str.indexOf(found) + found.length;
    return str.substring(p);
  }

  let bindValue = "";

  //данная функция вызывается когда в вебе поменяли значение и его нужно отправить в сокеты
  //а также периписать в переменной виджета
  function changeFomatTo() {
    widget.status = selectFromMarkerToMarker(bindValue, "-", 2) + "." + selectFromMarkerToMarker(bindValue, "-", 1) + "." + selectFromMarkerToMarker(bindValue, "-", 0);
    wsPush(widget.ws, widget.topic, widget.status);
  }

  $: widget.status, changeFomatFrom();

  //данная функция вызывается когда кто то из вне переписал переменную widget
  function changeFomatFrom() {
    let value = widget.status;
    bindValue = selectFromMarkerToMarker(value, ".", 2) + "-" + selectFromMarkerToMarker(value, ".", 1) + "-" + selectFromMarkerToMarker(value, ".", 0);
  }
</script>

<div class="crd-itm-psn">
  <div class="w-2/3">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="pr-4 text-{widget.descrColor ? widget.descrColor : 'gray'}-500 font-bold">{!widget.descr ? "" : widget.descr}</label>
  </div>
  <div class="flex justify-end w-1/3">
    {#if widget.type == "number"}
      <input class={widget.sent ? "ipt-rnd text-right border-red-500" : "ipt-rnd text-right focus:border-indigo-500"} on:change={() => ((widget.sent = true), wsPush(widget.ws, widget.topic, widget.status))} bind:value={widget.status} step="0.1" type="number" />
    {/if}
    {#if widget.type == "text"}
      <input class={widget.sent ? "ipt-rnd text-right border-red-500" : "ipt-rnd text-right focus:border-indigo-500"} on:change={() => ((widget.sent = true), wsPush(widget.ws, widget.topic, widget.status))} bind:value={widget.status} type="text" />
    {/if}
    {#if widget.type == "date"}
      <input class={widget.sent ? "ipt-rnd text-right border-red-500" : "ipt-rnd text-right focus:border-indigo-500"} on:change={() => ((widget.sent = true), changeFomatTo())} bind:value={bindValue} type="date" />
    {/if}
    {#if widget.type == "time"}
      <input class={widget.sent ? "ipt-rnd text-right border-red-500" : "ipt-rnd text-right focus:border-indigo-500"} on:change={() => ((widget.sent = true), wsPush(widget.ws, widget.topic, widget.status))} bind:value={widget.status} type="time" />
    {/if}
  </div>
</div>
