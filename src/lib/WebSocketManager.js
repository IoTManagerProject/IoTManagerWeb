/**
 * WebSocketManager: owns device/WS state and delegates to api/ and lib/.
 * Emits layoutJsonUpdated and deviceListUpdated for App.svelte reactivity.
 */

import * as deviceSocket from "../api/deviceSocket.js";
import * as deviceConnection from "./deviceConnection.js";
import * as deviceListManager from "./deviceListManager.js";
import * as blobProtocol from "./blobProtocol.js";
import * as wsReconnect from "./wsReconnect.js";
import { eventEmitter } from "../eventEmitter.js";

const LOG_MAX_MESSAGES = 100;
const WAITING_ACK_TIMEOUT = 18000;
const DEFAULT_RECONNECT_TIMEOUT = 60;
const debug = true;

export default class WebSocketManager {
  constructor(initialDeviceList, options = {}) {
    this.options = options;
    this.debug = options.debug !== false && debug;

    // State (mirror of App.svelte)
    this.deviceList = Array.isArray(initialDeviceList) ? [...initialDeviceList] : [];
    this.layoutJson = [];
    this.paramsJson = {};
    this.pages = [];
    this.parsed = {
      itemsJson: false,
      widgetsJson: false,
      configJson: false,
      scenarioTxt: false,
      settingsJson: false,
      ssidJson: false,
      incDeviceList: false,
      deviceListJson: false,
      errorsJson: false,
      statusJson: false,
      paramsJson: false,
      flashProfileJson: false,
      otaJson: false,
    };
    this.pageReady = {
      dash: false,
      config: false,
      connection: false,
      list: false,
      system: false,
      dev: false,
      profile: false,
    };
    this.firstDevListRequest = true;
    this.currentPageName = undefined;
    this.selectedWs = 0;
    this.selectedDeviceData = undefined;
    this.socketConnected = false;
    this.originalWs = 0;
    this.itemsJson = [];
    this.widgetsJson = [];
    this.configJson = [];
    this.scenarioTxt = " ";
    this.settingsJson = {};
    this.ssidJson = {};
    this.errorsJson = {};
    this.incDeviceList = [];
    this.flashProfileJson = {};
    this.otaJson = {};
    this.newDevice = {};
    this.coreMessages = [];
    this.reconnectTimeout = DEFAULT_RECONNECT_TIMEOUT;
    this.remainingTimeout = this.reconnectTimeout;
    this.preventReconnect = false;
    this.rebootOrUpdateProcess = false;
    this.showAwaitingCircle = false;
    this.percent = 0;
    this.userdata = null;
    this.serverOnline = false;
    this.allmodeinfo = null;
    this.profile = null;
    this.versionsList = {};
    this.choosingVersion = undefined;

    // Build blob handlers that call this.*
    this._blobHandlers = {
      setItemsJson: (v) => (this.itemsJson = v),
      setParsedItemsJson: (v) => (this.parsed.itemsJson = v),
      setWidgetsJson: (v) => (this.widgetsJson = v),
      setParsedWidgetsJson: (v) => (this.parsed.widgetsJson = v),
      setConfigJson: (v) => (this.configJson = v),
      setParsedConfigJson: (v) => (this.parsed.configJson = v),
      setScenarioTxt: (v) => (this.scenarioTxt = v),
      setSettingsJson: (v) => (this.settingsJson = v),
      setParsedSettingsJson: (v) => (this.parsed.settingsJson = v),
      setSsidJson: (v) => (this.ssidJson = v),
      setParsedSsidJson: (v) => (this.parsed.ssidJson = v),
      setErrorsJson: (v) => (this.errorsJson = v),
      setParsedErrorsJson: (v) => (this.parsed.errorsJson = v),
      setParsedIncDeviceList: (v) => (this.parsed.incDeviceList = v),
      onDevlis: async (json) => {
        this.incDeviceList = json;
        deviceConnection.handleDevListReceived(this.incDeviceList, this.deviceList, this.firstDevListRequest, {
          setDeviceList: (list) => {
            this.deviceList = list;
            eventEmitter.emit("deviceListUpdated");
          },
          setFirstDevListRequest: (v) => (this.firstDevListRequest = v),
          setParsedDeviceListJson: (v) => (this.parsed.deviceListJson = v),
          onParced: () => this.onParced(),
          selectedDeviceDataRefresh: () => this.selectedDeviceDataRefresh(),
          connectToAllDevices: () => this.connectToAllDevices(),
        });
      },
      setFlashProfileJson: (v) => (this.flashProfileJson = v),
      setParsedFlashProfileJson: (v) => (this.parsed.flashProfileJson = v),
      setOtaJson: (v) => (this.otaJson = v),
      setParsedOtaJson: (v) => (this.parsed.otaJson = v),
      addCoreMsg: (msg) => this.addCoreMsg(msg),
      onParced: () => this.onParced(),
    };

    this._allBlobHandlers = {
      updateWidget: (v) => this.updateWidget(v),
      combineLayoutsInOne: (ws, layout) => this.combineLayoutsInOne(ws, layout),
      mergeParams: (devParams) => {
        this.paramsJson = { ...this.paramsJson, ...devParams };
      },
      updateAllStatuses: (ws) => this.updateAllStatuses(ws),
      onParced: () => this.onParced(),
      apdateWidgetByArray: (v) => this.apdateWidgetByArray(v),
    };

    this.ack = wsReconnect.createAck({
      markDeviceStatus: (ws, st) => this.markDeviceStatus(ws, st),
      getDeviceList: () => this.deviceList,
      setDeviceList: (list) => {
        this.deviceList = list;
        eventEmitter.emit("deviceListUpdated");
      },
      waitingAckTimeout: WAITING_ACK_TIMEOUT,
    });

    this.wsTestMsgTask = wsReconnect.createWsTestMsgTask({
      getDeviceList: () => this.deviceList,
      send: (ws, msg) => this.wsSendMsg(ws, msg),
      markDeviceStatus: (ws, st) => this.markDeviceStatus(ws, st),
      connectDevice: (ws) => this._createConnection(ws, this.getIP(ws)),
      ack: (ws, st) => this.ack(ws, st),
      getRemainingTimeout: () => this.remainingTimeout,
      setRemainingTimeout: (v) => (this.remainingTimeout = v),
      reconnectTimeout: this.reconnectTimeout,
      getPreventReconnect: () => this.preventReconnect,
      setPercent: (v) => (this.percent = v),
      getRebootOrUpdateProcess: () => this.rebootOrUpdateProcess,
      setRebootOrUpdateProcess: (v) => (this.rebootOrUpdateProcess = v),
      getSocketConnected: () => this.socketConnected,
      setShowAwaitingCircle: (v) => (this.showAwaitingCircle = v),
      setReconnectTimeout: (v) => (this.reconnectTimeout = v),
      printAllCreatedWs: () => this._printAllCreatedWs(),
    });
  }

