import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import HabitNew from "./pages/HabitNew.jsx";
import HabitEdit from "./pages/HabitEdit.jsx";
import Feed from "./pages/Feed.jsx";
import Profile from "./pages/Profile.jsx";
import ProtectedLayout from "./components/ProtectedLayout.jsx";
import NotFound from "./pages/NotFound.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";

export const App = () => {
  return (
    <Routes>
      {/* Root redirect -> dashboard; ProtectedRoute will redirect to /login if unauthenticated */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/habits/new" element={<HabitNew />} />
          <Route path="/habits/:id/edit" element={<HabitEdit />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
