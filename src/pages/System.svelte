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
        txt: "Ошибка чтения json файла с виджетами при отправки в mqtt",
        cancel: true,
      },
    },
    tme1: {
      1: {
        descr: "Ошибка времени",
        color: "text-red-500",
        txt: "Ошибка синхронизации времени с NTP сервером",
        cancel: false,
      },
    },
  };

  import Card from "../components/Card.svelte";
  import Alarm from "../components/Alarm.svelte";

  export let errorsJson;

  export let versionsList;
  export let choosingVersion;
  export let coreMessages;
  export let settingsJson;

  export let startUpdate = () => {};
  export let saveSett = () => {};
  export let cleanLogs = () => {};
  export let rebootEsp = () => {};

  export let show;

  export let paramsBeenChanged = false;

  let reboot = false;

  export let cancelAlarm = (alarmKey) => {};
</script>

{#if show}
  <div class="my-4">
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
              {#if versionsList}
                {#each Object.entries(versionsList) as [key, param]}
                  <option value={param}>
                    {param}
                  </option>
                {/each}
              {/if}
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
            <p class="pr-4 text-gray-500 font-bold text-sm truncate">Версия веб интерфейса</p>
          </div>
          <div class="flex justify-center w-1/3">
            <p class="text-gray-500 font-bold text-sm text-center truncate">{errorsJson.wver}</p>
          </div>
        </div>

        <div class="flex mb-2 h-6 items-center">
          <div class="w-2/3">
            <p class="pr-4 text-gray-500 font-bold text-sm truncate">Время на устройстве</p>
          </div>
          <div class="flex justify-center w-1/3">
            <p class="text-gray-500 font-bold text-sm text-center truncate">{errorsJson.timenow}</p>
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
            <p class="pr-4 text-gray-500 font-bold text-sm truncate">Остаток flash</p>
          </div>
          <div class="flex justify-center w-1/3 text-sm text-center">
            <p class="text-green-500 font-bold text-center truncate">{errorsJson.freeBytes}</p>
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
        <!--ZONE-->
        <div class="flex mb-2 h-6 items-center">
          <div class="w-2/3">
            <p class="pr-4 text-gray-500 font-bold text-sm truncate">Часовой пояс</p>
          </div>
          <div class="flex justify-center w-1/3">
            <input bind:value={settingsJson.timezone} on:change={() => (paramsBeenChanged = true)} class="ipt-rnd h-7 text-center focus:border-indigo-500" type="number" />
          </div>
        </div>
        <!--CLEAN-->
        <div class="flex mb-2 h-6 items-center">
          <div class="w-2/3">
            <p class="pr-4 text-gray-500 font-bold text-sm truncate">Данные графиков</p>
          </div>
          <div class="flex justify-center w-1/3">
            <button class="btn-lg h-7" on:click={() => cleanLogs()}>{"Очистить"}</button>
          </div>
        </div>

        <!--WORKING GROUP-->
        <div class="flex mb-2 h-6 items-center">
          <div class="w-2/3">
            <p class="pr-4 text-gray-500 font-bold text-sm truncate">Группа устройств</p>
          </div>
          <div class="flex justify-center w-1/3">
            <input bind:value={settingsJson.wg} on:change={() => (reboot = true)} class="ipt-rnd h-7 text-center focus:border-indigo-500" />
          </div>
        </div>

        <!--LOG-->
        <div class="flex mb-2 h-6 items-center">
          <div class="w-2/3">
            <p class="pr-4 text-gray-500 font-bold text-sm truncate">Включить лог</p>
          </div>
          <div class="flex justify-center w-1/3">
            <label for="log" class="items-center cursor-pointer">
              <div class="relative">
                <input bind:checked={settingsJson.log} on:change={() => (paramsBeenChanged = true)} id="log" type="checkbox" class="sr-only" />
                <div class="block {settingsJson.log ? 'bg-blue-600' : 'bg-gray-600'} w-10 h-6 rounded-full shadow-lg" />
                <div class="dot bg-gray-100 absolute left-1 top-1  w-4 h-4 rounded-full transition shadow-lg" />
              </div>
            </label>
          </div>
        </div>

        <!--MQTT-->
        <div class="flex mb-2 h-6 items-center">
          <div class="w-2/3">
            <p class="pr-4 text-gray-500 font-bold text-sm truncate">Прием событий с других устройств</p>
          </div>
          <div class="flex justify-center w-1/3">
            <label for="mqtt" class="items-center cursor-pointer">
              <div class="relative">
                <input bind:checked={settingsJson.mqttin} on:change={() => (reboot = true)} id="mqtt" type="checkbox" class="sr-only" />
                <div class="block {settingsJson.mqttin ? 'bg-blue-600' : 'bg-gray-600'} w-10 h-6 rounded-full shadow-lg" />
                <div class="dot bg-gray-100 absolute left-1 top-1  w-4 h-4 rounded-full transition shadow-lg" />
              </div>
            </label>
          </div>
        </div>

        <!--i2c-->
        <div class="flex mb-2 h-6 items-center">
          <div class="w-2/3">
            <p class="pr-4 text-gray-500 font-bold text-sm truncate">Перенаправление i2c</p>
          </div>

          <div class="flex justify-center w-1/3">
            <label for="i2c" class="items-center cursor-pointer">
              <div class="relative">
                <input bind:checked={settingsJson.i2c} on:change={() => (reboot = true)} id="i2c" type="checkbox" class="sr-only" />
                <div class="block {settingsJson.i2c ? 'bg-blue-600' : 'bg-gray-600'} w-10 h-6 rounded-full shadow-lg" />
                <div class="dot bg-gray-100 absolute left-1 top-1  w-4 h-4 rounded-full transition shadow-lg" />
              </div>
            </label>
          </div>
        </div>
        {#if settingsJson.i2c === true}
          <div class="flex mb-2 h-6 items-center">
            <div class="w-2/3">
              <p class="pr-4 text-gray-500 font-bold text-sm truncate">i2c SCL gpio</p>
            </div>
            <div class="flex justify-center w-1/3">
              <input bind:value={settingsJson.pinSCL} on:change={() => (reboot = true)} class="ipt-rnd h-7 text-center focus:border-indigo-500" type="number" />
            </div>
          </div>
          <div class="flex mb-2 h-6 items-center">
            <div class="w-2/3">
              <p class="pr-4 text-gray-500 font-bold text-sm truncate">i2c SDA gpio</p>
            </div>
            <div class="flex justify-center w-1/3">
              <input bind:value={settingsJson.pinSDA} on:change={() => (reboot = true)} class="ipt-rnd h-7 text-center focus:border-indigo-500" type="number" />
            </div>
          </div>
          <div class="flex mb-2 h-6 items-center">
            <div class="w-2/3">
              <p class="pr-4 text-gray-500 font-bold text-sm truncate">i2c частота</p>
            </div>
            <div class="flex justify-center w-1/3">
              <input bind:value={settingsJson.i2cFreq} on:change={() => (reboot = true)} class="ipt-rnd h-7 text-center focus:border-indigo-500" type="number" />
            </div>
          </div>
        {/if}

        <!--control-->
        <!--<div class="grd-2col1">-->
        {#if paramsBeenChanged}
          <button class="btn-lg animate-pulse" on:click={() => (saveSett(), (paramsBeenChanged = false))}>{"Сохранить"}</button>
        {/if}
        {#if reboot}
          <button class="btn-lg animate-pulse" on:click={() => (saveSett(), rebootEsp(), (reboot = false))}>{"Сохранить и перезагрузить"}</button>
        {/if}
        <!--<button class="btn-lg" on:click={() => rebootEsp()}>{"Перезагрузить"}</button>-->
        <!--</div>-->
      </Card>

      <!--LOG-->
      <Card title="Лог" class="z-50">
        <div class="h-80 overflow-y-auto">
          {#each coreMessages as message, i}
            <div class={message.msg.toString().includes("[E]") || message.msg.toString().includes("[!]") ? "text-xs text-red-500" : "text-xs text-black"}>{message.msg}</div>
          {/each}
        </div>
      </Card>
    </div>
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
