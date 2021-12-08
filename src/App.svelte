<script>
  import { onMount } from "svelte";
  import { Route, router, active } from "tinro";
  router.mode.hash(); // enables hash navigation method
  //router.mode.memory(); // enables in-memory navigation method
  //import Chart from "svelte-frappe-charts";

  //import components
  import Card from "./widgets/Card.svelte";
  import Input from "./widgets/Input.svelte";
  import Toggle from "./widgets/Toggle.svelte";
  import Anydata from "./widgets/Anydata.svelte";

  //секция переменных==========================================================================
  let debug = true;
  let LOG_MAX_MESSAGES = 10;
  //===========================================================================================
  let myip = document.location.hostname;
  let wigets = [];
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
  let config = [];
  let socket = [];
  let socketConnected = false;

  let deviceList = [];

  deviceList = [
    {
      id: "987654321",
      ip: "192.168.88.231",
      name: "test ESP 2",
    },
  ];

  let pages = [];
  let coreMessages = [];

  //секция функций=========================================================================
  function connectToAllDevices() {
    let ws = 0;
    deviceList.forEach((device) => {
      if (debug) console.log(device.name, ws, device.ip, device.id);
      wsConnect(ws, device.ip);
      wsEventAdd(ws);
      //if (device.ip === myip) {
      //  if (debug) console.log("My device found in list:", device.name);
      //}
      ws++;
    });
  }

  function wsConnect(ws, ip) {
    socket[ws] = new WebSocket("ws://" + ip + "/ws");
  }

  function wsEventAdd(ws) {
    if (socket[ws]) {
      socket[ws].addEventListener("open", function (event) {
        if (debug) console.log("WS CONNECTED! " + myip);
        socketConnected = true;
        //socket[ws].send("HELLO");
      });
      socket[ws].addEventListener("message", function (event) {
        let data = event.data.toString();
        //console.log("NEW data packet " + myip, event.data);
        if (data.includes("/core/")) {
          data = data.replace("/core/", "");
          addCoreMsg(data);
        }
      });
      socket[ws].addEventListener("close", (event) => {
        socketConnected = false;
        wsConnect(ws);
        console.log("ws close " + myip);
      });
      socket[ws].addEventListener("error", function (event) {
        socketConnected = false;
        wsConnect(ws);
        console.log(myip + " ws error: ", event);
      });
    }
  }

  function wsPush(ws, topic, status) {
    let msg = topic + " " + status;
    if (debug) console.log(ws, msg);
    wsSendMsg(ws, msg);
    //socket[ws].send('{"path":"' + topic + '/control", "status":"' + value.toString() + '"}');
  }

  function wsTestMsgTask() {
    setTimeout(wsTestMsgTask, 10000);
    wsSendMsg(0, "test");
  }

  function wsSendMsg(ws, msg) {
    if (socket[ws] && socket[ws].readyState === 1) {
      socket[ws].send(msg);
      if (debug) console.log("[ws:" + ws + "]", "msg send success:", msg);
    } else {
      if (debug) console.log("[ws:" + ws + "]", "msg not send, try reconnected...", msg);
      wsConnect(ws);
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

  onMount(async () => {
    console.log("mounted");
    connectToAllDevices();
    //wsTestMsgTask();
    //wsEventAdd();
    findNewPage();
    //deviceListExecution();
  });
</script>

<main>
  <div class="fixed m-0 h-10 w-full bg-gray-100 shadow-md">
    <div class="flex justify-end content-center px-6 py-1">
      <svg class="h-8 w-8 {socketConnected == true ? 'text-green-500' : 'text-red-500'}" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"> <path stroke="none" d="M0 0h24v24H0z" /> <path d="M7 18a4.6 4.4 0 0 1 0 -9h0a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-12" /></svg>
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
          <Card title="Здесь будет конфигуратор" />
        </div>
      </Route>

      <Route path="/connection">
        <div class="cards-grid">
          <Card title="Подключение к WiFi роутеру" />
          <Card title="Подключение к MQTT брокеру" />
        </div>
      </Route>
      <Route path="/utilities" />
      <Route path="/log">
        <Card title={"Лог"}>
          {#each coreMessages as message, i}
            <div class={message.msg.toString().includes("[E]") ? "text-red-500" : "text-black"}>{message.msg}</div>
          {/each}
        </Card>
      </Route>
      <Route path="/about" />
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
      @apply w-full p-2 sm:p-2 md:p-2 lg:p-2 xl:px-8 xl:py-4 2xl:px-8 2xl:py-4 bg-white rounded-lg shadow-md lg:shadow-lg;
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