  getIP(ws) {
    return deviceConnection.getIP(ws, this.deviceList);
  }

  wsSendMsg(ws, msg) {
    if (deviceSocket.send(ws, msg)) {
      if (this.debug) console.log("[i]", this.getIP(ws), ws, "msg send success", msg);
    } else {
      if (this.debug) console.log("[e]", this.getIP(ws), ws, "msg not send");
    }
  }

  _createConnection(wsIndex, ip) {
    if (ip === "error") {
      if (this.debug) console.log("[e]", "device list wrong");
      return;
    }
    if (this.debug) console.log("[i]", ip, wsIndex, "started connecting...");
    deviceSocket.createConnection(wsIndex, ip, {
      onOpen: (ws) => {
        const fn = deviceConnection.createOpenHandler({
          markDeviceStatus: (w, st) => this.markDeviceStatus(w, st),
          sendMsg: (w, msg) => this.wsSendMsg(w, msg),
          firstDevListRequest: this.firstDevListRequest,
          currentPageName: this.currentPageName,
          selectedWs: this.selectedWs,
          sendCurrentPageNameToSelectedWs: () => this.sendCurrentPageNameToSelectedWs(),
        });
        fn(ws);
      },
      onMessage: (ws, data) => this._messageHandler(ws, data),
      onClose: (ws) => this.markDeviceStatus(ws, false),
      onError: (ws) => this.markDeviceStatus(ws, false),
    });
  }

