<script>
  import Card from "../components/Card.svelte";
  import Input from "../widgets/Input.svelte";
  import InputNumber from "../widgets/InputNumber.svelte";
  import InputDate from "../widgets/InputDate.svelte";
  import Range from "../widgets/Range.svelte";
  import Chart from "../widgets/Chart.svelte";
  import Toggle from "../widgets/Toggle.svelte";
  import Anydata from "../widgets/Anydata.svelte";
  import Btn from "../widgets/Btn.svelte";
  import ProgressLine from "../widgets/ProgressLine.svelte";
  import ProgressRound from "../widgets/ProgressRound.svelte";
  import Select from "../widgets/Select.svelte";
  import Doughnut from "../widgets/Doughnut.svelte";
  import Fillgauge from "../widgets/Fillgauge.svelte";
  import Alarm from "../components/Alarm.svelte";

  export let layoutJson;

  $: layoutJson.length, timeOut();

  let empty = false;

  function timeOut() {
    empty = false;
    setTimeout(timeIsOut, 3000);
  }

  export let pages;

  export let show;

  export let wsPush = (ws, topic, status) => {};

  function timeIsOut() {
    if (layoutJson.length === 0) {
      empty = true;
    }
  }
</script>

{#if show}
  <div class="my-4">
    <div class="grd-1col1 animate-pulse">
      {#if empty}
        <Card title={"Ваша панель управления пуста, вначале добавьте новые элементы в конфигураторе!"} />
      {/if}
    </div>

    <div class="grd-3col1">
      {#each pages as pagesName, p}
        <Card title={pagesName.page}>
          {#each layoutJson as widget, l}
            {#if widget.page === pagesName.page}
              {#if widget.widget === "input"}
                <Input bind:value={widget.status} widget={widget} wsPush={(ws, topic, status) => wsPush(ws, topic, status)} />
              {/if}
              {#if widget.widget === "input-number"}
                <InputNumber widget={widget} wsPush={(ws, topic, status) => wsPush(ws, topic, status)} />
              {/if}
              {#if widget.widget === "input-date"}
                <InputDate widget={widget} wsPush={(ws, topic, status) => wsPush(ws, topic, status)} />
              {/if}
              {#if widget.widget === "toggle"}
                <Toggle bind:value={widget.status} widget={widget} wsPush={(ws, topic, status) => wsPush(ws, topic, status)} />
              {/if}
              {#if widget.widget === "anydata"}
                <Anydata bind:value={widget.status} widget={widget} />
              {/if}
              {#if widget.widget === "range"}
                <Range bind:value={widget.status} widget={widget} wsPush={(ws, topic, status) => wsPush(ws, topic, status)} />
              {/if}
              {#if widget.widget === "chart"}
                <Chart widget={widget} />
              {/if}
              {#if widget.widget === "btn"}
                <Btn widget={widget} wsPush={(ws, topic, status) => wsPush(ws, topic, status)} />
              {/if}
              {#if widget.widget === "progress-line"}
                <ProgressLine widget={widget} />
              {/if}
              {#if widget.widget === "progress-round"}
                <ProgressRound widget={widget} />
              {/if}
              {#if widget.widget === "select"}
                <Select widget={widget} wsPush={(ws, topic, status) => wsPush(ws, topic, status)} />
              {/if}
              {#if widget.widget === "doughnut"}
                <Doughnut widget={widget} />
              {/if}
              {#if widget.widget === "fillgauge"}
                <Fillgauge widget={widget} />
              {/if}
            {/if}
          {/each}
        </Card>
      {/each}
    </div>
  </div>
{:else}
  <Alarm title="Загрузка..." />
{/if}
