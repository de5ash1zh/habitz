import React, { useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function NavBar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  async function onLogout() {
    const ok = window.confirm("Are you sure you want to logout?");
    if (!ok) return;
    await logout();
    navigate("/login");
  }

  const linkClassName = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <Link to="/dashboard" className="brand">Habits</Link>
        <nav className="top-nav">
          <NavLink to="/dashboard" className={linkClassName}>Dashboard</NavLink>
          <NavLink to="/habits/new" className={linkClassName}>New Habit</NavLink>
          <NavLink to="/feed" className={linkClassName}>Feed</NavLink>
          <NavLink to="/profile" className={linkClassName}>Profile</NavLink>
        </nav>
        <div className="header-actions">
          {user && <span className="muted">Hi, {user.username}</span>}
          <button className="btn btn-ghost" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
}
