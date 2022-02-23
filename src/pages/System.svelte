<script>
  const wifiState = {
    0: "не подключено",
    1: "нет сигнала",
    2: "очень низкий",
    3: "низкий",
    4: "хороший",
    5: "очень хороший",
    6: "отличный",
  };

  const systemErrorsRus = {
    mqtt: {
      e1: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Нет ответа от сервера",
        cancel: false,
      },
      e2: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Соединение было разорвано",
        cancel: false,
      },
      e3: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Ошибка соединения. Обычно возникает когда неверно указано название сервера MQTT",
        cancel: false,
      },
      e4: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Клиент был отключен",
        cancel: false,
      },
      e6: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Ошибка версии",
        cancel: false,
      },
      e7: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Отклонен идентификатор",
        cancel: false,
      },
      e8: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Не могу установить соединение",
        cancel: false,
      },
      e9: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Неправильное имя пользователя/пароль",
      },
      e10: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Не авторизован для подключения",
        cancel: false,
      },
      e11: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Название сервера пустое",
        cancel: false,
      },
      e12: {
        descr: "Ошибка mqtt",
        color: "text-red-500",
        txt: "Имя пользователя или пароль пустые",
        cancel: false,
      },
      e13: {
        descr: "Mqtt",
        color: "text-red-500",
        txt: "Подключение в процессе",
        cancel: false,
      },
    },
    wse1: {
      1: {
        descr: "Ошибка веб сокетов",
        color: "text-red-500",
        txt: "Слишком много клиентов было открыто. Допускается не более четырех.",
        cancel: true,
      },
    },
    jse1: {
      1: {
        descr: "Ошибка json",
        color: "text-red-500",
        txt: "Недостаточный размер буфера библиотеки Arduino Json. Устройство может вести себя непредсказуемо. Обратитесь к разработчику.",
        cancel: true,
      },
    },
    jse2: {
      1: {
        descr: "Ошибка json",
        color: "text-red-500",
        txt: "Ошибка записи/чтения json.",
        cancel: true,
        num: true,
      },
    },
    jse3: {
      1: {
        descr: "Ошибка json",
        color: "text-red-500",
        txt: "Ошибка чтения json файла с виджетами",
        cancel: true,
      },
    },
  };

  import Card from "../components/Card.svelte";
  import Alarm from "../components/Alarm.svelte";

  export let errorsJson;

  export let rebootEsp = () => {};

  export let versionsList;
  export let choosingVersion;
  export let coreMessages;
  export let settingsJson;

  export let startUpdate = () => {};
  export let saveSett = () => {};

  export let show;

  export let cancelAlarm = (alarmKey) => {};
</script>

