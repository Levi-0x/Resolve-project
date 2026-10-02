// Shared by every page. Local pages talk to the local backend, the deployed site talks to Render.
const API_BASE = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://localhost:3000"
  : "https://resolve-project.onrender.com";

const Session = {
  save({ accessToken, refreshToken, user }) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
  },
  setUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
  },
  get token() {
    return localStorage.getItem("accessToken");
  },
  get refreshToken() {
    return localStorage.getItem("refreshToken");
  },
  get user() {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  },
  clear() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },
};

// ---------- login state / guards ----------

function isLoginPage() {
  const page = window.location.pathname.split("/").pop();
  return page === "" || page === "index.html";
}

function redirectToLogin() {
  if (!isLoginPage()) window.location.replace("./index.html");
}

function logout() {
  Session.clear();
  window.location.replace("./index.html");
}

// Call at the top of a protected page. Not logged in -> login page.
// Logged in with the wrong role -> that person's own dashboard.
function requireRole(role) {
  const user = Session.user;
  if (!Session.token || !user) {
    redirectToLogin();
    return false;
  }
  if (user.role !== role) {
    window.location.replace(user.role === "admin" ? "./admin-dashboard.html" : "./user-dashboard.html");
    return false;
  }
  return true;
}

// ---------- requests ----------

// Uses the refresh token to get a new access token. true = it worked.
async function renewAccessToken() {
  if (!Session.refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/user/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: Session.refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem("accessToken", data.accessToken);
    return true;
  } catch {
    return false;
  }
}

// Returns the parsed JSON body. Throws an Error whose message is the server's
// "detail" text, so pages can show it directly. With auth: true, an expired
// access token is renewed once automatically; if that fails the user is logged out.
async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
  async function send() {
    const headers = {};
    if (body) headers["Content-Type"] = "application/json";
    if (auth && Session.token) headers.Authorization = `Bearer ${Session.token}`;

    try {
      return await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      if (window.location.protocol === "file:") {
        throw new Error("Open this page with Live Server (http://127.0.0.1:5500), not by double-clicking the file.");
      }
      throw new Error("Cannot reach the server. Check that the backend is running.");
    }
  }

  let res = await send();

  if (res.status === 401 && auth) {
    if (await renewAccessToken()) res = await send();
    if (res.status === 401) {
      Session.clear();
      redirectToLogin();
      throw new Error("Your session has expired. Please log in again.");
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Something went wrong");
  return data;
}

// ---------- display helpers ----------

// Anything that came from a user must go through this before it is put in innerHTML.
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);
}

// API status text -> CSS class for the coloured pill
const STATUS_CLASS = { Pending: "pending", "In Progress": "inProgress", Resolved: "resolved" };
const STATUSES = ["Pending", "In Progress", "Resolved"];

function statusPill(status) {
  return `<span class="statusPill ${STATUS_CLASS[status] || ""}">${escapeHtml(status)}</span>`;
}

// 2026-04-13T10:00:00Z -> "13th Apr 2026"
function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = d.getDate();
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th");
  const month = d.toLocaleString("en-GB", { month: "short" });
  return `${day}${suffix} ${month} ${d.getFullYear()}`;
}

// a full-width row for "nothing here yet" / error text inside a table body
function messageRow(colspan, text) {
  return `<tr><td colspan="${colspan}" class="emptyRow">${escapeHtml(text)}</td></tr>`;
}
