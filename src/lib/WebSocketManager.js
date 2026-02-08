/**
 * WebSocketManager: owns device/WS state and delegates to api/ and lib/.
 * Emits layoutJsonUpdated and deviceListUpdated for App.svelte reactivity.
 */

import * as deviceSocket from "../api/deviceSocket.js";
import * as deviceConnection from "./deviceConnection.js";
import * as deviceListManager from "./deviceListManager.js";
import * as blobProtocol from "./blobProtocol.js";
import * as wsReconnect from "./wsReconnect.js";
import { sanitizeScenario } from "./scenarioUtils.js";
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
      setPercent: (v) => {
        this.percent = v;
        eventEmitter.emit("reconnectTick", {
          percent: this.percent,
          remainingTimeout: this.remainingTimeout,
        });
      },
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
      configJson: this.configJson,
      scenarioTxt: this.scenarioTxt,
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
    this.layoutJson.sort((a, b) => (a.descr || "").localeCompare(b.descr || ""));
    const pageSet = new Set(this.layoutJson.map((w) => w.page));
    this.pages = [...pageSet].sort((a, b) => a.localeCompare(b)).map((page) => ({ page }));
    if (this.debug) console.log("[3]", ws, "layout sort, requested params...");
    this.wsSendMsg(ws, "/params|");
    this._emitLayoutJsonUpdated();
  }

  updateAllStatuses(ws) {
    const topicToIndex = new Map();
    for (let i = 0; i < this.layoutJson.length; i++) {
      const t = this.layoutJson[i].topic;
      if (t) topicToIndex.set(t.slice(t.lastIndexOf("/") + 1), i);
    }
    for (const [key, value] of Object.entries(this.paramsJson)) {
      const i = topicToIndex.get(key);
      if (i !== undefined) {
        if (this.debug) console.log("[i]", "updated =>" + key, value);
        this.layoutJson[i].status = value;
      }
    }
    this.wsSendMsg(ws, "/charts|");
    this._emitLayoutJsonUpdated();
  }

  updateWidget(newStatusJson) {
    const i = this.layoutJson.findIndex((w) => w.topic === newStatusJson.topic);
    if (i === -1) return;
    this.jsonConcat(this.layoutJson[i], newStatusJson);
    this.layoutJson[i].sent = false;
    this._emitLayoutJsonUpdated();
  }

  apdateWidgetByArray(newStatusJson) {
    const i = this.layoutJson.findIndex((w) => w.topic === newStatusJson.topic);
    if (i === -1) {
      if (this.debug) console.log("[E]", "topic not found", newStatusJson.topic);
      this._emitLayoutJsonUpdated();
      return;
    }
    this.jsonConcatEx(this.layoutJson[i], newStatusJson);
    const prev = this.layoutJson[i].status;
    const next = newStatusJson.status;
    this.layoutJson[i].status = Array.isArray(prev) ? [...prev, ...(next || [])] : next || [];
    this.layoutJson[i].sent = false;
    this._emitLayoutJsonUpdated();
  }

  jsonConcat(o1, o2) {
    Object.assign(o1, o2);
    return o1;
  }

  jsonConcatEx(o1, o2) {
    for (const key of Object.keys(o2)) {
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
    this.selectedDeviceData = this.deviceList.find((d) => d.ws === ws);
  }

  selectedDeviceDataRefresh() {
    this.getSelectedDeviceData(this.selectedWs);
    this.socketConnected = this.selectedDeviceData ? this.selectedDeviceData.status : false;
  }

  wsPush(ws, topic, status) {
    const key = topic.slice(topic.lastIndexOf("/") + 1);
    this.wsSendMsg(ws, "/control|" + key + "/" + status);
  }

  addCoreMsg(msg) {
    if (this.coreMessages.length >= LOG_MAX_MESSAGES) this.coreMessages.shift();
    this.coreMessages.push({ msg, time: Date.now() });
    this.coreMessages.sort((a, b) => (b.time || 0) - (a.time || 0));
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
    const { mqttPrefix = "", id: settingsId = "" } = this.settingsJson;
    const prefix = `${mqttPrefix}/${settingsId}/`;
    const layout = [];
    for (const config of this.configJson) {
      const widget = this.widgetsJson.find((w) => w.name === config.widget);
      if (!widget) {
        if (this.debug) console.log("[E]", "widget not found:", config.widget);
        continue;
      }
      if (config.widget !== "nil") {
        const item = { ...widget, page: config.page, descr: config.descr, topic: prefix + config.id };
        layout.push(item);
        if (item.widget === "chart" && item.type !== "bar") {
          layout.push({
            ...this._getInput(),
            page: config.page,
            descr: config.descr,
            topic: prefix + config.id + "-date",
          });
        }
      }
    }
    layout.sort((a, b) => (a.descr || "").localeCompare(b.descr || ""));
    layout.forEach((item, i) => (item.order = i));
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
    this.wsSendMsg(this.selectedWs, "/oiranecs|" + sanitizeScenario(this.scenarioTxt));
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
