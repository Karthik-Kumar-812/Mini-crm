
const API_BASE_URL = "http://localhost:5000";

// Keys used in localStorage
const STORAGE_TOKEN_KEY = "minicrm_token";
const STORAGE_ADMIN_KEY = "minicrm_admin";
const STORAGE_THEME_KEY = "minicrm_theme";

function initTheme() {
  const saved = localStorage.getItem(STORAGE_THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);

  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(STORAGE_THEME_KEY, next);
    });
  }
}

function getToken() {
  return localStorage.getItem(STORAGE_TOKEN_KEY);
}

function getStoredAdmin() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_ADMIN_KEY) || "null");
  } catch {
    return null;
  }
}

function setSession(token, admin) {
  localStorage.setItem(STORAGE_TOKEN_KEY, token);
  localStorage.setItem(STORAGE_ADMIN_KEY, JSON.stringify(admin));
}

function clearSession() {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_ADMIN_KEY);
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearSession();
    window.location.href = "login.html";
    throw new Error("Session expired");
  }

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

document.addEventListener("DOMContentLoaded", initTheme);
