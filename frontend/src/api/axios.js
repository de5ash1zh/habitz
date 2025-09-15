import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

// Request interceptor: attach CSRF header for non-GET/HEAD/OPTIONS
api.interceptors.request.use((config) => {
  const method = (config.method || "get").toUpperCase();
  if (!(["GET", "HEAD", "OPTIONS"].includes(method))) {
    const csrf = getCookie("csrfToken");
    if (csrf) {
      config.headers = config.headers || {};
      config.headers["X-CSRF-Token"] = csrf;
    }
  }
  return config;
});

// Response interceptor: handle 401 by clearing auth
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      // soft-logout; actual UI logout handled via AuthContext listener
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    } else if (error?.response) {
      // dispatch a global error toast for unexpected errors
      const message = error.response.data?.message || `Error ${error.response.status}`;
      window.dispatchEvent(new CustomEvent("toast:error", { detail: { message } }));
    }
    return Promise.reject(error);
  }
);
