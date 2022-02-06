<script>
  import Card from "./components/Card.svelte";
  import Alarm from "./components/Alarm.svelte";
  export let settingsJson;
  export let ssidJson;

  export let ssidDropdownClick = () => {};
  export let saveSettings = () => {};
</script>

<div class="grd-2cols">
  <Card title="Подключение к WiFi роутеру">
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Название устройства</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.name} class="wgt-ipt text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Точка доступа</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.apssid} class="wgt-ipt text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Пароль точки доступа</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.appass} class="wgt-ipt text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Название wifi сети</p>
      </div>
      <div class="wgt-w">
        <select class="wgt-ipt text-left focus:border-indigo-500" bind:value={settingsJson.routerssid} on:click={() => ssidDropdownClick()}>
          {#each Object.entries(ssidJson) as [num, ssid]}
            <option value={ssid}>
              {ssid}
            </option>
          {/each}
        </select>
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Пароль</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.routerpass} class="wgt-ipt text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    {#if settingsJson.pass_status === 1}
      <div class="grd-1cols">
        <Alarm title="Введен неправильный пароль" />
      </div>
    {/if}
    <button class="btn-lg" on:click={() => saveSettings()}>{"Сохранить и перезагрузить"}</button>
  </Card>
  <Card title="Подключение к MQTT брокеру">
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Название сервера</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.mqttServer} class="wgt-ipt text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Порт</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.mqttPort} class="wgt-ipt text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Префикс</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.mqttPrefix} class="wgt-ipt text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Имя пользователя</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.mqttUser} class="wgt-ipt text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <div class="crd-itm-psn">
      <div class="wgt-dscr-w">
        <p class="wgt-dscr-stl">Пароль</p>
      </div>
      <div class="wgt-w">
        <input bind:value={settingsJson.mqttPass} class="wgt-ipt text-left focus:border-indigo-500" type="text" />
      </div>
    </div>
    <button class="btn-lg" on:click={() => saveSettings()}>{"Сохранить и проверить подключение"}</button>
  </Card>
</div>