  _messageHandler(ws, data) {
    if (typeof data === "string") {
      if (data === "/tstr|") this.ack(ws, true);
      return;
    }
    if (data instanceof Blob) {
      if (ws === this.selectedWs) this.parseBlob(data, ws);
      if (this.currentPageName === "/|") this.parseAllBlob(data, ws);
    }
  }

  connectToAllDevices() {
    deviceConnection.connectToAllDevices(
      this.deviceList,
      (ws) => this.getSelectedDeviceData(ws),
      this.selectedWs,
      (wsIndex, ip) => this._createConnection(wsIndex, ip)
    );
  }

  _printAllCreatedWs() {
    if (this.debug) console.log("[i]", "[ws]", "device count:", this.deviceList.length);
  }

  markDeviceStatus(ws, status) {
    this.deviceList.forEach((device) => {
      if (device.ws === ws) {
        device.status = status;
        device.ping = 0;
        if (device.status === true) {
          console.log("[i]", device.ip, ws, "status online");
        } else {
          console.log("[i]", device.ip, ws, "status offline");
          this.deleteWidget(ws);
          this.sortingLayout(ws);
        }
      }
    });
    this.selectedDeviceDataRefresh();
    eventEmitter.emit("deviceListUpdated");
  }

  deleteWidget(ws) {
    this.layoutJson = this.layoutJson.filter((item) => item.ws !== ws);
  }

  async parseBlob(blob, ws) {
    await blobProtocol.parseBlob(blob, ws, this._blobHandlers);
  }

  async parseAllBlob(blob, ws) {
    await blobProtocol.parseAllBlob(blob, ws, this._allBlobHandlers);
  }

  async onParced() {
    if (this.currentPageName === "/|") {
      this.pageReady.dash = true;
      this._emitLayoutJsonUpdated();
    }

    if (
      this.currentPageName === "/config|" &&
      this.parsed.itemsJson &&
      this.parsed.widgetsJson &&
      this.parsed.configJson &&
      this.parsed.settingsJson
    ) {
      this.clearParcedFlags();
      this.pageReady.config = true;
      this._emitLayoutJsonUpdated();
      eventEmitter.emit("configUpdated", {
        configJson: this.configJson,
        scenarioTxt: this.scenarioTxt,
        widgetsJson: this.widgetsJson,
        itemsJson: this.itemsJson,
      });
      if (this.debug) console.log("✔✔", "config page parced");
    }

    if (
      this.currentPageName === "/connection|" &&
      this.parsed.ssidJson &&
      this.parsed.settingsJson &&
      this.parsed.errorsJson
    ) {
      this.clearParcedFlags();
      if (this.debug) console.log("✔✔", "connection page parced");
      this.pageReady.connection = true;
      this._emitLayoutJsonUpdated();
      eventEmitter.emit("connectionUpdated", {
        settingsJson: this.settingsJson,
        errorsJson: this.errorsJson,
        ssidJson: this.ssidJson,
      });
    }

    if (this.currentPageName === "/list|" && this.parsed.settingsJson) {
      this.clearParcedFlags();
      if (this.debug) console.log("✔✔", "list page parced");
      this.pageReady.list = true;
      this._emitLayoutJsonUpdated();
    }

    if (this.currentPageName === "/system|" && this.parsed.errorsJson && this.parsed.settingsJson) {
      this.clearParcedFlags();
      if (this.options.onSystemParsed) await this.options.onSystemParsed();
      eventEmitter.emit("systemUpdated");
      if (this.debug) console.log("✔✔", "system page parced");
      this.pageReady.system = true;
      this._emitLayoutJsonUpdated();
    }

    if (this.currentPageName === "/profile|" && this.parsed.flashProfileJson) {
      this.clearParcedFlags();
      if (this.debug) console.log("✔✔", "profile page parced");
      this.pageReady.profile = true;
      if (this.options.onProfileParsed) await this.options.onProfileParsed();
      this._emitLayoutJsonUpdated();
    }
  }

