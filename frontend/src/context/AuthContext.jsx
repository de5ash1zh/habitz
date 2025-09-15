import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/axios";

export const AuthContext = createContext({ user: null, loading: true, login: async () => {}, register: async () => {}, logout: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes
  let idleTimerRef = React.useRef(null);

  const bootstrap = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch (_err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const startIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(async () => {
      try {
        await api.post("/auth/logout");
      } catch (_) {}
      setUser(null);
      window.dispatchEvent(new CustomEvent("toast:success", { detail: { message: "Logged out due to inactivity" } }));
    }, INACTIVITY_MS);
  }, []);

  useEffect(() => {
    bootstrap();
    function onUnauthorized() {
      setUser(null);
    }
    window.addEventListener("auth:unauthorized", onUnauthorized);
    const reset = () => startIdleTimer();
    ["click", "keydown", "mousemove", "scroll", "touchstart"].forEach((evt) => window.addEventListener(evt, reset));
    startIdleTimer();
    async function refreshOnFocus() {
      if (document.visibilityState === "visible") {
        try { await api.post("/auth/refresh"); } catch (_) {}
      }
    }
    document.addEventListener("visibilitychange", refreshOnFocus);

    const refreshInterval = setInterval(async () => {
      try { await api.post("/auth/refresh"); } catch (_) {}
    }, 6 * 60 * 60 * 1000); // every 6 hours

    return () => {
      window.removeEventListener("auth:unauthorized", onUnauthorized);
      document.removeEventListener("visibilitychange", refreshOnFocus);
      clearInterval(refreshInterval);
    };
  }, [bootstrap, startIdleTimer]);

  const login = useCallback(async (email, password, rememberMe = false) => {
    const { data } = await api.post("/auth/login", { email, password, rememberMe });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (username, email, password, rememberMe = false) => {
    const { data } = await api.post("/auth/register", { username, email, password, rememberMe });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (_e) {}
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
