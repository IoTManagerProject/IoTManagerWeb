<script>
  //******************************************************import section*********************************************************/
  //*****************************************************************************************************************************/
  import { onMount } from "svelte";
  import { Route, router, active } from "tinro";
  router.mode.hash(); // enables hash navigation method
  //router.mode.memory(); // enables in-memory navigation method
  import Chart from "svelte-frappe-charts";

  import Card from "./components/Card.svelte";
  import Modal from "./components/Modal.svelte";
  import Input from "./widgets/Input.svelte";
  import Toggle from "./widgets/Toggle.svelte";
  import Anydata from "./widgets/Anydata.svelte";

  //как ставить и удалять
  //npm install --save svelte-simple-modal
  //npm uninstall svelte-simple-modal

  //****************************************************constants section*********************************************************/
  //******************************************************************************************************************************/
  let debug = true;
  let LOG_MAX_MESSAGES = 10;
  let reconnectTimeout = 60000;

  //****************************************************variable section**********************************************************/
  //******************************************************************************************************************************/
  let myip = document.location.hostname;

  //Flags
  let showInput = false;
  let showModalFlag = false;
  let hideAllSubParams = false;
  let additionalParams = false;

  //dashboard
  let wigets = [];
  let pages = [];

  wigets = [
    {
      widget: "input",
      type: "date",
      status: "2021-10-17",
      page: "Inputs",
      order: "4",
      descr: "Switch on boiler date",
      topic: "/prefix/00000-00004/date1",
      ws: 0,
    },
    {
      widget: "input",
      type: "time",
      status: "12:00",
      page: "Inputs",
      order: "1",
      descr: "Switch on boiler time",
      topic: "/prefix/00000-00001/time",
      ws: 0,
    },
    {
      widget: "input",
      type: "number",
      status: "30.5",
      after: "°С",
      page: "Inputs",
      order: "2",
      descr: "Boiler temperature",
      topic: "/prefix/00000-00002/temp",
      ws: 0,
    },
    {
      widget: "input",
      type: "text",
      status: "Hello",
      page: "Inputs",
      order: "3",
      descr: "Message to be send",
      topic: "/prefix/00000-00003/text",
      ws: 0,
    },
    {
      widget: "toggle",
      status: 0,
      page: "Toggles",
      order: "3",
      descr: "Light in my room",
      topic: "/prefix/00000-00003/btn1",
      ws: 0,
    },
    {
      widget: "toggle",
      status: 0,
      page: "Toggles",
      order: "3",
      descr: "Light in my room",
      topic: "/prefix/00000-00003/btn2",
      ws: 0,
    },
    {
      widget: "toggle",
      status: 0,
      page: "Toggles",
      order: "3",
      descr: "Light in my room",
      topic: "/prefix/00000-00003/btn3",
      ws: 0,
    },
    {
      widget: "anydata",
      status: 30.5,
      after: "°С",
      page: "Any data",
      order: "3",
      descr: "Temperature",
      topic: "/prefix/00000-00003/tmp10",
      ws: 0,
    },
    {
      widget: "anydata",
      status: 1032,
      after: "mm",
      page: "Any data",
      order: "3",
      descr: "Pressure",
      topic: "/prefix/00000-00003/tmp10",
      ws: 0,
    },
    {
      widget: "anydata",
      status: 50,
      after: "%",
      page: "Any data",
      order: "3",
      descr: "Level",
      topic: "/prefix/00000-00003/tmp10",
      ws: 0,
    },
    {
      widget: "anydata",
      status: "opened",
      page: "Any data",
      order: "3",
      descr: "Status",
      topic: "/prefix/00000-00003/tmp10",
      ws: 0,
    },
  ];

  let datachart = {
    labels: ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"],
    datasets: [
      {
        values: [10, 12, 3, 9, 8, 15, 9],
      },
    ],
  };

  let widgetCollection = {};
  widgetCollection = {
    undef: "Ошибка",
    toggleBtn: "Переключатель",
    btn: "Кнопка",
    select: "Кнопка переключатель",
    range: "Ползунок",
    inputDate: "Окно ввода даты",
    inputTime: "Окно ввода времени 1",
    inputTimeClock: "Окно ввода времени 2",
    inputDigit: "Окно ввода цифры",
    inputDigitTemp: "Окно ввода температуры",
    inputText: "Окно ввода текста",
    chart: "График без точек",
    chart2: "График с точками",
    chart3: "График дневного расхода (столбики)",
    chart4: "График дневного расхода (плавный)",
    fillgauge: "Бочка",
    progressline: "Линия",
    progressround: "Круг",
    anydata: "Текст",
    anydataHum: "Влажность (%)",
    anydataPress: "Давление (mm)",
    anydataTemp: "Температура (°С)",
    anydataPpb: "Части на миллиард (ppb)",
    anydataPpm: "Части на миллион (ppm)",
    anydataVlt: "Напряжение (Vlt)",
    anydataAmp: "Сила тока (Amp)",
    anydataWtt: "Мощность (Wtt)",
    anydataWhr: "Энергия (Whr)",
    anydataHtz: "Частота (Htz)",
    anydataTime: "Манометр",
    alarm: "Тревожное сообщение 1",
    anydataAlarm: "Тревожное сообщение 2",
    na: "Без виджета",
  };

  //configuration
  let config = [];
  let buf = [];

  //web sockets
  let socket = [];
  let socketConnected = false;
  let selectedDeviceData = undefined;
  let deviceList = [];
  let flag = true;
  let newDevice = {};
  let coreMessages = [];
  let wsSelected = undefined;

  deviceList = [
    {
      name: "Устройство 1",
      id: "987654321",
      ip: "192.168.88.235",
      status: false,
    },
    {
      name: "Устройство 2",
      id: "987654321",
      ip: "192.168.88.233",
      status: false,
    },
  ];

  //navigation
  let currentPageName = undefined;
  router.subscribe(handleNavigation);

  //****************************************************functions section********************************************************/
  //*****************************************************************************************************************************/

  //****************************************************web sockets section******************************************************/
  function connectToAllDevices() {
    //closeAllConnection();
    //socket = [];
    let ws = 0;
    deviceList.forEach((device) => {
      //if (debug) console.log("[i]", device.name, ws, device.ip, device.id);
      device.ws = ws;
      if (!device.status) {
        wsConnect(ws);
        wsEventAdd(ws);
      }
      ws++;
    });
    deviceList = deviceList;
    socketConnected = selectedDeviceData.status;
  }

  function closeAllConnection() {
    let s;
    for (s in socket) {
      socket[s].close();
    }
  }

  function markDeviceStatus(ws, status) {
    deviceList.forEach((device) => {
      if (device.ws === ws) {
        device.status = status;
        if (debug) {
          if (device.status) {
            console.log("[i]", device.ip, "status online");
          } else {
            console.log("[i]", device.ip, "status offline");
          }
        }
      }
    });
    deviceList = deviceList;
    socketConnected = selectedDeviceData.status;
  }

  function getDeviceStatus(ws) {
    let ret = false;
    deviceList.forEach((device) => {
      if (ws === device.ws) {
        ret = device.status;
      }
    });
    return ret;
  }

  function wsConnect(ws) {
    let ip = getIP(ws);
    if (ip === "error") {
      if (debug) console.log("[e]", "device list wrong");
    } else {
      socket[ws] = new WebSocket("ws://" + ip + ":81");
      //socket[ws] = new WebSocket("ws://" + ip + "/ws");
      if (debug) console.log("[i]", ip, "started connecting...");
    }
  }

  function getIP(ws) {
    let ret = "error";
    deviceList.forEach((device) => {
      if (ws === device.ws) {
        ret = device.ip;
      }
    });
    return ret;
  }

  function wsEventAdd(ws) {
    if (socket[ws]) {
      let ip = getIP(ws);
      if (debug) console.log("[i]", ip, "web socket events added");
      socket[ws].addEventListener("open", function (event) {
        if (debug) console.log("[i]", ip, "completed connecting");
        markDeviceStatus(ws, true);
        sendCurrentPageName();
        //socket[ws].send("HELLO");
      });
      socket[ws].addEventListener("message", function (event) {
        let data = event.data.toString();
        //if (debug) console.log("[i]", "data:", data);
        if (data.includes("[log]")) {
          data = data.replace("[log]", "");
          addCoreMsg(data);
          //if (debug) console.log("[i]", "log data:", data);
        } else if (data.includes("/config.json")) {
          data = data.replace("/config.json", "");
          buf = buf + data;
          if (data.includes("]}")) {
            buf = buf.replace("]}", "]");
            if (IsJsonParse(buf)) {
              config = JSON.parse(buf);
              buf = [];
              config = config;
              if (debug) console.log("[i]", "parsed");
            }
          }
        }
      });
      socket[ws].addEventListener("close", (event) => {
        if (debug) console.log("[e]", ip, "connection closed");
        markDeviceStatus(ws, false);
      });
      socket[ws].addEventListener("error", function (event) {
        if (debug) console.log("[e]", ip, "connection error");
        markDeviceStatus(ws, false);
      });
    } else {
      if (debug) console.log("[e]", "socket not exist");
    }
  }

  function wsPush(ws, topic, status) {
    let msg = topic + " " + status;
    if (debug) console.log("[i]", "send to ws msg:", msg);
    wsSendMsg(ws, msg);
  }

  function wsTestMsgTask() {
    setTimeout(wsTestMsgTask, reconnectTimeout);
    if (debug) console.log("[i]", "----timer tick----");
    if (!flag) {
      deviceList.forEach((device) => {
        if (!getDeviceStatus(device.ws)) {
          wsConnect(device.ws);
          wsEventAdd(device.ws);
        } else {
          wsSendMsg(device.ws, "tst");
        }
      });
    }
    flag = false;
  }

  function wsSendMsg(ws, msg) {
    if (socket[ws] && socket[ws].readyState === 1) {
      socket[ws].send(msg);
      if (debug) console.log("[i]", getIP(ws), "msg send success", msg);
    } else {
      if (debug) console.log("[e]", getIP(ws), "msg not send", msg);
    }
  }

  //***********************************************************dashboard************************************************************/
  function findNewPage() {
    pages = [];
    const newPage = Array.from(new Set(Array.from(wigets, ({ page }) => page)));
    newPage.forEach(function (item, i, arr) {
      pages = [...pages, JSON.parse(JSON.stringify({ page: item }))];
    });
    pages.sort(function (a, b) {
      if (a.page < b.page) {
        return -1;
      }
      if (a.page > b.page) {
        return 1;
      }
      return 0;
    });
  }

  function wigetsUpdate() {
    wigets = JSON.parse(document.getElementById("text1").value);
    findNewPage();
  }

  //***********************************************************logging************************************************************/
  const addCoreMsg = (msg) => {
    if (coreMessages.length > Number(LOG_MAX_MESSAGES)) {
      coreMessages = coreMessages.slice(0);
    }
    const time = new Date().getTime();
    coreMessages = [...coreMessages, { time, msg }];
    coreMessages.sort(function (a, b) {
      if (a.time > b.time) {
        return -1;
      }
      if (a.time < b.time) {
        return 1;
      }
      return 0;
    });
  };

  //***********************************************************dev list************************************************************/
  function dropdownChange() {
    socketConnected = selectedDeviceData.status;
    wsSelected = selectedDeviceData.ws;
    clearData();
    sendCurrentPageName();
    if (debug) console.log("[i]", "user selected device:", selectedDeviceData.name);
    if (selectedDeviceData.ip === myip) {
      if (debug) console.log("[i]", "user selected original device", selectedDeviceData.name);
    }
  }

  function devListSave() {
    if (!showInput) {
      if (newDevice.name !== undefined && newDevice.ip !== undefined && newDevice.id !== undefined) {
        newDevice.status = false;
        deviceList.push(newDevice);
        deviceList = deviceList;
        newDevice = {};
        connectToAllDevices();
        if (debug) console.log("[i]", "selected device:", selectedDeviceData);
        //socketConnected = selectedDeviceData.status;
        //socketConnected = socketConnected;
      } else {
        if (debug) console.log("[e]", "wrong data");
      }
    }
  }

  function clearData() {
    config = [];
    buf = [];
  }

  //***********************************************************navigation************************************************************/
  function handleNavigation() {
    clearData();
    currentPageName = $router.path.toString();
    console.log("[i]", "user on page:", currentPageName);
    sendCurrentPageName();
  }

  function sendCurrentPageName() {
    if (wsSelected !== undefined) {
      wsSendMsg(wsSelected, currentPageName);
    }
  }

  //****************************************************************json************************************************************/
  function getJsonObject(array, number) {
    let num = 0;
    let out = {};
    array.forEach((object) => {
      if (num === number) {
        out = object;
      }
      num++;
    });
    return out;
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

  function IsJsonParse(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  //**********************************************************post and get************************************************************/
  //editRequest("192.168.88.235", "data data data data", "file.json")

  function editRequest(url, data, filename) {
    if (debug) console.log("[i]", "request for edit file");
    var xmlHttp = new XMLHttpRequest();
    var formData = new FormData();
    formData.append("data", new Blob([data], { type: "text/json" }), "/" + filename);
    xmlHttp.open("POST", "http://" + url + "/edit");
    xmlHttp.onload = function () {
      //во время загрузки
    };
    xmlHttp.send(formData);
  }

  async function handleSubmit(url) {
    try {
      console.log(url);
      let res = await fetch(url, {
        mode: "no-cors",
        method: "GET",
      });
      if (res.ok) {
        console.log("OK", res.status);
        //console.log(url);
      } else {
        console.log("error", res.status);
        //console.log(url);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function getRequestJson(url) {
    let res = await fetch(url, {
      mode: "no-cors",
      method: "GET",
    });
    if (res.ok) {
      configSetupJson = await res.json();
    } else {
      console.log("error", res.status);
    }
  }

  function showAdditionalParams(id) {
    additionalParams = true;
    if (debug) console.log("[i]", "user open add params ", id);
  }

  function pushConfigToEsp() {
    //config.forEach((element) => {
    wsSendMsg(wsSelected, "/changed" + JSON.stringify(config));
    clearData();
    sendCurrentPageName();
    //});
  }

  function showModal() {
    showModalFlag = !showModalFlag;
  }

  //initialisation=======================================================================================
  onMount(async () => {
    console.log("[i]", "mounted");
    connectToAllDevices();
    wsTestMsgTask();
    socketConnected = selectedDeviceData.status;
    dropdownChange();
    findNewPage();
  });
</script>

<main>
  <Modal show={showModalFlag} />
  <div class="fixed m-0 h-10 w-full bg-gray-100 shadow-md">
    <div class="flex justify-end content-center">
      <div class="px-15 py-2">
        <select bind:value={selectedDeviceData} on:change={() => dropdownChange()}>
          {#each deviceList as device}
            <option value={device}>
              {device.name}
            </option>
          {/each}
        </select>
      </div>
      <div class="px-10 py-1">
        <svg class="h-8 w-8 {socketConnected === true ? 'text-green-500' : 'text-red-500'}" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"> <path stroke="none" d="M0 0h24v24H0z" /> <path d="M7 18a4.6 4.4 0 0 1 0 -9h0a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-12" /></svg>
      </div>
    </div>
  </div>

  <input id="menu__toggle" type="checkbox" />
  <label class="menu__btn" for="menu__toggle">
    <span />
  </label>

  <ul class="menu__box">
    <li>
      <a class="menu__item" href="/">{"Управление"}</a>
    </li>
    <li>
      <a class="menu__item" href="/config">{"Конфигуратор"}</a>
    </li>
    <li>
      <a class="menu__item" href="/connection">{"Подключение"}</a>
    </li>
    <li>
      <a class="menu__item" href="/utilities">{"Утилиты"}</a>
    </li>
    <li>
      <a class="menu__item" href="/log">{"Лог"}</a>
    </li>
    <li>
      <a class="menu__item" href="/list">{"Устройства"}</a>
    </li>
    <li>
      <a class="menu__item" href="/about">{"О проекте"}</a>
    </li>
  </ul>

  <ul class="menu__main">
    <div class="bg-cover bg-gray-50 pt-8 px-4">
      <Route path="/">
        <div class="cards-grid">
          {#each pages as pagesName, i}
            <Card title={pagesName.page}>
              {#each wigets as widget, i}
                {#if widget.page === pagesName.page}
                  {#if widget.widget === "input"}
                    <Input bind:value={widget.status} widget={widget} wsPushProp={(ws, topic, status) => wsPush(ws, topic, status)} />
                  {/if}
                  {#if widget.widget === "toggle"}
                    <Toggle bind:value={widget.status} widget={widget} wsPushProp={(ws, topic, status) => wsPush(ws, topic, status)} />
                  {/if}
                  {#if widget.widget === "anydata"}
                    <Anydata bind:value={widget.status} widget={widget} />
                  {/if}
                {/if}
              {/each}
            </Card>
          {/each}

          <Card title="Редактор JSON">
            <textarea on:input={wigetsUpdate} rows="10" class="json-input w-full" id="text1">{syntaxHighlight(JSON.stringify(wigets))}</textarea>
          </Card>
        </div>
      </Route>
      <Route path="/config">
        <div class="cards-grid-inline">
          <Card>
            <!--<select class="long-select">{"Выберите элемент"}</select>-->
            <!--<select class="long-select">{"Выберите пресет"}</select>-->
            <table class="table-fixed w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="table-head-element text-center">Тип</th>
                  <th class="table-head-element text-center">Id</th>
                  <th class="table-head-element text-center">Виджет</th>
                  <th class="table-head-element text-center">Вкладка</th>
                  <th class="table-head-element text-center">Название</th>
                  <th class="table-head-element text-center w-12"><button class="table-button bg-green-100 hover:bg-green-400" /></th>
                  <th class="table-head-element text-center w-12" />
                </tr>
              </thead>
              <tbody class="bg-white">
                {#each config as element}
                  <tr>
                    <td class="table-body-element text-center">{element.subtype}</td>
                    <td class="table-body-element text-center"><input bind:value={element.id} class="table-input w-full" type="text" /></td>
                    <td class="table-body-element text-center"
                      ><select class="table-input w-full" bind:value={selectedDeviceData}>
                        {#each deviceList as device}
                          <option value={device}>
                            {device.name}
                          </option>
                        {/each}
                      </select></td>
                    <td class="table-body-element text-center"><input bind:value={element.page} class="table-input w-full" type="text" /></td>
                    <td class="table-body-element text-center"><input bind:value={element.descr} class="table-input w-full" type="text" /></td>
                    <td class="table-body-element text-center"><button on:click={() => (hideAllSubParams = !hideAllSubParams)} class="table-button bg-green-100 hover:bg-green-400" /></td>
                    <td class="table-body-element text-center"><button class="table-button bg-red-100 hover:bg-red-400" /></td>
                  </tr>
                  {#if !hideAllSubParams}
                    {#each Object.entries(element) as [key, param]}
                      {#if key != "type" && key != "subtype" && key != "id" && key != "widget" && key != "page" && key != "descr"}
                        <tr>
                          <td />
                          <td />
                          <td />
                          <td class="table-sub-body-element text-right">
                            <p class="table-sub-text">{key}</p>
                          </td>
                          <td class="table-sub-body-element text-center">
                            <input bind:value={element[key]} class="table-sub-input w-full" type="text" />
                          </td>
                        </tr>
                      {/if}
                    {/each}
                    <!--<br />-->
                  {/if}
                {/each}
              </tbody>
            </table>
            <button class="long-button" on:click={() => pushConfigToEsp()}>{"Сохранить"}</button>
          </Card>
        </div>
      </Route>
      <Route path="/connection">
        <div class="cards-grid">
          <Card title="Подключение к WiFi роутеру" />
          <Card title="Подключение к MQTT брокеру" />
        </div>
      </Route>
      <Route path="/utilities">
        <Card title={"Пример графика"}>
          <Chart data={datachart} type="line" />
        </Card>
      </Route>
      <Route path="/log">
        <Card title={"Лог"}>
          {#each coreMessages as message, i}
            <div class={message.msg.toString().includes("[E]") ? "text-red-500" : "text-black"}>{message.msg}</div>
          {/each}
        </Card>
      </Route>
      <Route path="/list">
        <Card title={"Список устройств"}>
          <table class="table-fixed w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-head-element text-center">Название устройства</th>
                <th class="table-head-element text-center">IP адрес</th>
                <th class="table-head-element text-center">Идентификатор</th>
                <th class="table-head-element text-center">Состояние</th>
              </tr>
            </thead>
            <tbody class="bg-white">
              {#each deviceList as device}
                <tr>
                  <td class="table-body-element text-center">{device.name}</td>
                  <td class="table-body-element text-center"><a href={"http://" + device.ip}>{device.ip}</a></td>
                  <td class="table-body-element text-center">{device.id}</td>
                  <td class="table-body-element text-center {device.status ? 'bg-green-50' : 'bg-red-50'}">{device.status ? "online" : "offline"}</td>
                </tr>
              {/each}
              {#if showInput}
                <tr>
                  <td class="table-body-element text-center"><input bind:value={newDevice.name} class="table-input w-full" type="text" /></td>
                  <td class="table-body-element text-center"><input bind:value={newDevice.ip} class="table-input w-full" type="text" /></td>
                  <td class="table-body-element text-center"><input bind:value={newDevice.id} class="table-input w-full" type="text" /></td>
                  <td class="table-body-element text-center" />
                </tr>
              {/if}
            </tbody>
          </table>
          <button class="long-button" on:click={() => ((showInput = !showInput), devListSave())}>{showInput ? "Сохранить" : "Добавить устройство"}</button>
        </Card>
      </Route>
      <Route path="/about">
        <button on:click={() => showModal()} type="button"> Toggle modal </button>
      </Route>
    </div>
  </ul>
</main>

<style lang="postcss" global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer components {
    /*==================================================cards grid=====================================================*/
    /* grid for cards */
    .cards-grid {
      @apply grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 justify-items-center;
    }
    /* grid for cards for full screen */
    .cards-grid-inline {
      @apply grid grid-cols-1 justify-items-center;
    }
    /*=============================================card and items inside===============================================*/
    /* 1. paddig and style for card */
    .card {
      @apply w-full p-2 sm:p-2 md:p-2 lg:p-2 xl:px-8 xl:py-4 2xl:px-8 2xl:py-4 bg-white rounded-lg shadow-md lg:shadow-lg border border-gray-100;
    }
    /* 2. style for card header */
    .card-header {
      @apply text-center text-lg text-gray-500 font-bold pb-4;
    }
    /* 3. card items positioning*/
    .card-items-psn {
      @apply flex mb-4 h-8 items-center;
    }
    /* 4. widget description width*/
    .widget-descr-width {
      @apply w-2/3;
    }
    /* 5. widget descr style*/
    .widget-descr-style {
      @apply pr-4 text-gray-500 font-bold;
    }
    /* 6. widget width*/
    .widget-width {
      @apply flex justify-end w-1/3;
    }
    /*====================================================others=====================================================*/
    .btn-indigo {
      @apply py-2 px-4 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75;
    }
    .widget-input {
      @apply content-center pr-4 py-1 bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white text-right;
    }
    .json-input {
      @apply content-center pr-4 py-1 bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500;
    }
    .widget-anydata-style {
      @apply text-center text-gray-500 font-bold;
    }
    /*====================================================table=====================================================*/
    .table-head-element {
      @apply px-2 py-2 break-words text-gray-500 font-bold;
    }
    .table-body-element {
      @apply px-2 py-2 break-words;
    }
    .table-sub-body-element {
      @apply px-2 py-1 break-words;
    }
    .table-input {
      @apply content-center h-8 bg-gray-50 focus:bg-white appearance-none border-2 border-gray-100 text-gray-700 leading-tight focus:outline-none text-center focus:border-indigo-500;
    }
    .table-sub-text {
      @apply text-sm inline-block italic align-top text-right text-gray-500;
    }
    .table-sub-input {
      @apply content-center h-6 bg-gray-50 focus:bg-white appearance-none border-2 border-gray-100 text-gray-700 leading-tight focus:outline-none text-center focus:border-indigo-500 rounded-sm;
    }
    /*====================================================buttons=====================================================*/
    .long-button {
      @apply flex justify-center break-words content-center bg-blue-100 hover:bg-blue-200 text-gray-500 font-bold h-8 w-full mt-4 border border-gray-300 rounded;
    }
    .table-button {
      @apply flex justify-center content-center text-gray-500 font-bold w-10 h-8 border border-gray-300;
    }
    /*====================================================select=====================================================*/
    .long-select {
      @apply flex justify-center break-words content-center bg-blue-100 hover:bg-blue-200 text-gray-500 font-bold h-8 w-1/4 mb-6 border border-gray-300 rounded;
    }
  }

  #menu__toggle {
    opacity: 0;
  }
  #menu__toggle:checked ~ .menu__btn > span {
    transform: rotate(45deg);
  }
  #menu__toggle:checked ~ .menu__btn > span::before {
    top: 0;
    transform: rotate(0);
  }
  #menu__toggle:checked ~ .menu__btn > span::after {
    top: 0;
    transform: rotate(90deg);
  }
  #menu__toggle:checked ~ .menu__box {
    visibility: visible;
    left: 0;
  }

  #menu__toggle:checked ~ .menu__main {
    margin-left: 150px; /* насколько сужать правую часть */
    transition-duration: 0.25s;
  }

  .menu__btn {
    display: flex;
    align-items: center;
    position: fixed;
    z-index: 1;
    top: 10px;
    left: 20px;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .menu__btn > span,
  .menu__btn > span::before,
  .menu__btn > span::after {
    display: block;
    position: absolute;
    width: 100%;
    height: 2px;
    background-color: #616161;
    transition-duration: 0.25s;
  }
  .menu__btn > span::before {
    content: "";
    top: -8px;
  }
  .menu__btn > span::after {
    content: "";
    top: 8px;
  }

  .menu__box {
    display: block;
    position: fixed;
    visibility: hidden;
    top: 0;
    left: -100%;
    width: 150px; /* размер выхода бокового меню */
    height: 100%;
    margin: 0;
    padding: 80px 0;
    list-style: none;
    background-color: #eceff1;
    box-shadow: 1px 0px 6px rgba(0, 0, 0, 0.2);
    transition-duration: 0.25s;
  }

  .menu__item {
    display: block;
    padding: 12px 24px;
    color: rgba(51, 51, 51, 0.788);
    font-family: "Roboto", sans-serif;
    font-size: 15px; /* размер шрифта бокового меню */
    font-weight: 600;
    text-decoration: none;
    transition-duration: 0.25s;
  }
  .menu__item:hover {
    background-color: #cfd8dc;
  }

  .upper__bar {
    background-color: rgba(51, 51, 51, 0.144);
    height: 70px;
    position: fixed;
    z-index: -1;
    top: 0px;
    left: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    box-shadow: 1px 0px 3px rgba(0, 0, 0, 0.2);
  }

  input[type="date"]::-webkit-calendar-picker-indicator {
    margin-left: 5px;
    margin-right: -8px;
  }
  input[type="time"]::-webkit-calendar-picker-indicator {
    margin-left: 5px;
    margin-right: -8px;
  }

  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    margin-left: 7px;
    margin-right: -6px;
    width: 30px;
    height: 30px;
    opacity: 1;
  }

  /* Toggle */
  input:checked ~ .dot {
    transform: translateX(100%);
    /* background-color: #48bb78;*/
  }
</style>
