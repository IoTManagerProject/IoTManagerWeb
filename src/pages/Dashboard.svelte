<script>
  import Card from "../components/Card.svelte";
  import Input from "../widgets/Input.svelte";
  import Range from "../widgets/Range.svelte";
  import Chart from "../widgets/Chart.svelte";
  import Toggle from "../widgets/Toggle.svelte";
  import Anydata from "../widgets/Anydata.svelte";
  import Alarm from "../components/Alarm.svelte";

  export let layoutJson;
  export let pages;

  export let show;

  export let wsPush = (ws, topic, status) => {};
</script>

{#if show}
  <div class="grd-1col1">
    {#if layoutJson === []}
      <Card title={"Ваша панель управления пуста, вначале добавьте новые элементы в конфигураторе!"} />
    {/if}
    {#each pages as pagesName, p}
      <Card title={pagesName.page}>
        {#each layoutJson as widget, l}
          {#if widget.page === pagesName.page}
            {#if widget.widget === "input"}
              <Input bind:value={widget.status} widget={widget} wsPush={(ws, topic, status) => wsPush(ws, topic, status)} />
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
              <Chart bind:value={widget.status} widget={widget} />
            {/if}
          {/if}
        {/each}
      </Card>
    {/each}
  </div>
{:else}
  <Alarm title="Загрузка..." />
{/if}
