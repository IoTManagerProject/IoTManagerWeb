<script>
  import Card from "../components/Card.svelte";
  import Alarm from "../components/Alarm.svelte";

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

  export let show;

  export let errorsJson;
  export let settingsJson;
  export let configJson;
  export let itemsJson;
  export let paramsJson;
  export let layoutJson;
</script>

{#if show}
  <div class="grd-3col1">
    <Card title="layoutJson">
      <textarea on:input={layoutJson} rows="23" class="w-full" id="1">{syntaxHighlight(JSON.stringify(layoutJson))}</textarea>
    </Card>
    <Card title="paramsJson">
      <textarea on:input={paramsJson} rows="23" class="w-full" id="4">{syntaxHighlight(JSON.stringify(paramsJson))}</textarea>
    </Card>
    <Card title="errorsJson">
      <textarea on:input={errorsJson} rows="23" class="w-full" id="2">{syntaxHighlight(JSON.stringify(errorsJson))}</textarea>
    </Card>
    <Card title="settingsJson">
      <textarea on:input={settingsJson} rows="23" class="w-full" id="3">{syntaxHighlight(JSON.stringify(settingsJson))}</textarea>
    </Card>
    <Card title="configJson">
      <textarea on:input={configJson} rows="23" class="w-full" id="3">{syntaxHighlight(JSON.stringify(configJson))}</textarea>
    </Card>
    <Card title="itemsJson">
      <textarea on:input={itemsJson} rows="23" class="w-full" id="4">{syntaxHighlight(JSON.stringify(itemsJson))}</textarea>
    </Card>
  </div>
{:else}
  <Alarm title="Загрузка..." />
{/if}
