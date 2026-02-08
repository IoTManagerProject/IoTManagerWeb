/**
 * Portal API: https://cloud.iotmanager.org/portal
 * Auth/user, configurations, compiler (profile, orders, etc.).
 *
 * CORS: If you see "Redirect is not allowed for a preflight request", the server
 * is redirecting OPTIONS requests (e.g. to HTTPS or login). Fix on server:
 * do not redirect preflight; return 200 with CORS headers for OPTIONS.
 */

import { get, post } from "./http.js";

/** Portal base URL; export for building links in UI (e.g. configs, build install). */
export const BASE = "https://cloud.iotmanager.org/portal";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * GET /api/user/email — current user by JWT.
 * @param {string} JWT
 * @returns {Promise<{ ok: boolean, userdata?: object, serverOnline: boolean }>}
 */
export async function getUser(JWT) {
  try {
    const res = await get(BASE + "/api/user/email", authHeaders(JWT));
    if (res.ok) {
      return { ok: true, userdata: res.data, serverOnline: true };
    }
    return { ok: false, serverOnline: true };
  } catch (e) {
    console.log("error", e);
    return { ok: false, serverOnline: false };
  }
}

/**
 * POST /api/auth/login — login, returns token in content.message.
 * @param {object} user { username, password }
 * @returns {Promise<{ ok: boolean, data: object }>}
 */
export async function login(user) {
  const res = await post(BASE + "/api/auth/login", user);
  return { ok: res.ok, data: res.data };
}

/**
 * GET /compiler/allmodinfo — all module info.
 * @returns {Promise<{ ok: boolean, allmodeinfo?: object }>}
 */
export async function getModInfo() {
  try {
    const res = await get(BASE + "/compiler/allmodinfo", { "Content-Type": "application/json" });
    if (res.ok && res.data && res.data.message) {
      return { ok: true, allmodeinfo: res.data.message };
    }
    return { ok: false };
  } catch (e) {
    console.log("error", e);
    return { ok: false };
  }
}

/**
 * GET /compiler/profile — user compiler profile (JWT).
 * @param {string} JWT
 * @returns {Promise<{ ok: boolean, profile?: object }>}
 */
export async function getProfile(JWT) {
  try {
    const res = await get(BASE + "/compiler/profile", authHeaders(JWT));
    if (res.ok && res.data && res.data.message) {
      return { ok: true, profile: res.data.message };
    }
    return { ok: false };
  } catch (e) {
    console.log("error", e);
    return { ok: false };
  }
}

/**
 * GET /api/configurations/get — list configurations (JWT).
 * @param {string} JWT
 * @returns {Promise<{ ok: boolean, configurations?: array }>}
 */
export async function getConfigurations(JWT) {
  try {
    const res = await get(BASE + "/api/configurations/get", authHeaders(JWT));
    if (res.ok) {
      return { ok: true, configurations: res.data };
    }
    return { ok: false };
  } catch (e) {
    console.log("error", e);
    return { ok: false };
  }
}

/**
 * POST /api/configurations/add — publish config (JWT, body: category, topic, text, config, scenario, gallery, type, username).
 * @param {string} JWT
 * @param {object} body
 * @returns {Promise<{ ok: boolean, data?: object, errors?: array }>}
 */
export async function addConfiguration(JWT, body) {
  try {
    const res = await post(BASE + "/api/configurations/add", body, authHeaders(JWT));
    if (res.ok && res.data) {
      return { ok: true, data: res.data };
    }
    return { ok: false, errors: res.data?.message };
  } catch (e) {
    console.log(e);
    return { ok: false };
  }
}

/**
 * GET /compiler/userorders — user build orders (JWT).
 * @param {string} JWT
 * @returns {Promise<{ ok: boolean, userBuilds?: array }>}
 */
export async function getUserOrders(JWT) {
  try {
    const res = await get(BASE + "/compiler/userorders", authHeaders(JWT));
    if (res.ok) {
      return { ok: true, userBuilds: res.data };
    }
    return { ok: false };
  } catch (e) {
    console.log("error", e);
    return { ok: false };
  }
}

/**
 * GET /compiler/delete/builds/:orderId — delete build (JWT).
 * @param {string} JWT
 * @param {string} orderId
 * @returns {Promise<{ ok: boolean }>}
 */
export async function deleteBuild(JWT, orderId) {
  try {
    const res = await get(BASE + "/compiler/delete/builds/" + orderId, authHeaders(JWT));
    return { ok: res.ok };
  } catch (e) {
    console.log("error", e);
    return { ok: false };
  }
}

/**
 * POST /compiler/order — place compiler order (JWT, body: profile with username).
 * @param {string} JWT
 * @param {object} profile
 * @returns {Promise<{ ok: boolean, data?: object, errors?: array }>}
 */
export async function placeOrder(JWT, profile) {
  try {
    const res = await post(BASE + "/compiler/order", profile, authHeaders(JWT));
    if (res.ok) {
      return { ok: true, data: res.data };
    }
    return { ok: false, errors: res.data?.message };
  } catch (e) {
    console.log(e);
    return { ok: false };
  }
}