  _emitLayoutJsonUpdated() {
    eventEmitter.emit("layoutJsonUpdated", {
      layoutJson: this.layoutJson,
      pages: this.pages,
      pageReady: { ...this.pageReady },
    });
  }

  devListOverride() {
    this.deviceList = deviceListManager.devListOverride(this.incDeviceList);
    console.log("[i]", "[devlist]", "devlist overrided");
    eventEmitter.emit("deviceListUpdated");
  }

  devListCombine() {
    this.deviceList = deviceListManager.devListCombine(this.deviceList, this.incDeviceList);
    console.log("[i]", "[devlist]", "devlist combined");
    eventEmitter.emit("deviceListUpdated");
  }

  combineArrays(A, B) {
    return deviceListManager.combineArrays(A, B);
  }

  async combineLayoutsInOne(ws, devLayout) {
    for (let i = 0; i < devLayout.length; i++) {
      devLayout[i].ws = ws;
    }
    this.layoutJson = this.layoutJson.concat(devLayout);
    console.log("[2]", ws, "devLayout pushed to layout");
    this.sortingLayout(ws);
  }

  sortingLayout(ws) {
    this.layoutJson.sort(function (a, b) {
      if (a.descr < b.descr) return -1;
      if (a.descr > b.descr) return 1;
      return 0;
    });
    this.pages = [];
    const newPage = Array.from(new Set(Array.from(this.layoutJson, ({ page }) => page)));
    newPage.forEach(function (item) {
      this.pages = [...this.pages, JSON.parse(JSON.stringify({ page: item }))];
    }, this);
    this.pages.sort(function (a, b) {
      if (a.page < b.page) return -1;
      if (a.page > b.page) return 1;
      return 0;
    });
    this.layoutJson = this.layoutJson;
    console.log("[3]", ws, "layout sort, requested params...");
    this.wsSendMsg(ws, "/params|");
    this._emitLayoutJsonUpdated();
  }

  updateAllStatuses(ws) {
    for (const [key, value] of Object.entries(this.paramsJson)) {
      for (let i = 0; i < this.layoutJson.length; i++) {
        let topic = this.layoutJson[i].topic;
        if (topic) {
          topic = topic.substring(topic.lastIndexOf("/") + 1, topic.length);
          if (key === topic) {
            console.log("[i]", "updated =>" + topic, value);
            this.layoutJson[i].status = value;
            break;
          }
        }
      }
    }
    this.wsSendMsg(ws, "/charts|");
    this._emitLayoutJsonUpdated();
  }

  updateWidget(newStatusJson) {
    for (let i = 0; i < this.layoutJson.length; i++) {
      if (this.layoutJson[i].topic === newStatusJson.topic) {
        this.layoutJson[i] = this.jsonConcat(this.layoutJson[i], newStatusJson);
        this.layoutJson[i].sent = false;
        break;
      }
    }
    this._emitLayoutJsonUpdated();
  }

  async apdateWidgetByArray(newStatusJson) {
    console.log("[i]", "collecting arrays");
    let error = true;
    if (this.layoutJson.length > 0) {
      for (let i = 0; i < this.layoutJson.length; i++) {
        if (this.layoutJson[i].topic === newStatusJson.topic) {
          error = false;
          this.layoutJson[i] = this.jsonConcatEx(this.layoutJson[i], newStatusJson);
          let prevArr = this.layoutJson[i].status;
          let newArr = newStatusJson.status;
          if (prevArr) {
            prevArr = [...prevArr, ...newArr];
            this.layoutJson[i].status = prevArr;
          } else {
            this.layoutJson[i].status = newArr;
          }
          this.layoutJson[i].sent = false;
        }
      }
    } else {
      console.log("[E]", "layoutJson missing");
    }
    if (error) console.log("[E]", "topic not found ", newStatusJson.topic);
    this._emitLayoutJsonUpdated();
  }

  jsonConcat(o1, o2) {
    for (const key in o2) {
      o1[key] = o2[key];
    }
    return o1;
  }

  jsonConcatEx(o1, o2) {
    for (const key in o2) {
      if (key !== "status") o1[key] = o2[key];
    }
    return o1;
  }

