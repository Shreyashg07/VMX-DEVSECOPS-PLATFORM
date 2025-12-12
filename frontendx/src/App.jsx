import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import Reports from "./pages/Reports";
import Pipelines from "./pages/Pipelines";
import ActivityPage from "./pages/Activity";
import AboutDevelopers from "./pages/AboutDevelopers"; // ✅ Updated import
import SettingsPage from "./pages/Settings";
import HelpPage from "./pages/Help";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Auto-login via session cookie
  useEffect(() => {
    fetch("http://localhost:4000/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .catch((err) => console.error("Auth check failed:", err));
  }, []);

  // Logout handler
  const handleLogout = async () => {
    await fetch("http://localhost:4000/api/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    navigate("/");
  };

  return (
    <div>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup onSignup={(u) => setUser(u)} />} />
        <Route path="/login" element={<Login onLogin={(u) => setUser(u)} />} />

        {/* PROTECTED ROUTES WITH SIDEBAR LAYOUT */}
        <Route
          element={
            <ProtectedRoute user={user}>
              <AppLayout handleLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/pipelines" element={<Pipelines />} />
          <Route path="/activity" element={<ActivityPage />} />
          {/* ✅ Updated route name and component */}
          <Route path="/about" element={<AboutDevelopers />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
      </Routes>
    </div>
  );
}
