/**
 * Blob protocol: 6-byte header, 4-byte size (text), then payload.
 * Helpers: getPayloadAsJson, getPayloadAsTxt, getJsonAsJson.
 * parseBlob / parseAllBlob invoke callbacks for each header; no state.
 */

/**
 * Parse size string from blob (bytes 7-11) to number.
 * @param {string} sizeStr
 * @returns {number}
 */
function parseSize(sizeStr) {
  const n = parseInt(sizeStr, 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Payload as JSON (bytes size..length). Out: { json, parse }.
 */
export async function getPayloadAsJson(blob, size, out) {
  const sizeNum = typeof size === "string" ? parseSize(size) : size;
  const partBlob = blob.slice(sizeNum, blob.length);
  const txt = await partBlob.text();
  try {
    out.json = JSON.parse(txt);
    out.parse = true;
  } catch (e) {
    out.parse = false;
  }
  return out.parse;
}

/**
 * Payload as text (bytes size..length).
 */
export async function getPayloadAsTxt(blob, size) {
  const sizeNum = typeof size === "string" ? parseSize(size) : size;
  const txtBlob = blob.slice(sizeNum, blob.length);
  return await txtBlob.text();
}

/**
 * JSON from bytes 12..size (charta metadata only).
 */
export async function getJsonAsJson(blob, size, out) {
  const sizeNum = typeof size === "string" ? parseSize(size) : size;
  const partBlob = blob.slice(12, sizeNum);
  const txt = await partBlob.text();
  try {
    out.json = JSON.parse(txt);
    out.parse = true;
  } catch (e) {
    out.parse = false;
  }
  return out.parse;
}

/**
 * Read header (6 bytes) and size (4 bytes) from blob.
 */
export async function readHeader(blob) {
  const blobHeader = blob.slice(0, 6);
  const header = await blobHeader.text();
  const blobSize = blob.slice(7, 11);
  const size = await blobSize.text();
  return { header, size };
}

/**
 * parseBlob: selected device blobs. Calls handlers per header, then onParced.
 * Handlers: setItemsJson, setWidgetsJson, setConfigJson, setScenarioTxt, setSettingsJson,
 * setSsidJson, setErrorsJson, onDevlis(incDeviceList), setFlashProfileJson, setOtaJson, addCoreMsg, onParced.
 * For each *Json also setParsed* (e.g. setParsedItemsJson(true)).
 */
export async function parseBlob(blob, ws, handlers) {
  const { header, size } = await readHeader(blob);
  const out = {};

  if (header === "itemsj") {
    if (await getPayloadAsJson(blob, size, out)) {
      handlers.setItemsJson(out.json);
      if (handlers.setParsedItemsJson) handlers.setParsedItemsJson(true);
    } else if (handlers.setParsedItemsJson) handlers.setParsedItemsJson(false);
  }
  if (header === "widget") {
    if (await getPayloadAsJson(blob, size, out)) {
      handlers.setWidgetsJson(out.json);
      if (handlers.setParsedWidgetsJson) handlers.setParsedWidgetsJson(true);
    } else if (handlers.setParsedWidgetsJson) handlers.setParsedWidgetsJson(false);
  }
  if (header === "config") {
    if (await getPayloadAsJson(blob, size, out)) {
      handlers.setConfigJson(out.json);
      if (handlers.setParsedConfigJson) handlers.setParsedConfigJson(true);
    } else if (handlers.setParsedConfigJson) handlers.setParsedConfigJson(false);
  }
  if (header === "scenar") {
    const txt = await getPayloadAsTxt(blob, size);
    handlers.setScenarioTxt(txt);
  }
  if (header === "settin") {
    if (await getPayloadAsJson(blob, size, out)) {
      handlers.setSettingsJson(out.json);
      if (handlers.setParsedSettingsJson) handlers.setParsedSettingsJson(true);
    } else if (handlers.setParsedSettingsJson) handlers.setParsedSettingsJson(false);
  }
  if (header === "ssidli") {
    if (await getPayloadAsJson(blob, size, out)) {
      handlers.setSsidJson(out.json);
      if (handlers.setParsedSsidJson) handlers.setParsedSsidJson(true);
    } else if (handlers.setParsedSsidJson) handlers.setParsedSsidJson(false);
  }
  if (header === "errors") {
    if (await getPayloadAsJson(blob, size, out)) {
      handlers.setErrorsJson(out.json);
      if (handlers.setParsedErrorsJson) handlers.setParsedErrorsJson(true);
    } else if (handlers.setParsedErrorsJson) handlers.setParsedErrorsJson(false);
  }
  if (header === "devlis") {
    if (await getPayloadAsJson(blob, size, out)) {
      if (handlers.setParsedIncDeviceList) handlers.setParsedIncDeviceList(true);
      if (handlers.onDevlis) await handlers.onDevlis(out.json);
    } else if (handlers.setParsedIncDeviceList) handlers.setParsedIncDeviceList(false);
  }
  if (header === "prfile") {
    if (await getPayloadAsJson(blob, size, out)) {
      handlers.setFlashProfileJson(out.json);
      if (handlers.setParsedFlashProfileJson) handlers.setParsedFlashProfileJson(true);
    } else if (handlers.setParsedFlashProfileJson) handlers.setParsedFlashProfileJson(false);
  }
  if (header === "otaupd") {
    if (await getPayloadAsJson(blob, size, out)) {
      handlers.setOtaJson(out.json);
      if (handlers.setParsedOtaJson) handlers.setParsedOtaJson(true);
    } else if (handlers.setParsedOtaJson) handlers.setParsedOtaJson(false);
  }
  if (header === "corelg") {
    const txt = await getPayloadAsTxt(blob, size);
    if (handlers.addCoreMsg) handlers.addCoreMsg(txt);
  }

  if (handlers.onParced) await handlers.onParced();
}

/**
 * parseAllBlob: dashboard blobs (layout, status, params, charta, chartb).
 * Handlers: updateWidget(statusJson), combineLayoutsInOne(ws, devLayout), mergeParams(devParams), updateAllStatuses(ws), onParced, apdateWidgetByArray(data).
 */
export async function parseAllBlob(blob, ws, handlers) {
  const { header, size } = await readHeader(blob);
  console.log("[layout] parseAllBlob header:", header, "ws:", ws);
  const out = {};

  if (header === "status") {
    if (await getPayloadAsJson(blob, size, out)) handlers.updateWidget(out.json);
  }
  if (header === "layout") {
    if (await getPayloadAsJson(blob, size, out)) {
      const arr = Array.isArray(out.json) ? out.json : [];
      console.log("[layout] blob header=layout", "ws:", ws, "payload length:", arr.length);
      handlers.combineLayoutsInOne(ws, out.json);
    }
  }
  if (header === "params") {
    if (await getPayloadAsJson(blob, size, out)) {
      handlers.mergeParams(out.json);
      if (handlers.updateAllStatuses) handlers.updateAllStatuses(ws);
      if (handlers.onParced) await handlers.onParced();
    }
  }
  if (header === "charta") {
    // Two fragments: payload size..length is array text; metadata 12..size is JSON
    const txt = await getPayloadAsTxt(blob, size);
    const fixedTxt = "[" + txt.substring(0, txt.length - 1) + "]";
    let chartJson;
    try {
      chartJson = JSON.parse(fixedTxt);
    } catch {
      return;
    }
    const addOut = {};
    if (!(await getJsonAsJson(blob, size, addOut))) return;
    const finalDataJson = { status: chartJson, ...addOut.json };
    if (handlers.apdateWidgetByArray) handlers.apdateWidgetByArray(finalDataJson);
  }
  if (header === "chartb") {
    if (await getPayloadAsJson(blob, size, out)) {
      if (handlers.apdateWidgetByArray) handlers.apdateWidgetByArray(out.json);
    }
  }
}