{#if show}
  <div class="grd-3col1">
    <!--INFORMATION-->
    <Card title="Системная информация">
      <div class="flex mb-2 h-6 items-center">
        <div class="w-2/3">
          <p class="pr-4 text-gray-500 font-bold text-sm truncate">Название прошивки</p>
        </div>
        <div class="flex justify-center w-1/3">
          <p class="text-gray-500 font-bold text-sm text-center truncate">{errorsJson.bn}</p>
        </div>
      </div>
      <div class="flex mb-2 h-6 items-center">
        <div class="w-2/3">
          <p class="pr-4 text-gray-500 font-bold text-sm truncate">Доступные версии</p>
        </div>
        <div class="flex justify-center w-1/3">
          <select class="border border-indigo-500 border-4 text-center" bind:value={choosingVersion}>
            {#each Object.entries(versionsList) as [key, param]}
              <option value={param}>
                {param}
              </option>
            {/each}
          </select>
        </div>
      </div>
      <div class="flex mb-2 h-6 items-center">
        <div class="w-2/3">
          <p class="pr-4 text-gray-500 font-bold text-sm truncate">Версия прошивки</p>
        </div>
        <div class="flex justify-center w-1/3">
          <p class="text-gray-500 font-bold text-sm text-center truncate">{errorsJson.bver}</p>
        </div>
      </div>
      <div class="flex mb-2 h-6 items-center">
        <div class="w-2/3">
          <p class="pr-4 text-gray-500 font-bold text-sm truncate">Uptime устройства</p>
        </div>
        <div class="flex justify-center w-1/3">
          <p class="text-gray-500 font-bold text-sm text-center truncate">{errorsJson.upt}</p>
        </div>
      </div>
      <div class="flex mb-2 h-6 items-center">
        <div class="w-2/3">
          <p class="pr-4 text-gray-500 font-bold text-sm truncate">Uptime сессии mqtt</p>
        </div>
        <div class="flex justify-center w-1/3">
          <p class="text-gray-500 font-bold text-sm text-center truncate">{errorsJson.uptm}</p>
        </div>
      </div>
      <div class="flex mb-2 h-6 items-center">
        <div class="w-2/3">
          <p class="pr-4 text-gray-500 font-bold text-sm truncate">Uptime сессии wifi</p>
        </div>
        <div class="flex justify-center w-1/3">
          <p class="text-gray-500 font-bold text-sm text-center truncate">{errorsJson.uptw}</p>
        </div>
      </div>
      <div class="flex mb-2 h-6 items-center">
        <div class="w-2/3">
          <p class="pr-4 text-gray-500 font-bold text-sm truncate">Качество WiFi сигнала</p>
        </div>
        <div class="flex justify-center w-1/3 text-xs sm:text-sm md:text-base lg:text-base xl:text-base 2xl:text-base break-words">
          {#if errorsJson.rssi === 0}
            <p class="text-red-500 font-bold text-sm text-center truncate">не подключено</p>
          {/if}
          {#if errorsJson.rssi === 1}
            <p class="text-red-500 font-bold text-sm text-center truncate">нет сигнала</p>
          {/if}
          {#if errorsJson.rssi === 2}
            <p class="text-red-500 font-bold text-sm text-center truncate">очень низкий</p>
          {/if}
          {#if errorsJson.rssi === 3}
            <p class="text-yellow-500 font-bold text-sm text-center truncate">низкий</p>
          {/if}
          {#if errorsJson.rssi === 4}
            <p class="text-yellow-500 font-bold text-sm text-center truncate">хороший</p>
          {/if}
          {#if errorsJson.rssi === 5}
            <p class="text-green-500 font-bold text-sm text-center truncate">очень хороший</p>
          {/if}
          {#if errorsJson.rssi === 6}
            <p class="text-green-500 font-bold text-sm text-center truncate">отличный</p>
          {/if}
        </div>
      </div>
      <div class="flex mb-2 h-6 items-center">
        <div class="w-2/3">
          <p class="pr-4 text-gray-500 font-bold text-sm truncate">Остаток RAM</p>
        </div>
        <div class="flex justify-center w-1/3 text-sm text-center">
          <p class="text-green-500 font-bold text-center truncate">{errorsJson.heap}</p>
        </div>
      </div>
      <div class="flex mb-2 h-6 items-center">
        <div class="w-2/3">
          <p class="pr-4 text-gray-500 font-bold text-sm truncate">Кол-во записей на flash</p>
        </div>
        <div class="flex justify-center w-1/3 text-sm">
          <p class="text-green-500 font-bold text-center truncate">{errorsJson.fl}</p>
        </div>
      </div>
      <div class="flex mb-2 h-6 items-center">
        <div class="w-2/3">
          <p class="pr-4 text-gray-500 font-bold text-sm truncate">Причина перезагрузки</p>
        </div>
        <div class="flex justify-center w-1/3 text-sm">
          <p class="{errorsJson.rst.toString().includes('Watchdog') || errorsJson.rst.toString().includes('Exception') ? 'text-red-500' : 'text-green-500'} font-bold text-center truncate">{errorsJson.rst}</p>
        </div>
      </div>
      <button class="btn-lg" on:click={() => startUpdate()}>{"Обновить прошивку"}</button>
    </Card>
    <!--SETTINGS-->
    <Card title="Системные настройки">
      <div class="flex mb-2 h-6 items-center">
        <div class="w-5/6">
          <p class="pr-4 text-gray-500 font-bold text-sm truncate">Включить лог</p>
        </div>
        <div class="flex justify-center w-1/6">
          <input bind:checked={settingsJson.log} on:change={() => saveSett()} type="checkbox" class="form-checkbox h-4 w-4 text-gray-600" />
        </div>
      </div>
      <button class="btn-lg" on:click={() => rebootEsp()}>{"Перезагрузить устройство"}</button>
    </Card>
    <!--LOG-->
    <Card title="Лог" class="z-50">
      <div class="h-80 overflow-y-auto">
        {#each coreMessages as message, i}
          <div class={message.msg.toString().includes("[E]") ? "text-xs text-red-500" : "text-xs text-black"}>{message.msg}</div>
        {/each}
      </div>
    </Card>
  </div>
  <!--ERRORS-->
  <div class="grd-1col1">
    <Card title="Системные ошибки">
      {#each Object.entries(errorsJson) as [key, param], i}
        {#if key in systemErrorsRus && param in systemErrorsRus[key]}
          <div class="grd-2col1">
            <Alarm title={systemErrorsRus[key][param].descr} cross={systemErrorsRus[key][param].cancel} close={() => cancelAlarm(key)}>
              <p class="break-words text-center">{systemErrorsRus[key][param].txt}</p>
              {#if systemErrorsRus[key][param].num}
                <p class="break-words text-center">{"Количество: " + errorsJson[key + "n"]}</p>
              {/if}
            </Alarm>
          </div>
        {/if}
      {/each}
    </Card>
  </div>
{:else}
  <Alarm title="Загрузка..." />
{/if}
