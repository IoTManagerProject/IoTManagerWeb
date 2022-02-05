<script>
  //******************************************************import section*********************************************************/
  //*****************************************************************************************************************************/
  import { onMount } from "svelte";
  import { Route, router, active } from "tinro";
  router.mode.hash(); // enables hash navigation method
  //router.mode.memory(); // enables in-memory navigation method
  import Chart from "svelte-frappe-charts";
  //import { SvelteToast, toast } from "@zerodevx/svelte-toast";

  //const app = new SvelteToast({
  //  target: document.body,
  //  props: {
  //    options: {},
  //  },
  //});

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
  let opened = false;
  let preventMove = false;

  //****************************************************variable section**********************************************************/
  //******************************************************************************************************************************/
  let myip = document.location.hostname;

  //Flags
  let showInput = false;
  let showModalFlag = false;
  let hideAllSubParams = true;
  let additionalParams = false;

  //dashboard
  let pages = [];

  let datachart = {
    labels: ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"],
    datasets: [
      {
        values: [10, 12, 3, 9, 8, 15, 9],
      },
    ],
  };

  //configuration
  let configJson = [];
  let configJsonFlag = false;
  let configJsonParced = false;

  let widgetsJson = [];
  let widgetsJsonFlag = false;
  let widgetsJsonParced = false;

  let itemsJson = [];
  let itemsJsonFlag = false;
  let itemsJsonParced = false;

  let itemsJsonBind = 0;

  let layoutJson = [];
  let layoutJsonFlag = false;
  let layoutJsonParced = false;

  let settingsJson = {};
  let settingsJsonFlag = false;
  let settingsJsonParced = false;

  let ssidJson = {};
  let ssidJsonParced = false;

  //web sockets
  let socket = [];
  let socketConnected = false;
  let selectedDeviceData = undefined;
  let deviceList = [];
  let flag = true;
  let newDevice = {};
  let coreMessages = [];
  let wsSelected = undefined;

  let oneOfJsonPackageError = false;

  deviceList = [
    {
      name: "Устройство 1",
      id: "987654321",
      ip: myip,
      //ip: "192.168.8.196",
      status: false,
    },
  ];

  //***********************************************************blob**************************************************************/
  var MyBlobBuilder = function () {
    this.parts = [];
  };

  MyBlobBuilder.prototype.append = function (part) {
    this.parts.push(part);
    this.blob = undefined; // Invalidate the blob
  };

  MyBlobBuilder.prototype.getBlob = function () {
    if (!this.blob) {
      this.blob = new Blob(this.parts, { type: "binary" });
    }
    return this.blob;
  };

  MyBlobBuilder.prototype.clear = function () {
    this.parts = [];
  };

  //***********************************************************navigation********************************************************/
  let currentPageName = undefined;
  var configJsonBlob = new MyBlobBuilder();
  var widgetsJsonBlob = new MyBlobBuilder();
  var itemsJsonBlob = new MyBlobBuilder();
  var layoutJsonBlob = new MyBlobBuilder();
  var settingsJsonBlob = new MyBlobBuilder();

  router.subscribe(handleNavigation);

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
      socket.binaryType = "blob";
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
        if (typeof event.data === "string") {
          let data = event.data;
          //if (debug) console.log("[i]", getIP(ws), "msg received", data);//
          //сборщик statusJson сообщений======================================
          if (data.includes("status")) {
            if (IsJsonParse(data)) {
              let statusJson = JSON.parse(data);
              udatelayoutJson(statusJson);
              wigetsUpdate();
              if (debug) console.log("[i]", "status json parced: ", statusJson);
            }
          }
          //сборщик ssidJson сообщений======================================
          if (data.includes("ssid")) {
            if (IsJsonParse(data)) {
              ssidJson = JSON.parse(data);
              delete ssidJson.ssid;
              ssidJson = ssidJson;
              ssidJsonParced = true;
              if (debug) console.log("[i]", "ssid json parced");
            }
          }
          //сборщик configJson пакетов========================================
          if (data === "/st/config.json") {
            //if (debug) console.log("[i]", "configJson start!");
            configJsonFlag = true;
          }
          if (data === "/end/config.json") {
            //if (debug) console.log("[i]", "configJson end!");
            configJsonFlag = false;
            var bb = configJsonBlob.getBlob();
            let configJsonReader = new FileReader();
            configJsonReader.readAsText(bb);
            configJsonReader.onload = () => {
              let configJsonResult = configJsonReader.result;
              if (IsJsonParse(configJsonResult)) {
                configJson = JSON.parse(configJsonResult);
                configJson = configJson;
                configJsonParced = true;
                if (debug) console.log("[i]", "configJson parced!");
              }
            };
          }
          //сборщик widgetsJson пакетов========================================
          if (data === "/st/widgets.json") {
            //if (debug) console.log("[i]", "widgetsJson start!");
            widgetsJsonFlag = true;
          }
          if (data === "/end/widgets.json") {
            //if (debug) console.log("[i]", "widgetsJson end!");
            widgetsJsonFlag = false;
            var bb = widgetsJsonBlob.getBlob();
            let widgetsJsonReader = new FileReader();
            widgetsJsonReader.readAsText(bb);
            widgetsJsonReader.onload = () => {
              let widgetsJsonResult = widgetsJsonReader.result;
              if (IsJsonParse(widgetsJsonResult)) {
                widgetsJson = JSON.parse(widgetsJsonResult);
                widgetsJson = widgetsJson;
                widgetsJsonParced = true;
                if (debug) console.log("[i]", "widgetsJson parced!");
              }
            };
          }
          //сборщик itemsJson пакетов========================================
          if (data === "/st/items.json") {
            //if (debug) console.log("[i]", "itemsJson start!");
            itemsJsonFlag = true;
          }
          if (data === "/end/items.json") {
            //if (debug) console.log("[i]", "itemsJson end!");
            itemsJsonFlag = false;
            var bb = itemsJsonBlob.getBlob();
            let itemsJsonReader = new FileReader();
            itemsJsonReader.readAsText(bb);
            itemsJsonReader.onload = () => {
              let itemsJsonResult = itemsJsonReader.result;
              if (IsJsonParse(itemsJsonResult)) {
                itemsJson = JSON.parse(itemsJsonResult);
                itemsJson = itemsJson;
                itemsJsonParced = true;
                if (debug) console.log("[i]", "itemsJson parced!");
              }
            };
          }
          //сборщик layoutJson пакетов========================================
          if (data === "/st/layout.json") {
            //if (debug) console.log("[i]", "layoutJson start!");
            layoutJsonFlag = true;
          }
          if (data === "/end/layout.json") {
            //if (debug) console.log("[i]", "layoutJson end!");
            layoutJsonFlag = false;
            var bb = layoutJsonBlob.getBlob();
            let layoutJsonReader = new FileReader();
            layoutJsonReader.readAsText(bb);
            layoutJsonReader.onload = () => {
              let layoutJsonResult = layoutJsonReader.result;
              if (IsJsonParse(layoutJsonResult)) {
                layoutJson = JSON.parse(layoutJsonResult);
                layoutJson = layoutJson;
                wigetsUpdate();
                layoutJsonParced = true;
                if (debug) console.log("[i]", "layoutJson parced!");
              }
            };
          }
          //сборщик settingsJson пакетов========================================
          if (data === "/st/settings.json") {
            //if (debug) console.log("[i]", "settingsJson start!");
            settingsJsonFlag = true;
          }
          if (data === "/end/settings.json") {
            //if (debug) console.log("[i]", "settingsJson end!");
            settingsJsonFlag = false;
            var bb = settingsJsonBlob.getBlob();
            let settingsJsonReader = new FileReader();
            settingsJsonReader.readAsText(bb);
            settingsJsonReader.onload = () => {
              let settingsJsonResult = settingsJsonReader.result;
              if (IsJsonParse(settingsJsonResult)) {
                settingsJson = JSON.parse(settingsJsonResult);
                settingsJson = settingsJson;
                wigetsUpdate();
                settingsJsonParced = true;
                if (debug) console.log("[i]", "settingsJson parced!");
              }
            };
          }
        }
        if (event.data instanceof Blob) {
          if (configJsonFlag) configJsonBlob.append(event.data);
          if (widgetsJsonFlag) widgetsJsonBlob.append(event.data);
          if (itemsJsonFlag) itemsJsonBlob.append(event.data);
          if (layoutJsonFlag) layoutJsonBlob.append(event.data);
          if (settingsJsonFlag) settingsJsonBlob.append(event.data);
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

  function saveConfig() {
    wsSendMsg(wsSelected, "/tuoyal" + JSON.stringify(generateLayout()));
    wsSendMsg(wsSelected, "/gifnoc" + JSON.stringify(configJson));
    clearData();
    sendCurrentPageName();
  }

  function saveSettings() {
    wsSendMsg(wsSelected, "/cennoc" + JSON.stringify(settingsJson));
    clearData();
    sendCurrentPageName();
  }

  function generateLayout() {
    let layout = [];
    for (let i = 0; i < configJson.length; i++) {
      let config = Object.assign({}, configJson[i]);
      let setWidget = config.widget;
      let error = true;
      for (let w = 0; w < widgetsJson.length; w++) {
        if (setWidget === widgetsJson[w].name) {
          let widget = Object.assign({}, widgetsJson[w]);
          widget.page = config.page;
          widget.descr = config.descr;
          //widget.id = config.id;
          //widget.ws = wsSelected;
          widget.topic = settingsJson.root + "/" + config.id;
          layout.push(widget);
          error = false;
          break;
        } else {
          error = true;
        }
      }
      if (error) console.log("[e]", "error, widget not found: " + setWidget);
    }
    if (debug) console.log("[i] layout:", JSON.stringify(layout));
    return layout;
  }

  function udatelayoutJson(newStatusJson) {
    for (let i = 0; i < layoutJson.length; i++) {
      let topic = layoutJson[i].topic;
      if (topic === newStatusJson.topic) {
        layoutJson[i].status = newStatusJson.status;
        break;
      }
    }
  }

  function clearData() {
    configJson = [];
    configJsonBlob.clear();

    widgetsJson = [];
    widgetsJsonBlob.clear();

    itemsJson = [];
    itemsJsonBlob.clear();

    layoutJson = [];
    layoutJsonBlob.clear();

    settingsJson = {};
    settingsJsonBlob.clear();

    configJsonParced = false;
    widgetsJsonParced = false;
    itemsJsonParced = false;
    layoutJsonParced = false;
    settingsJsonParced = false;
    ssidJsonParced = false;

    //ssidJson = {};

    if (debug) console.log("[i]", "all app data cleared");
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

  //***********************************************************dashboard***************************************************************/
  function findNewPage() {
    pages = [];
    const newPage = Array.from(new Set(Array.from(layoutJson, ({ page }) => page)));
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
    findNewPage();
  }

  //***********************************************************logging******************************************************************/
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

  //***********************************************************dev list******************************************************************/
  function devicesDropdownChange() {
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

  //****************************************************************json******************************************************************/
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
      oneOfJsonPackageError = true;
      if (debug) console.log("[e]", "json error");
      return false;
    }
    oneOfJsonPackageError = false;
    return true;
  }

  //пример как формировать массив json
  function createWidgetsDropdown() {
    let widgetsDropdown = [];
    widgetsJson.forEach((widget) => {
      widgetsDropdown.push({
        id: widget.name,
        val: widget.rus,
      });
    });
    widgetsDropdown = widgetsDropdown;
    if (debug) console.log("[i]", widgetsDropdown);
  }

  //**********************************************************post and get*****************************************************************/
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

  //**********************************************************modal*************************************************************************/
  function showModal() {
    showModalFlag = !showModalFlag;
  }

  function onCheck() {
    let width = screen.width;
    console.log("width", width);
    if (width < 900) {
      preventMove = true;
    } else {
      preventMove = false;
    }
  }

  //************************************************elements and presets dropdown************************************************************/

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

  function deleteLine(num) {
    if (debug) console.log("[i]", num);
    for (let i = 0; i < configJson.length; i++) {
      if (num === i) {
        configJson.splice(i, 1);
        configJson = configJson;
        if (debug) console.log("[i]", "item " + num + " deleted");
        break;
      }
    }
  }

  function ssidDropdownClick() {
    wsSendMsg(wsSelected, "/scan");
  }

  function returnError() {
    let ret = false;
    if (!socketConnected || oneOfJsonPackageError) {
      ret = true;
    }
    return ret;
  }

  function returnErrorName() {
    if (!socketConnected) {
      return "Нет соединения";
    } else if (oneOfJsonPackageError) {
      return "Ошибка данных";
    }
  }

  function configPageStatus() {
    if (itemsJsonParced && widgetsJsonParced && configJsonParced && settingsJsonParced) {
      return true;
    }
  }

  function pushGreen() {
    toast.push("Saved!", {
      theme: {
        "--toastBackground": "#48BB78",
        "--toastProgressBackground": "#2F855A",
      },
    });
  }

  //*******************************************************initialisation********************************************************************/
  onMount(async () => {
    console.log("[i]", "mounted");
    connectToAllDevices();
    wsTestMsgTask();
    socketConnected = selectedDeviceData.status;
    devicesDropdownChange();
    findNewPage();
  });
</script>

<div class="flex flex-col h-screen bg-gray-50">
  <Modal show={showModalFlag} />
  <header class="h-10 w-full bg-gray-100 overflow-auto shadow-md">
    <div class="flex justify-end content-center">
      <div class="px-15 py-2 z-50">
        <select bind:value={selectedDeviceData} on:change={() => devicesDropdownChange()}>
          {#each deviceList as device}
            <option value={device}>
              {device.name}
            </option>
          {/each}
        </select>
      </div>
      <div class="px-5 py-1">
        <svg class="h-8 w-8 {socketConnected === true ? 'text-green-500' : 'text-red-500'}" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"> <path stroke="none" d="M0 0h24v24H0z" /> <path d="M7 18a4.6 4.4 0 0 1 0 -9h0a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-12" /></svg>
      </div>
    </div>
  </header>

  <nav class="flex">
    <input bind:checked={opened} on:change={() => onCheck()} id="menu__toggle" type="checkbox" />
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
  </nav>

  <main class="flex-1 overflow-y-auto p-0 {opened === true && !preventMove ? 'ml-36' : 'ml-0'}">
    <ul class="menu__main">
      <div class="bg-cover pt-0 px-4">
        {#if !socketConnected}
          <div class="flex justify-center items-center">
            <div style="border-top-color:transparent" class="w-20 h-20 border-4 border-blue-400 border-solid rounded-full animate-spin" />
          </div>
        {:else}
          <Route path="/">
            <div class="grd-3cols">
              {#if layoutJson === []}
                <Card title={"Ваша панель управления пуста, вначале добавьте новые элементы в конфигураторе!"} />
              {/if}
              {#each pages as pagesName, i}
                <Card title={pagesName.page}>
                  {#each layoutJson as widget, i}
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
            </div>
          </Route>
          <Route path="/config">
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
                <table class="table-fixed w-full select-none my-2 ">
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
                        <td class="tbl-bdy"><svg on:click={() => deleteLine(i)} class="h-6 w-6 text-red-400 cursor-pointer" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <line x1="18" y1="6" x2="6" y2="18" /> <line x1="6" y1="6" x2="18" y2="18" /></svg></td>
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
          </Route>
          <Route path="/connection">
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
                <button class="btn-lg" on:click={() => saveSettings()}>{"Сохранить"}</button>
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
                <button class="btn-lg" on:click={() => saveSettings()}>{"Сохранить"}</button>
              </Card>
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
              <table class="table-fixed gap-4 w-full">
                <thead class="bg-gray-50 ">
                  <tr class="tbl-txt-sz tbl-txt-p">
                    <th class="tbl-hd">Название устройства</th>
                    <th class="tbl-hd">IP адрес</th>
                    <th class="tbl-hd">Идентификатор</th>
                    <th class="tbl-hd">Состояние</th>
                  </tr>
                </thead>
                <tbody class="bg-white">
                  {#each deviceList as device}
                    <tr class="tbl-txt-sz tbl-txt-p">
                      <td class="tbl-bdy">{device.name}</td>
                      <td class="tbl-bdy"><a href={"http://" + device.ip}>{device.ip}</a></td>
                      <td class="tbl-bdy">{device.id}</td>
                      <td class="tbl-bdy {device.status ? 'bg-green-50' : 'bg-red-50'}">{device.status ? "online" : "offline"}</td>
                    </tr>
                  {/each}
                  {#if showInput}
                    <tr class="tbl-txt-sz tbl-txt-p">
                      <td class="tbl-bdy"><input bind:value={newDevice.name} class="tbl-ipt w-full" type="text" /></td>
                      <td class="tbl-bdy"><input bind:value={newDevice.ip} class="tbl-ipt w-full" type="text" /></td>
                      <td class="tbl-bdy"><input bind:value={newDevice.id} class="tbl-ipt w-full" type="text" /></td>
                      <td class="tbl-bdy" />
                    </tr>
                  {/if}
                </tbody>
              </table>
              <button class="btn-lg" on:click={() => ((showInput = !showInput), devListSave())}>{showInput ? "Сохранить" : "Добавить устройство"}</button>
            </Card>
          </Route>
          <Route path="/about">
            <button on:click={() => showModal()} type="button"> Toggle modal </button>
            <Card title="Редактор JSON">
              <textarea on:input={wigetsUpdate} rows="10" class="jsn-ipt w-full" id="text1">{syntaxHighlight(JSON.stringify(layoutJson))}</textarea>
            </Card>
          </Route>
        {/if}
      </div>
    </ul>
  </main>

  <footer class="h-4 bg-gray-100 border-gray-200 shadow-lg"><div class="flex justify-center content-center text-xxs text-gray-500">Developed by Dmitry Borisenko</div></footer>
</div>

<style lang="postcss" global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer components {
    /*==================================================cards grid=====================================================*/
    /* grid for cards */
    .grd-3cols {
      @apply grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 justify-items-center;
    }
    /* grid for cards for full screen */
    .grd-1cols {
      @apply grid grid-cols-1 justify-items-center;
    }
    /*=============================================card and items inside===============================================*/
    /* 1. paddig and style for card */
    .crd {
      @apply w-full p-2 sm:p-2 md:p-2 lg:p-2 xl:px-8 xl:py-4 2xl:px-8 2xl:py-4 bg-white rounded-lg shadow-md lg:shadow-lg border border-gray-100;
    }
    /* 2. style for card header */
    .crd-hdr {
      @apply text-center text-lg text-gray-500 font-bold pb-4;
    }
    /* 3. card items positioning*/
    .crd-itm-psn {
      @apply flex mb-3 h-8 items-center;
    }
    /* 4. widget description width*/
    .wgt-dscr-w {
      @apply w-2/3;
    }
    /* 5. widget descr style*/
    .wgt-dscr-stl {
      @apply pr-4 text-gray-500 font-bold;
    }
    /* 6. widget width*/
    .wgt-w {
      @apply flex justify-end w-1/3;
    }
    /*====================================================others=====================================================*/
    .btn-i {
      @apply py-2 px-4 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75;
    }
    .wgt-ipt {
      @apply content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white;
    }
    .jsn-ipt {
      @apply content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500;
    }
    .wgt-adt-stl {
      @apply text-center text-gray-500 font-bold;
    }
    /*====================================================table=====================================================*/
    .tbl-hd {
      @apply text-center px-1 break-words text-gray-500 font-bold;
    }
    .tbl-bdy {
      @apply text-center px-1 break-words;
    }
    .tbl-s-bdy {
      @apply px-1 break-words;
    }
    .tbl-ipt {
      @apply content-center mt-2 h-7 bg-gray-50 focus:bg-white border-2 border-gray-100 text-gray-700 leading-tight focus:outline-none text-center focus:border-indigo-500;
    }
    .tbl-s-ipt {
      @apply content-center h-6 bg-gray-50 focus:bg-white border-2 border-gray-100 text-gray-700 leading-tight focus:outline-none text-center focus:border-indigo-500 rounded-sm;
    }
    .tbl-s-txt {
      @apply inline-block italic align-top text-right text-gray-500;
    }
    .tbl-txt-p {
      @apply px-2 py-0 sm:py-0 md:py-0 lg:py-1 xl:py-2 2xl:py-2;
    }
    .tbl-txt-sz {
      @apply text-xxs sm:text-base md:text-base lg:text-base xl:text-base 2xl:text-base;
    }
    /*====================================================buttons=====================================================*/
    .btn-lg {
      @apply flex justify-center break-words content-center bg-blue-100 hover:bg-blue-200 text-gray-500 font-bold h-8 w-full mt-0 border border-gray-300 rounded;
    }
    .btn-tbl {
      @apply flex justify-center content-center text-gray-500 font-bold w-6 h-auto border border-gray-300;
    }
    /*====================================================select=====================================================*/
    .grd-2colsfx {
      @apply grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 justify-items-center;
    }
    .grd-2cols {
      @apply grid gap-4 grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 justify-items-center;
    }
    .slct-lg {
      @apply flex w-full justify-center break-words content-center bg-blue-100 hover:bg-blue-200 text-gray-500 font-bold h-8 mb-0 border border-gray-300 rounded;
    }
  }

  #menu__toggle {
    position: relative;
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
