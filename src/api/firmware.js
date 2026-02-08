/**
 * Firmware / OTA: load ver.json from device-configured server.
 */

import { get } from "./http.js";

/**
 * Load ver.json from serverip/iotm/ver.json.
 * @param {string} serverip - base URL (e.g. from settingsJson.serverip)
 * @returns {Promise<{ ok: boolean, data?: object }>} data is full ver.json
 */
export async function getVersionsList(serverip) {
  if (!serverip) {
    console.log("error", "server missing");
    return { ok: false };
  }
  try {
    const url = serverip + "/iotm/ver.json";
    const res = await get(url);
    if (res.ok) {
      return { ok: true, data: res.data };
    }
    return { ok: false };
  } catch (e) {
    console.log("error", "versions list not received", e);
    return { ok: false };
  }
}
