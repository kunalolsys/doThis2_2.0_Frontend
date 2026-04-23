import axios from "axios";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "./tokenManager";
let API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

// Normalize base URL: remove trailing slash and ensure /v1 segment exists
API_BASE_URL = API_BASE_URL.replace(/\/$/, "");
if (!/\/v1($|\/)/.test(API_BASE_URL)) {
  API_BASE_URL = API_BASE_URL + "/v1";
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

// process queued requests
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// 🔹 REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🔹 RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    console.log("🔥 INTERCEPTOR HIT", err?.response?.status);

    // ❌ DO NOT INTERCEPT REFRESH API
    if (originalRequest.url.includes("/auth/refresh")) {
      console.log("⛔ Refresh itself failed");

      clearAccessToken();
      window.location.replace("/");

      return Promise.reject(err);
    }

    // ✅ HANDLE NORMAL 401
    if (
      (err.response?.status === 401 || err.response?.status === 403) &&
      !originalRequest._retry
    ) {
      console.log("🔄 TRYING REFRESH");

      originalRequest._retry = true;

      try {
        const res = await api.get("/auth/refresh");

        const newToken = res.data.accessToken;

        if (!newToken) throw new Error("No token");

        setAccessToken(newToken);

        return api({
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      } catch (refreshErr) {
        console.log("❌ FINAL LOGOUT");

        clearAccessToken();

        window.location.replace("/");

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  },
);

export default api;
