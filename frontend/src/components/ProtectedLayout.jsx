import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar.jsx";
import { Link } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Rss, User2, Award } from "lucide-react";

export default function ProtectedLayout() {
  return (
    <div>
      <NavBar />
      <div className="container layout-grid">
        <aside className="card sidebar">
          <nav className="sidebar-nav">
            <Link className="btn btn-ghost" to="/dashboard"><span className="row"><LayoutDashboard size={18}/> <span>Dashboard</span></span></Link>
            <Link className="btn btn-ghost" to="/habits/new"><span className="row"><PlusCircle size={18}/> <span>New Habit</span></span></Link>
            <Link className="btn btn-ghost" to="/feed"><span className="row"><Rss size={18}/> <span>Feed</span></span></Link>
            <Link className="btn btn-ghost" to="/leaderboard"><span className="row"><Award size={18}/> <span>Leaderboard</span></span></Link>
            <Link className="btn btn-ghost" to="/profile"><span className="row"><User2 size={18}/> <span>Profile</span></span></Link>
          </nav>
        </aside>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
