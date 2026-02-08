/**
 * Device connection lifecycle: getIP, connectToAllDevices, onOpen behaviour, handleDevListReceived.
 * No blob parsing; no socket implementation — receives createConnection from api.
 */

import { initDevList } from "./deviceListManager.js";

/**
 * Resolve device IP by ws index (device.ws === ws).
 * @param {number} ws
 * @param {Array} deviceList
 * @returns {string} ip or "error"
 */
export function getIP(ws, deviceList) {
  for (const device of deviceList) {
    if (device.ws === ws) return device.ip;
  }
  return "error";
}

/**
 * Iterate deviceList, assign ws = i; for each with status false/undefined call createConnection(i).
 * @param {Array} deviceList - mutated: deviceList[i].ws = i
 * @param {function} getSelectedDeviceData - (selectedWs) => void, called once at start
 * @param {number} selectedWs
 * @param {function} createConnection - (wsIndex, ip, callbacks) => void
 */
export function connectToAllDevices(deviceList, getSelectedDeviceData, selectedWs, createConnection) {
  getSelectedDeviceData(selectedWs);
  for (let i = 0; i < deviceList.length; i++) {
    deviceList[i].ws = i;
    if (deviceList[i].status === false || deviceList[i].status === undefined) {
      const ip = getIP(i, deviceList);
      if (ip !== "error") {
        createConnection(i, ip);
      }
    }
  }
}

/**
 * Build onOpen handler: mark online, send /devlist| when first and ws===0, send page name.
 * @param {object} options - markDeviceStatus(ws, bool), sendMsg(ws, msg), firstDevListRequest, currentPageName, selectedWs, sendCurrentPageNameToSelectedWs()
 * @returns {function(ws: number)} onOpen(ws)
 */
export function createOpenHandler(options) {
  const {
    markDeviceStatus,
    sendMsg,
    firstDevListRequest,
    currentPageName,
    selectedWs,
    sendCurrentPageNameToSelectedWs,
  } = options;
  return function onOpen(ws) {
    markDeviceStatus(ws, true);
    if (firstDevListRequest && ws === 0) sendMsg(ws, "/devlist|");
    if (currentPageName === "/|") {
      sendMsg(ws, currentPageName);
    } else {
      if (ws === selectedWs) sendCurrentPageNameToSelectedWs();
    }
  };
}

/**
 * When devlis blob received: run initDevList (override/combine, then connect).
 * @param {Array} incDeviceList - list from device
 * @param {Array} deviceList - current list (read)
 * @param {boolean} firstDevListRequest
 * @param {object} callbacks - setDeviceList, setFirstDevListRequest, setParsedDeviceListJson, onParced, selectedDeviceDataRefresh, connectToAllDevices
 */
export function handleDevListReceived(incDeviceList, deviceList, firstDevListRequest, callbacks) {
  initDevList(deviceList, incDeviceList, firstDevListRequest, callbacks);
}
