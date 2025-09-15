import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function PublicRoute() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
