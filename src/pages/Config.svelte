<script>
  import Card from "../components/Card.svelte";
  import CrossIcon from "../svg/Cross.svelte";
  import OpenIcon from "../svg/Open.svelte";
  import Alarm from "../components/Alarm.svelte";

  export let configJson;
  export let widgetsJson;
  export let itemsJson;

  export let show;

  export let scenarioJson;

  let itemsJsonBind = 0;
  let debug = true;

  export let saveConfig = () => {};
  export let rebootEsp = () => {};

  let hideAllSubParams = true;

  function elementsDropdownChange() {
    for (let i = 0; i < itemsJson.length; i++) {
      let item = Object.assign({}, itemsJson[i]);
      if (itemsJsonBind === item.num) {
        delete item.num;
        delete item.name;
        configJson.push(item);
        configJson = configJson;
        itemsJsonBind = 0;
        if (debug) console.log("[i]", "item added");
        break;
      }
    }
  }

  function deleteLineFromConfig(num) {
    for (let i = 0; i < configJson.length; i++) {
      if (num === i) {
        configJson.splice(i, 1);
        configJson = configJson;
        if (debug) console.log("[i]", "item " + num + " deleted from config");
        break;
      }
    }
  }

  $: scenarioJson, windowHeight();
  let height;
  function windowHeight() {
    let scenStr = JSON.stringify(scenarioJson);
    height = scenStr.split("\\n").length;
  }
</script>

{#if show}
  <div class="grd-2col1">
    <Card title="Конфигуратор">
      <div class="grd-2col2">
        <select class="slct-lg" bind:value={itemsJsonBind} on:change={() => elementsDropdownChange()}>
          {#each itemsJson as item}
            {#if item.header}
              <optgroup label={item.header} />
            {/if}
            {#if !item.header}
              <option value={item.num}>
                {item.name}
              </option>
            {/if}
          {/each}
        </select>
        <select class="slct-lg"><option>{"Выберите пресет"}</option></select>
      </div>
      <table class="tbl">
        <thead class="bg-gray-100">
          <tr class="txt-sz txt-pad">
            <th class="tbl-hd">Тип</th>
            <th class="tbl-hd">Id</th>
            <th class="tbl-hd">Виджет</th>
            <th class="tbl-hd">Вкладка</th>
            <th class="tbl-hd">Название</th>
            <th class="tbl-hd w-7" />
            <th class="tbl-hd w-7" />
          </tr>
        </thead>
        <tbody class="bg-white">
          {#each configJson as element, i}
            <tr class="txt-sz txt-pad align-middle">
              <td class="tbl-bdy-lg">{element.subtype}</td>
              <td class="tbl-bdy-lg"><input bind:value={element.id} class="ipt-lg w-full" type="text" /></td>
              <td class="tbl-bdy-lg"
                ><select bind:value={element.widget} class="ipt-lg w-full">
                  {#each widgetsJson as select}
                    <option value={select.name}>
                      {select.label}
                    </option>
                  {/each}
                </select></td>
              <td class="tbl-bdy-lg"><input bind:value={element.page} class="ipt-lg w-full" type="text" /></td>
              <td class="tbl-bdy-lg"><input bind:value={element.descr} class="ipt-lg w-full" type="text" /></td>
              <td class="tbl-bdy-lg"><OpenIcon click={() => (hideAllSubParams = !hideAllSubParams)} /></td>
              <td class="tbl-bdy-lg"><CrossIcon click={() => deleteLineFromConfig(i)} /></td>
            </tr>
            {#if !hideAllSubParams}
              {#each Object.entries(element) as [key, param]}
                {#if key != "type" && key != "subtype" && key != "id" && key != "widget" && key != "page" && key != "descr"}
                  <tr class="txt-sz txt-pad">
                    <td />
                    <td />
                    <td />
                    <td class="tbl-bdy-sm text-right">
                      <p class="txt-ita">{key}</p>
                    </td>
                    <td class="tbl-bdy-sm text-center">
                      <input bind:value={element[key]} class="ipt-sm w-full" type="text" />
                    </td>
                  </tr>
                {/if}
              {/each}
              <!--<br />-->
            {/if}
          {/each}
        </tbody>
      </table>
    </Card>

    <Card title="Сценарии">
      <textarea bind:value={scenarioJson.scen} rows={height} cols="50" class="px-2 bg-gray-50 border-2 border-gray-200 rounded text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 w-full" />
    </Card>
  </div>
  <div class="grd-1col1">
    <Card>
      <div class="grd-2col1">
        <button class="btn-lg" on:click={() => saveConfig()}>{"Сохранить"}</button>
        <button class="btn-lg" on:click={() => rebootEsp()}>{"Перезагрузить"}</button>
      </div>
    </Card>
  </div>
{:else}
  <Alarm title="Загрузка..." />
{/if}
