import React, { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function addToast(message, type = "success", duration = 2500) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }

  const value = useMemo(() => ({ addToast }), []);

  React.useEffect(() => {
    function onError(e) {
      const msg = e?.detail?.message || "Something went wrong";
      addToast(msg, "error");
    }
    function onSuccess(e) {
      const msg = e?.detail?.message || "Success";
      addToast(msg, "success");
    }
    window.addEventListener("toast:error", onError);
    window.addEventListener("toast:success", onSuccess);
    return () => {
      window.removeEventListener("toast:error", onError);
      window.removeEventListener("toast:success", onSuccess);
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 2000, display: "grid", gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            background: t.type === "error" ? "#fee2e2" : "#ecfdf5",
            color: t.type === "error" ? "#991b1b" : "#065f46",
            border: `1px solid ${t.type === "error" ? "#fecaca" : "#a7f3d0"}`,
            padding: "10px 12px",
            borderRadius: 8,
            minWidth: 220,
            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
