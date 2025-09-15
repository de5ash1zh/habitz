import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <h1 style={{ marginTop: 0 }}>404 - Page Not Found</h1>
      <p className="muted">The page you are looking for doesn’t exist.</p>
      <div style={{ marginTop: 16 }}>
        <Link className="btn btn-primary" to="/dashboard">Go to Dashboard</Link>
      </div>
    </div>
  );
}
