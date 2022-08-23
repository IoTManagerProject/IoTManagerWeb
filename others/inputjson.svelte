{#if showWidjetJson}
  <Card title="Редактор JSON">
    <textarea rows="10" class="text-sm w-full" id="text1"
      >{syntaxHighlight(JSON.stringify(layoutJson))}</textarea
    >
  </Card>
{/if}
