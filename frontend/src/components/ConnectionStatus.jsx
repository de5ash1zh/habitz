import React from "react";
import { api } from "../api/axios";

export default function ConnectionStatus() {
  const [ok, setOk] = React.useState(null);
  const [ts, setTs] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    async function ping() {
      try {
        const res = await api.get("/health");
        if (!mounted) return;
        setOk(true);
        setTs(new Date(res.data?.timestamp || Date.now()).toLocaleTimeString());
      } catch (_e) {
        if (!mounted) return;
        setOk(false);
        setTs("");
      }
    }
    ping();
    const id = setInterval(ping, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <div className="card" style={{ marginTop: 16, padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 10, height: 10, borderRadius: 999, background: ok === null ? "#9CA3AF" : ok ? "#10B981" : "#EF4444" }} />
      <div style={{ fontSize: 14 }}>
        Backend: {ok === null ? "Checking..." : ok ? `OK ${ts ? `(${ts})` : ""}` : "Unavailable"}
      </div>
    </div>
  );
}