  clearData() {
    this.itemsJson = [];
    this.widgetsJson = [];
    this.configJson = [];
    this.scenarioTxt = " ";
    this.settingsJson = {};
    this.errorsJson = {};
    this.layoutJson = [];
    this.paramsJson = {};
    this.otaJson = {};
    this.flashProfileJson = {};
    for (const key of Object.keys(this.pageReady)) {
      this.pageReady[key] = false;
    }
    this.clearParcedFlags();
    if (this.debug) console.log("[i]", "all json files cleared");
    this._emitLayoutJsonUpdated();
  }

  clearParcedFlags() {
    console.log("[i]", "parced flags cleared");
    for (const key of Object.keys(this.parsed)) {
      this.parsed[key] = false;
    }
  }

  sendCurrentPageNameToSelectedWs() {
    if (this.selectedWs !== undefined) {
      this.wsSendMsg(this.selectedWs, this.currentPageName);
    }
  }

  sendToAllDevices(msg) {
    this.deviceList.forEach((device) => {
      if (device.status === true) this.wsSendMsg(device.ws, msg);
    });
  }

  getSelectedDeviceData(ws) {
    for (let i = 0; i < this.deviceList.length; i++) {
      if (this.deviceList[i].ws === ws) {
        this.selectedDeviceData = this.deviceList[i];
        break;
      }
    }
  }

  selectedDeviceDataRefresh() {
    this.getSelectedDeviceData(this.selectedWs);
    this.socketConnected = this.selectedDeviceData ? this.selectedDeviceData.status : false;
  }

  wsPush(ws, topic, status) {
    const key = topic.substring(topic.lastIndexOf("/") + 1, topic.length);
    this.wsSendMsg(ws, "/control|" + key + "/" + status);
  }

  addCoreMsg(msg) {
    if (this.coreMessages.length >= LOG_MAX_MESSAGES) this.coreMessages.shift();
    this.coreMessages = [...this.coreMessages, { msg }];
    this.coreMessages.sort(function (a, b) {
      if (a.time > b.time) return -1;
      if (a.time < b.time) return 1;
      return 0;
    });
  }

  _getInput() {
    return {
      name: "inputDate",
      widget: "input",
      size: "small",
      color: "orange",
      type: "date",
    };
  }

  _modify() {
    for (let i = 0; i < this.configJson.length; i++) {
      delete this.configJson[i]["show"];
    }
  }

  generateLayout() {
    const layout = [];
    for (let i = 0; i < this.configJson.length; i++) {
      const config = Object.assign({}, this.configJson[i]);
      const setWidget = config.widget;
      let error = true;
      for (let w = 0; w < this.widgetsJson.length; w++) {
        if (setWidget === this.widgetsJson[w].name) {
          const widget = Object.assign({}, this.widgetsJson[w]);
          widget.page = config.page;
          widget.descr = config.descr;
          widget.topic =
            this.settingsJson.mqttPrefix + "/" + this.settingsJson.id + "/" + config.id;
          if (setWidget !== "nil") layout.push(widget);
          if (widget.widget === "chart" && widget.type !== "bar") {
            const input = this._getInput();
            input.page = config.page;
            input.topic =
              this.settingsJson.mqttPrefix +
              "/" +
              this.settingsJson.id +
              "/" +
              config.id +
              "-date";
            input.descr = config.descr;
            layout.push(input);
          }
          error = false;
          break;
        } else {
          error = true;
        }
      }
      if (error) console.log("[E]", "error, widget not found: " + setWidget);
    }
    layout.sort(function (a, b) {
      if (a.descr < b.descr) return -1;
      if (a.descr > b.descr) return 1;
      return 0;
    });
    for (let i = 0; i < layout.length; i++) {
      layout[i].order = i;
    }
    return layout;
  }

  jsonArrWrite(jsonArr, idKey, idValue, paramKey, paramValue) {
    for (let i = 0; i < jsonArr.length; i++) {
      const obj = jsonArr[i];
      for (const [key, value] of Object.entries(obj)) {
        if (key === idKey && value === idValue) {
          obj[paramKey] = paramValue;
          break;
        }
      }
    }
  }

