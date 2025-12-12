import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

export default function Dashboard() {
  const [stats, setStats] = useState({
    pipelines: 0,
    running: 0,
    failed: 0,
    success: 0,
  });
  const [recentBuilds, setRecentBuilds] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const navigate = useNavigate();
  const API = "http://127.0.0.1:5000";
  const socketRef = useRef(null);

  // Fetch pipelines and builds from API
  const fetchPipelines = async () => {
    try {
      const res = await fetch(`${API}/api/pipelines`);
      if (!res.ok) throw new Error("Failed to fetch pipelines");
      const data = await res.json();
      setPipelines(data);

      // derive pipeline counts if backend doesn't include stats
      const total = data.length;
      let running = 0,
        failed = 0,
        success = 0;
      data.forEach((p) => {
        const st = p.status || null;
        if (st === "running") running++;
        else if (st === "failed") failed++;
        else if (st === "success") success++;
      });

      setStats((prev) => ({ ...prev, pipelines: total, running, failed, success }));
    } catch (err) {
      console.error("Error fetching pipelines:", err);
    }
  };

  const fetchBuilds = async () => {
    try {
      const res = await fetch(`${API}/api/builds`);
      if (!res.ok) throw new Error("Failed to fetch builds");
      const data = await res.json();
      // sort by started_at desc and keep top 10
      const sorted = data
        .filter(Boolean)
        .sort((a, b) => {
          const A = a.started_at ? new Date(a.started_at) : new Date(0);
          const B = b.started_at ? new Date(b.started_at) : new Date(0);
          return B - A;
        })
        .slice(0, 10);
      setRecentBuilds(sorted);

      // if backend pipelines missing stats, we can recompute from builds:
      const running = data.filter((b) => b.status === "running").length;
      const failed = data.filter((b) => b.status === "failed").length;
      const success = data.filter((b) => b.status === "success").length;
      setStats((prev) => ({ ...prev, running, failed, success }));
    } catch (err) {
      console.error("Error fetching builds:", err);
    }
  };

  useEffect(() => {
    // initial fetch
    fetchPipelines();
    fetchBuilds();

    // setup socket
    const socket = io(API, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Dashboard socket connected:", socket.id);
    });

    // when a build updates, refresh pipelines and builds
    socket.on("build_status_update", (data) => {
      console.log("build_status_update", data);
      // quick optimistic updates: update pipeline statuses locally if possible
      fetchPipelines();
      fetchBuilds();
    });

    socket.on("build_finished", (data) => {
      console.log("build_finished", data);
      fetchPipelines();
      fetchBuilds();
    });

    // optionally, if the backend emits 'build_log' for global UI badges, handle it
    socket.on("build_log", (data) => {
      // We don't need to display logs here, but can use it to refresh counts
      // e.g. if a new build appears, update lists
      // console.log("build_log", data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("build_status_update");
        socketRef.current.off("build_finished");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 text-white min-h-screen bg-slate-950">
      {/* Overview Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-neon">🧩 CI/CD Dashboard</h1>
        <div className="space-x-3">
          <button
            onClick={() => navigate("/pipelines")}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-700"
          >
            📋 View Pipelines
          </button>
          <button
            onClick={() => navigate("/pipelines/new")}
            className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg"
          >
            ➕ New Pipeline
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 shadow-lg">
          <div className="text-slate-400">Total Pipelines</div>
          <div className="text-4xl font-bold mt-2 text-white">{stats.pipelines}</div>
        </div>
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 shadow-lg">
          <div className="text-slate-400">Running Builds</div>
          <div className="text-4xl font-bold mt-2 text-blue-400">{stats.running}</div>
        </div>
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 shadow-lg">
          <div className="text-slate-400">Failed Builds</div>
          <div className="text-4xl font-bold mt-2 text-red-400">{stats.failed}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipelines List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-neon">⚙️ Active Pipelines</h2>
          {pipelines.length === 0 ? (
            <p className="text-slate-400 text-sm">No pipelines available.</p>
          ) : (
            <div className="space-y-3">
              {pipelines.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/pipelines/${p.id}`)}
                  className="cursor-pointer bg-slate-800 hover:bg-slate-700 p-4 rounded-lg border border-slate-700 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold text-lg">{p.name}</div>
                    <div className="text-slate-400 text-sm">{p.description || "No description"}</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Created: {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Builds */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-neon">🕓 Recent Builds</h2>
          {recentBuilds.length === 0 ? (
            <p className="text-slate-400 text-sm">No builds found.</p>
          ) : (
            <ul className="space-y-3">
              {recentBuilds.map((b) => (
                <li
                  key={b.id}
                  className="flex justify-between bg-slate-800 p-3 rounded-lg border border-slate-700"
                >
                  <div>
                    <div className="font-medium">
                      {b.pipeline_name ? `${b.pipeline_name}` : `Pipeline #${b.pipeline_id}`} –{" "}
                      <span
                        className={
                          b.status === "failed"
                            ? "text-red-400"
                            : b.status === "running"
                            ? "text-blue-400"
                            : "text-green-400"
                        }
                      >
                        {b.status ? b.status.toUpperCase() : "PENDING"}
                      </span>
                    </div>
                    <div className="text-slate-500 text-xs">
                      Started {b.started_at ? new Date(b.started_at).toLocaleString() : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/pipelines/${b.pipeline_id}`)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-sm rounded"
                    >
                      🔍
                    </button>
                    <button
                      onClick={() => navigate(`/builds/${b.id}`)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sm rounded border border-slate-700"
                    >
                      Logs
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
