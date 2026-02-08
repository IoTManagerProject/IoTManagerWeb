/**
 * Generic fetch wrapper: JSON, errors, headers.
 * Returns { ok, data, status, statusText } or throws on network error.
 */

const DEFAULT_OPTIONS = {
  mode: "cors",
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<{ ok: boolean, data?: any, status: number, statusText: string }>}
 */
export async function request(url, options = {}) {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    headers: {
      ...DEFAULT_OPTIONS.headers,
      ...(options.headers || {}),
    },
  };
  const res = await fetch(url, opts);
  let data;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text();
  }
  return {
    ok: res.ok,
    data,
    status: res.status,
    statusText: res.statusText,
  };
}

/**
 * GET request, returns parsed JSON when possible.
 */
export async function get(url, headers = {}) {
  return request(url, { method: "GET", headers });
}

/**
 * POST request with JSON body.
 */
export async function post(url, body, headers = {}) {
  return request(url, {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body || {}),
    headers,
  });
}