  saveConfig() {
    this.wsSendMsg(this.selectedWs, "/tuoyal|" + JSON.stringify(this.generateLayout()));
    this._modify();
    this.wsSendMsg(this.selectedWs, "/gifnoc|" + JSON.stringify(this.configJson));
    this.wsSendMsg(this.selectedWs, "/oiranecs|" + this.scenarioTxt);
    this.clearData();
    this.sendCurrentPageNameToSelectedWs();
  }

  saveSett() {
    const size = Object.keys(this.settingsJson).length;
    console.log("[i]", "settingsJson length: " + size);
    if (size > 5) {
      this.jsonArrWrite(
        this.deviceList,
        "ip",
        this.getIP(this.selectedWs),
        "name",
        this.settingsJson.name
      );
      this.wsSendMsg(this.selectedWs, "/sgnittes|" + JSON.stringify(this.settingsJson));
      eventEmitter.emit("deviceListUpdated");
    } else {
      window.alert("Ошибка размера settingsJson (возможно не был передан странице)");
    }
    this.clearData();
    this.sendCurrentPageNameToSelectedWs();
  }

  saveList() {
    const devListForSave = Object.assign([], this.deviceList);
    for (let i = 0; i < devListForSave.length; i++) {
      devListForSave[i].status = false;
    }
    this.wsSendMsg(this.selectedWs, "/tsil|" + JSON.stringify(devListForSave));
  }

  cleanLogs() {
    this.wsSendMsg(this.selectedWs, "/clean|");
  }

  saveMqtt() {
    const size = Object.keys(this.settingsJson).length;
    this.wsSendMsg(this.selectedWs, "/tuoyal|" + JSON.stringify(this.generateLayout()));
    if (size > 5) {
      this.wsSendMsg(this.selectedWs, "/sgnittes|" + JSON.stringify(this.settingsJson));
    } else {
      window.alert("Ошибка");
    }
    this.clearData();
    this.wsSendMsg(this.selectedWs, "/mqtt|");
  }

  ssidClick() {
    this.wsSendMsg(this.selectedWs, "/scan|");
  }

  rebootEsp() {
    this.rebootOrUpdateProcess = true;
    if (this.debug) console.log("[i]", "reboot...");
    this.wsSendMsg(this.selectedWs, "/reboot|");
    this.markDeviceStatus(this.selectedWs, false);
    this.showAwaitingCircle = true;
    this.socketConnected = false;
    this.reconnectTimeout = 10;
    this.remainingTimeout = this.reconnectTimeout;
  }

  updateBuild(path) {
    this.rebootOrUpdateProcess = true;
    console.log(path);
    this.wsSendMsg(this.selectedWs, "/update|" + path);
    this.showAwaitingCircle = true;
    this.socketConnected = false;
    this.reconnectTimeout = 20;
    this.remainingTimeout = this.reconnectTimeout;
  }

  applicationReboot() {
    console.log("[i]", "reboot svelte...");
    for (const key of Object.keys(this.pageReady)) {
      this.pageReady[key] = false;
    }
    this.showAwaitingCircle = true;
    setTimeout(() => {
      location.reload();
    }, 1000);
  }

  cancelAlarm(alarmKey) {
    console.log("[x]", alarmKey);
    this.errorsJson[alarmKey] = 0;
    this.wsSendMsg(this.selectedWs, '/rorre|{"' + alarmKey + '":0}');
  }

  moduleOrder(id, key, value) {
    const json = { id, key, value };
    this.wsSendMsg(this.selectedWs, "/order|" + JSON.stringify(json));
  }

  addDevInList() {
    if (
      this.newDevice.name !== undefined &&
      this.newDevice.ip !== undefined &&
      this.newDevice.id !== undefined
    ) {
      this.newDevice.status = false;
      this.newDevice.ws = this.deviceList.length;
      this.incDeviceList.push(this.newDevice);
      this.devListCombine();
      this.connectToAllDevices();
      if (this.debug) console.log("[i]", "selected device: ", this.selectedDeviceData);
      return true;
    }
    if (this.debug) console.log("[e]", "wrong data");
    return false;
  }

  startReconnectTask() {
    this.wsTestMsgTask();
  }
}
