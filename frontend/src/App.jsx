import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Pipelines from "./pages/Pipelines";
import PipelineDetail from "./pages/PipelineDetail";
import PipelineNew from "./pages/PipelineNew";
import BuildLogs from "./pages/BuildLogs"; // ✅ import the logs page

export default function App() {
  const linkBase =
    "transition px-3 py-2 rounded text-slate-300 hover:text-neon hover:bg-slate-800";
  const activeLink =
    "text-neon bg-slate-800 border-b-2 border-neon shadow-neon-glow";

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* Navbar */}
        <nav className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-neon">⚙️ CI/CD Monitor</h1>
            <div className="ml-8 flex space-x-2">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? activeLink : ""}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/pipelines"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? activeLink : ""}`
                }
              >
                Pipelines
              </NavLink>
              <NavLink
                to="/pipelines/new"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? activeLink : ""}`
                }
              >
                + New Pipeline
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pipelines" element={<Pipelines />} />
            <Route path="/pipelines/new" element={<PipelineNew />} />
            <Route path="/pipelines/:id" element={<PipelineDetail />} />
            <Route path="/builds/:id/logs" element={<BuildLogs />} /> {/* ✅ Add this */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}
