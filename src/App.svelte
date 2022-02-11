<script>
  //******************************************************import section*********************************************************/
  //*****************************************************************************************************************************/
  import { onMount } from "svelte";
  import { Route, router, active } from "tinro";
  router.mode.hash();

  import Alarm from "./components/Alarm.svelte";
  import Progress from "./components/Progress.svelte";

  import Modal from "./components/Modal.svelte";
  import DashboardPage from "./pages/Dashboard.svelte";
  import ConfigPage from "./pages/Config.svelte";
  import ConnectionPage from "./pages/Connection.svelte";
  import ListPage from "./pages/List.svelte";
  import SystemPage from "./pages/System.svelte";

  import UtilitiesPage from "./pages/Utilities.svelte";
  import LogPage from "./pages/Log.svelte";
  import AboutPage from "./pages/About.svelte";

  import CloudIcon from "./svg/Cloud.svelte";

  //****************************************************constants section*********************************************************/
  //******************************************************************************************************************************/
  let version = 401;
  let debug = true;
  let LOG_MAX_MESSAGES = 10;
  let reconnectTimeout = 20000;
  let rebootingTimeout = 20000;
  let opened = false;
  let preventMove = false;

  //****************************************************variable section**********************************************************/
  //******************************************************************************************************************************/
  //let myip = document.location.hostname;
  let myip = "192.168.88.235";

  //Flags
  let showInput = false;
  let showModalFlag = false;

  let additionalParams = false;

  //dashboard
  let pages = [];

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

  let layoutJson = [];
  let layoutJsonFlag = false;
  let layoutJsonParced = false;

  let settingsJson = {};
  let settingsJsonFlag = false;
  let settingsJsonParced = false;

  let errorsJson = {};
  let errorsJsonParced = false;

  let ssidJson = {};
  let ssidJsonParced = false;

  //web sockets
  let socket = [];
  let socketConnected = false;
  let selectedDeviceData = undefined;
  let selectedWs = 0;

  let flag = true;
  let newDevice = {};
  let coreMessages = [];

  let oneOfJsonPackageError = false;

  let deviceList = [];
  deviceList = [
    {
      name: "--",
      id: "--",
      ip: myip,
      status: false,
    },
  ];

  let incDeviceList = [];
  let incDeviceListParced = false;

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
      this.blob = new Blob(this.parts, {
        type: "binary",
      });
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
    //название страницы служит заголовком, поэтому отметим конец заголовка "|"
    currentPageName = currentPageName + "|";
    console.log("[i]", "user on page:", currentPageName);
    sendCurrentPageName();
  }

  //отправляем запрос данных для данной страницы и запрос данных для всех страниц - /all
  function sendCurrentPageName() {
    if (selectedWs !== undefined) {
      wsSendMsg(selectedWs, currentPageName);
      wsSendMsg(selectedWs, "/all|");
    }
  }

  //****************************************************web sockets section******************************************************/
  function connectToAllDevices() {
    //closeAllConnection();
    //socket = [];
    getSelectedDeviceData(selectedWs);
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
    //socketConnected = selectedDeviceData.status;
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
    getSelectedDeviceData(selectedWs);
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
          //if (debug) console.log("[i]", getIP(ws), "msg received", data); //
          //сборщик statusJson сообщений======================================
          if (data.includes("status")) {
            if (IsJsonParse(data)) {
              let statusJson = JSON.parse(data);
              udatelayoutJson(statusJson);
              wigetsUpdate();
              //if (debug) console.log(statusJson);
              if (debug) console.log("✔", "statusJson parced");
            }
          }
          //сборщик paramsJson сообщений======================================
          if (data.includes("params")) {
            if (IsJsonParse(data)) {
              let paramsJson = JSON.parse(data);
              //udatelayoutJson(statusJson);
              //wigetsUpdate();
              if (debug) console.log("✔", "paramsJson parced");
            }
          }
          //сборщик ssidJson сообщений======================================
          if (data.includes("ssid")) {
            if (IsJsonParse(data)) {
              ssidJson = JSON.parse(data);
              //delete ssidJson.ssid;
              ssidJson = ssidJson;
              ssidJsonParced = true;
              if (debug) console.log("✔", "ssidJson parced");
            }
          }
          //сборщик deviceList сообщений======================================
          if (data.includes("devicelist")) {
            if (IsJsonParse(data)) {
              incDeviceList = JSON.parse(data);
              //delete incDeviceList.devicelist;
              incDeviceList = incDeviceList;
              incDeviceListParced = true;
              deviceList = combineArrays(deviceList, incDeviceList);
              deviceList = deviceList;
              whenDeviceListWasUpdated();
              connectToAllDevices();
              if (debug) console.log("✔", "incDeviceList json parced");
            }
          }
          //сборщик errorsJson сообщений======================================
          if (data.includes("errors")) {
            if (IsJsonParse(data)) {
              errorsJson = JSON.parse(data);
              //delete errorsJson.errors;
              errorsJson = errorsJson;
              errorsJsonParced = true;
              if (debug) console.log("✔", "errorsJson json parced");
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
                if (debug) console.log("✔", "configJson parced");
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
                if (debug) console.log("✔", "widgetsJson parced");
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
                if (debug) console.log("✔", "itemsJson parced");
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
                if (debug) console.log("✔", "layoutJson parced");
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
                updateThisDeviceInList();
                if (debug) console.log("✔", "settingsJson parced");
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
    wsSendMsg(selectedWs, "/tuoyal|" + JSON.stringify(generateLayout()));
    wsSendMsg(selectedWs, "/gifnoc|" + JSON.stringify(configJson));
    clearData();
    sendCurrentPageName();
  }

  function saveSettings() {
    console.log("[i]", settingsJson);
    wsSendMsg(selectedWs, "/sgnittes|" + JSON.stringify(settingsJson));
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
          //widget.ws = selectedWs;
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

    errorsJson = {};

    configJsonParced = false;
    widgetsJsonParced = false;
    itemsJsonParced = false;
    layoutJsonParced = false;
    settingsJsonParced = false;
    ssidJsonParced = false;

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
          wsSendMsg(device.ws, "/tst|");
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
      pages = [
        ...pages,
        JSON.parse(
          JSON.stringify({
            page: item,
          })
        ),
      ];
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
    layoutJson = layoutJson;
  }

  //***********************************************************logging******************************************************************/
  const addCoreMsg = (msg) => {
    if (coreMessages.length > Number(LOG_MAX_MESSAGES)) {
      coreMessages = coreMessages.slice(0);
    }
    const time = new Date().getTime();
    coreMessages = [
      ...coreMessages,
      {
        time,
        msg,
      },
    ];
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

  function combineArrays(A, B) {
    var ids = new Set(A.map((d) => d.ip));
    let output = [...A, ...B.filter((d) => !ids.has(d.ip))];
    return output;
  }

  function whenDeviceListWasUpdated() {
    getSelectedDeviceData(selectedWs);
    socketConnected = selectedDeviceData.status;
  }

  function devicesDropdownChange() {
    whenDeviceListWasUpdated();
    clearData();
    sendCurrentPageName();
    if (debug) console.log("[i]", "user selected device:", selectedDeviceData.name);
    if (selectedDeviceData.ip === myip) {
      if (debug) console.log("[i]", "user selected original device", selectedDeviceData.name);
    }
  }

  function getSelectedDeviceData(ws) {
    for (let i = 0; i < deviceList.length; i++) {
      let device = deviceList[i];
      if (device.ws === ws) {
        selectedDeviceData = device;
        break;
      }
    }
  }

  function devListSave() {
    //createDefaultDevice();
    if (!showInput) {
      if (newDevice.name !== undefined && newDevice.ip !== undefined && newDevice.id !== undefined) {
        newDevice.status = false;
        deviceList.push(newDevice);
        deviceList = deviceList;
        newDevice = {};
        whenDeviceListWasUpdated();
        connectToAllDevices();
        if (debug) console.log("[i]", "selected device:", selectedDeviceData);
      } else {
        if (debug) console.log("[e]", "wrong data");
      }
    }
  }

  function updateThisDeviceInList() {
    for (let i = 0; i < deviceList.length; i++) {
      let device = deviceList[i];
      if (device.ip === myip) {
        device.name = settingsJson.name;
        device.id = settingsJson.id;
        settingsJson = settingsJson;
        break;
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
    formData.append(
      "data",
      new Blob([data], {
        type: "text/json",
      }),
      "/" + filename
    );
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

  function ssidDropdownClick() {
    wsSendMsg(selectedWs, "/scan|");
  }

  let rebootingInProgress = false;
  const myTimeout = undefined;

  function rebootEsp() {
    if (debug) console.log("[i]", "reboot...");
    wsSendMsg(selectedWs, "/reboot|");
    rebootingInProgress = true;
    myTimeout = setTimeout(rebootingTask, rebootingTimeout);
  }

  function mqttConnect() {
    errorsJson.mqtt = 8;
    console.log("[i]", settingsJson);
    wsSendMsg(selectedWs, "/sgnittes|" + JSON.stringify(settingsJson));
    //wsSendMsg(selectedWs, '/rorre|{"mqtt":8}');
    wsSendMsg(selectedWs, "/mqtt|");
    clearData();
    sendCurrentPageName();
  }

  function rebootingTask() {
    clearTimeout(myTimeout);
    connectToAllDevices();
    rebootingInProgress = false;
  }

  function cancelAlarm(alarmKey) {
    console.log("[x]", alarmKey);
    errorsJson[alarmKey] = 0;
    wsSendMsg(selectedWs, '/rorre|{"' + alarmKey + '":0}');
  }
  //*******************************************************initialisation********************************************************************/
  onMount(async () => {
    console.log("[i]", "mounted");
    connectToAllDevices();
    wsTestMsgTask();
    whenDeviceListWasUpdated();
    findNewPage();
  });
</script>

<div class="flex flex-col h-screen bg-gray-50">
  <!--{#if errorsJson.wscle === 1}-->
  <!--<Modal header={"Ошибка web sockets"} text={"Слишком много клиентов было открыто. Допускается не более четырех. Для исчезновения ошибки перезагрузите устройство"} />-->
  <!--{/if}-->
  {#if rebootingInProgress}
    <Progress />
  {/if}
  <header class="h-10 w-full bg-gray-100 overflow-auto shadow-md">
    <div class="flex content-center items-center justify-end">
      <div class="px-15 py-1">
        <select class="border border-indigo-500 border-4" bind:value={selectedWs} on:change={() => devicesDropdownChange()}>
          {#each deviceList as device}
            <option value={device.ws}>
              {device.name}
            </option>
          {/each}
        </select>
      </div>
      <div class="pl-4 pr-4 py-1">
        <CloudIcon color={socketConnected === true ? "text-green-500" : "text-red-500"} />
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
        <a class="menu__item" href="/list">{"Устройства"}</a>
      </li>
      <li>
        <a class="menu__item" href="/system">{"Системные"}</a>
      </li>
      <!--<li>-->
      <!--<a class="menu__item" href="/utilities">{"Утилиты"}</a>-->
      <!--</li>-->
      <!--<li>-->
      <!--<a class="menu__item" href="/log">{"Лог"}</a>-->
      <!--</li>-->
      <!--<li>-->
      <!--<a class="menu__item" href="/about">{"О проекте"}</a>-->
      <!--</li>-->
    </ul>
  </nav>

  <main class="flex-1 overflow-y-auto p-0 {opened === true && !preventMove ? 'ml-36' : 'ml-0'}">
    <ul class="menu__main">
      <div class="bg-cover pt-0 px-4">
        {#if !socketConnected}
          <Alarm title="Нет соединения" />
        {:else}
          <Route path="/">
            <DashboardPage layoutJson={layoutJson} pages={pages} wsPush={(ws, topic, status) => wsPush(ws, topic, status)} />
          </Route>
          <Route path="/config">
            <ConfigPage configJson={configJson} widgetsJson={widgetsJson} itemsJson={itemsJson} saveConfig={() => saveConfig()} />
          </Route>
          <Route path="/connection">
            <ConnectionPage settingsJson={settingsJson} errorsJson={errorsJson} ssidJson={ssidJson} rebootEsp={() => rebootEsp()} ssidDropdownClick={() => ssidDropdownClick()} saveSettings={() => saveSettings()} mqttConnect={() => mqttConnect()} />
          </Route>
          <Route path="/system">
            <SystemPage settingsJson={settingsJson} errorsJson={errorsJson} rebootEsp={() => rebootEsp()} cancelAlarm={(alarmKey) => cancelAlarm(alarmKey)} version={version} />
          </Route>

          <!--<Route path="/utilities">-->
          <!--<UtilitiesPage />-->
          <!--</Route>-->
          <!--<Route path="/log">-->
          <!--<LogPage coreMessages={coreMessages} />-->
          <!--</Route>-->
          <!--<Route path="/about">-->
          <!--<AboutPage wigetsUpdate={wigetsUpdate} layoutJson={layoutJson} showModal={() => showModal()} syntaxHighlight={(json) => syntaxHighlight(json)} />-->
          <!--</Route>-->
        {/if}
        <Route path="/list">
          <ListPage deviceList={deviceList} showInput={showInput} devListSave={() => devListSave()} newDevice={newDevice} />
        </Route>
      </div>
    </ul>
  </main>

  <footer class="h-4 bg-gray-100 border-gray-200 shadow-lg">
    <div class="flex justify-center content-center text-xxs text-gray-500">Developed by Dmitry Borisenko</div>
  </footer>
</div>

<style lang="postcss" global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer components {
    /*==================================================grids=====================================================*/
    .grd-1col1 {
      @apply grid grid-cols-1 justify-items-center;
    }
    .grd-2col1 {
      @apply grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 justify-items-center;
    }
    .grd-2col2 {
      @apply grid gap-4 grid-cols-2 justify-items-center;
    }
    .grd-3col1 {
      @apply grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 justify-items-center;
    }
    /*=============================================card and items inside===============================================*/
    .crd-itm-psn {
      @apply flex mb-3 h-8 items-center;
    }
    .wgt-dscr-stl {
      @apply pr-4 text-gray-500 font-bold;
    }
    /*====================================================others=====================================================*/
    .btn-i {
      @apply py-2 px-4 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75;
    }
    .wgt-adt-stl {
      @apply text-center text-gray-500 font-bold;
    }
    /*====================================================table=====================================================*/
    .tbl {
      @apply table-fixed w-full select-none my-2;
    }
    .tbl-hd {
      @apply text-center px-1 break-words text-gray-500 font-bold;
    }
    .tbl-bdy-lg {
      @apply text-center px-1 break-words;
    }
    .tbl-bdy-sm {
      @apply px-1 break-words;
    }
    /*====================================================inputs=====================================================*/
    .ipt-lg {
      @apply h-4 sm:h-7 md:h-7 lg:h-7 xl:h-7 2xl:h-7 content-center mt-2 bg-gray-50 focus:bg-white border-2 border-gray-100 text-gray-700 leading-tight focus:outline-none text-center focus:border-indigo-500;
    }
    .ipt-sm {
      @apply h-3 sm:h-6 md:h-6 lg:h-6 xl:h-6 2xl:h-6 content-center bg-gray-50 focus:bg-white border-2 border-gray-100 text-gray-700 leading-tight focus:outline-none text-center focus:border-indigo-500 rounded-sm;
    }
    .ipt-rnd {
      @apply content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white;
    }
    .ipt-big {
      @apply content-center px-2 h-8 bg-gray-50 border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500;
    }
    /*====================================================text=====================================================*/
    .txt-ita {
      @apply inline-block italic align-top text-right text-gray-500;
    }
    .txt-pad {
      @apply px-2 py-0 sm:py-0 md:py-0 lg:py-1 xl:py-2 2xl:py-2;
    }
    .txt-sz {
      @apply text-xxs sm:text-base md:text-base lg:text-base xl:text-base 2xl:text-base;
    }
    /*====================================================buttons=====================================================*/
    .btn-lg {
      @apply flex justify-center break-words content-center bg-blue-100 hover:bg-blue-200 text-gray-500 font-bold text-sm sm:text-base md:text-base lg:text-base xl:text-base 2xl:text-base h-6 sm:h-8 md:h-8 lg:h-8 xl:h-8 2xl:h-8 w-full mt-0 border border-gray-300 rounded;
    }
    .btn-tbl {
      @apply flex justify-center content-center text-gray-500 font-bold w-6 h-auto border border-gray-300;
    }
    /*====================================================select=====================================================*/
    .slct-lg {
      @apply flex w-full justify-center break-words content-center bg-blue-100 hover:bg-blue-200 text-gray-500 font-bold text-sm sm:text-base md:text-base lg:text-base xl:text-base 2xl:text-base h-6 sm:h-8 md:h-8 lg:h-8 xl:h-8 2xl:h-8 mb-0 border border-gray-300 rounded;
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
