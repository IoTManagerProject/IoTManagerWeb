<script>
  import Card from "../components/Card.svelte";
  import CrossIcon from "../svg/Cross.svelte";
  import OpenIcon from "../svg/Open.svelte";
  import Alarm from "../components/Alarm.svelte";

  export let configJson;
  export let widgetsJson;
  export let itemsJson;
  export let scenarioJson;

  export let show;

  let itemsJsonBind = 0;
  let debug = true;

  export let saveConfig = () => {};
  export let rebootEsp = () => {};
  //export let cleanLogs = () => {};

  let exportJson = {};

  function elementsDropdownChange() {
    for (let i = 0; i < itemsJson.length; i++) {
      let item = Object.assign({}, itemsJson[i]);
      if (itemsJsonBind === item.num) {
        delete item.num;
        delete item.name;
        item.id = item.id + randomInteger(0, 100);
        configJson.push(item);
        configJson = configJson;
        itemsJsonBind = 0;
        if (debug) console.log("[i]", "item added");
        break;
      }
    }
  }

  function randomInteger(min, max) {
    // получить случайное число от (min-0.5) до (max+0.5)
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
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

  // Function to download data to a file
  function download(data, filename, type) {
    var file = new Blob([data], { type: type });
    if (window.navigator.msSaveOrOpenBlob)
      // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    else {
      // Others
      var a = document.createElement("a"),
        url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  }

  const syntaxHighlight = (json) => {
    try {
      json = JSON.stringify(JSON.parse(json), null, 4);
    } catch (e) {
      return json;
    }
    json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    json = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      return match;
    });
    return json;
  };

  function createExportFile() {
    exportJson.mark = "iotm";
    exportJson.config = configJson;
    exportJson.scenario = scenarioJson;
    //exportJson.settings = settingsJson;
  }

  let template = null;
  let files = null;

  const alertErr = "Файл не является файлом конфигурации";
  const alertOk = "Применить конфигурацию?\nне забудьте нажать кнопку 'сохранить'";

  $: if (files) {
    const fileText = files[0].text();
    fileText.then((text) => {
      template = text;
      if (IsJsonParse(template)) {
        let json = JSON.parse(template);
        if (json.mark === "iotm") {
          if (window.confirm(alertOk)) {
            configJson = [];
            scenarioJson = {};
            configJson = json.config;
            scenarioJson = json.scenario;
            configJson = configJson;
            scenarioJson = scenarioJson;

            console.log(JSON.stringify(configJson));
          }
        } else {
          window.alert(alertErr);
        }
      } else {
        window.alert(alertErr);
      }
    });
    files = null;
  }

  function reset() {
    files = null;
    document.getElementById("formFile").value = "";
  }

  function IsJsonParse(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      if (debug) console.log("[e]", "json parce error: ", str);
      return false;
    }
    return true;
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
              <td class="tbl-bdy-lg"><OpenIcon click={() => (element.show = !element.show)} /></td>
              <td class="tbl-bdy-lg"><CrossIcon click={() => deleteLineFromConfig(i)} /></td>
            </tr>
            {#if element.show}
              {#each Object.entries(element) as [key, param]}
                {#if key != "type" && key != "subtype" && key != "id" && key != "widget" && key != "page" && key != "descr" && key != "show"}
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
      <textarea bind:value={scenarioJson.scen} rows={height} class="px-2 bg-gray-50 border-2 border-gray-200 rounded text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 w-full" />
    </Card>
  </div>
  <div class="grd-1col1">
    <Card>
      <div class="grd-2col1">
        <button class="btn-lg" on:click={() => saveConfig()}>{"Сохранить"}</button>
        <button class="btn-lg" on:click={() => rebootEsp()}>{"Перезагрузить"}</button>
        <button class="btn-lg" on:click={() => (createExportFile(), download(syntaxHighlight(JSON.stringify(exportJson)), "export.json", "application/json"))}>{"Сохранить конфигурацию"}</button>
        <label on:click={() => reset()} class="btn-lg cursor-pointer select-none">
          <input bind:files accept="application/JSON" type="file" id="formFile" />
          {"Загрузить конфигурацию"}
        </label>
      </div>
    </Card>
  </div>
{:else}
  <Alarm title="Загрузка..." />
{/if}
