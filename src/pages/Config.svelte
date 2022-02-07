<script>
  import Card from "../components/Card.svelte";

  export let configJson;
  export let widgetsJson;
  export let itemsJson;

  let itemsJsonBind = 0;
  let debug = true;

  export let saveConfig = () => {};

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
</script>

<!--{#if itemsJsonParced && widgetsJsonParced && configJsonParced && settingsJsonParced}-->
<div class="grd-1cols">
  <Card>
    <div class="grd-2colsfx">
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
        <tr class="tbl-txt-sz tbl-txt-p">
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
          <tr class="tbl-txt-sz tbl-txt-p">
            <td class="tbl-bdy">{element.subtype}</td>
            <td class="tbl-bdy"><input bind:value={element.id} class="tbl-ipt w-full" type="text" /></td>
            <td class="tbl-bdy"
              ><select bind:value={element.widget} class="tbl-ipt w-full">
                {#each widgetsJson as select}
                  <option value={select.name}>
                    {select.label}
                  </option>
                {/each}
              </select></td>
            <td class="tbl-bdy"><input bind:value={element.page} class="tbl-ipt w-full" type="text" /></td>
            <td class="tbl-bdy"><input bind:value={element.descr} class="tbl-ipt w-full" type="text" /></td>
            <td class="tbl-bdy"><svg on:click={() => (hideAllSubParams = !hideAllSubParams)} class="h-6 w-6 text-green-400 cursor-pointer" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"> <path stroke="none" d="M0 0h24v24H0z" /> <circle cx="5" cy="12" r="1" /> <circle cx="12" cy="12" r="1" /> <circle cx="19" cy="12" r="1" /></svg></td>
            <td class="tbl-bdy"><svg on:click={() => deleteLineFromConfig(i)} class="h-6 w-6 text-red-400 cursor-pointer" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <line x1="18" y1="6" x2="6" y2="18" /> <line x1="6" y1="6" x2="18" y2="18" /></svg></td>
          </tr>
          {#if !hideAllSubParams}
            {#each Object.entries(element) as [key, param]}
              {#if key != "type" && key != "subtype" && key != "id" && key != "widget" && key != "page" && key != "descr"}
                <tr class="tbl-txt-sz tbl-txt-p">
                  <td />
                  <td />
                  <td />
                  <td class="tbl-s-bdy text-right">
                    <p class="tbl-s-txt">{key}</p>
                  </td>
                  <td class="tbl-s-bdy text-center">
                    <input bind:value={element[key]} class="tbl-s-ipt w-full" type="text" />
                  </td>
                </tr>
              {/if}
            {/each}
            <!--<br />-->
          {/if}
        {/each}
      </tbody>
    </table>
    <button class="btn-lg" on:click={() => saveConfig()}>{"Сохранить"}</button>
  </Card>
</div>
<!--{:else if !itemsJsonParced && !widgetsJsonParced && !configJsonParced && !settingsJsonParced}-->
<!--<div class="flex justify-center items-center">-->
<!--<div style="border-top-color:transparent" class="w-20 h-20 border-4 border-blue-400 border-solid rounded-full animate-spin" />-->
<!--</div>-->
<!--{/if}-->
