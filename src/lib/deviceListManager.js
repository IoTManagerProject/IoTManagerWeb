/**
 * Device list data only: merge, sort, override/combine.
 * No sockets or pages; state updates via callbacks.
 */

/**
 * Merge arrays by unique IP (from A, then B items whose ip not in A).
 * @param {Array} A
 * @param {Array} B
 * @returns {Array}
 */
export function combineArrays(A, B) {
  const ids = new Set(A.map((d) => d.ip));
  return [...A, ...B.filter((d) => !ids.has(d.ip))];
}

/**
 * Sort list by name, keep first element at index 0.
 * Mutates list in place.
 * @param {Array} list
 */
export function sortList(list) {
  const firstDev = list.shift();
  list.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  list.unshift(firstDev);
}

/**
 * Replace deviceList with incDeviceList, sort, set first device status true.
 * @param {Array} incDeviceList
 * @returns {Array} new device list
 */
export function devListOverride(incDeviceList) {
  const list = [...incDeviceList];
  sortList(list);
  list[0].status = true;
  return list;
}

/**
 * Merge deviceList with incDeviceList by IP, sort.
 * @param {Array} deviceList
 * @param {Array} incDeviceList
 * @returns {Array} new device list
 */
export function devListCombine(deviceList, incDeviceList) {
  const list = combineArrays(deviceList, incDeviceList);
  sortList(list);
  return list;
}

/**
 * Init after receiving devlis: override or combine, then run callbacks.
 * @param {Array} deviceList
 * @param {Array} incDeviceList
 * @param {boolean} firstDevListRequest
 * @param {object} callbacks - setDeviceList(list), setFirstDevListRequest(bool), connectToAllDevices(), onParced(), selectedDeviceDataRefresh(), setParsedDeviceListJson(bool)
 */
export function initDevList(deviceList, incDeviceList, firstDevListRequest, callbacks) {
  const list = firstDevListRequest
    ? devListOverride(incDeviceList)
    : devListCombine(deviceList, incDeviceList);
  callbacks.setDeviceList(list);
  callbacks.setFirstDevListRequest(false);
  if (callbacks.setParsedDeviceListJson) callbacks.setParsedDeviceListJson(true);
  if (callbacks.onParced) callbacks.onParced();
  if (callbacks.selectedDeviceDataRefresh) callbacks.selectedDeviceDataRefresh();
  if (callbacks.connectToAllDevices) callbacks.connectToAllDevices();
}
