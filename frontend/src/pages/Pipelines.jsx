import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

export default function Pipelines() {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const API = "http://127.0.0.1:5000";
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // Fetch pipelines from API
  const fetchPipelines = async () => {
    try {
      const res = await fetch(`${API}/api/pipelines`);
      if (!res.ok) throw new Error("Failed to fetch pipelines");
      const data = await res.json();
      setPipelines(data);
    } catch (err) {
      console.error("Error fetching pipelines:", err);
    } finally {
      setLoading(false);
    }
  };

  // Socket.io connection
  useEffect(() => {
    fetchPipelines();

    const socket = io(API, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Pipelines socket connected:", socket.id);
    });

    socket.on("build_status_update", (data) => {
      console.log("build_status_update:", data);
      fetchPipelines();
    });

    socket.on("build_finished", (data) => {
      console.log("build_finished:", data);
      fetchPipelines();
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

  // Delete a pipeline
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this pipeline?")) return;
    try {
      const res = await fetch(`${API}/api/pipelines/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPipelines((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete pipeline");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run a pipeline
  const handleRun = async (id) => {
    try {
      const res = await fetch(`${API}/api/pipelines/${id}/run`, {
        method: "POST",
      });
      if (res.ok) {
        fetchPipelines();
        alert("🚀 Pipeline started!");
      } else {
        const txt = await res.text();
        console.error("Start failed:", txt);
        alert("❌ Failed to start pipeline");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to start pipeline (network)");
    }
  };

  // Filter pipelines by status
  const filteredPipelines =
    filter === "all"
      ? pipelines
      : pipelines.filter((p) => (p.status || "idle") === filter);

  const total = pipelines.length;
  const running = pipelines.filter((p) => p.status === "running").length;
  const success = pipelines.filter((p) => p.status === "success").length;
  const failed = pipelines.filter((p) => p.status === "failed").length;

  if (loading) {
    return (
      <div className="text-center text-gray-400 mt-20 animate-pulse">
        Loading pipelines...
      </div>
    );
  }

  return (
    <div className="p-8 text-white min-h-screen bg-slate-950">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold flex items-center gap-2 text-neon">
          ⚙️ Pipelines
        </h1>
        <button
          onClick={() => navigate("/pipelines/new")}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg"
        >
          ➕ New Pipeline
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: total, color: "text-blue-400" },
          { label: "Running", value: running, color: "text-yellow-400" },
          { label: "Success", value: success, color: "text-green-400" },
          { label: "Failed", value: failed, color: "text-red-400" },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center"
          >
            <h3 className="text-gray-400 text-sm">{stat.label}</h3>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">Filter:</span>
          {["all", "running", "success", "failed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-gray-400"
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Pipelines Grid */}
      {filteredPipelines.length === 0 ? (
        <div className="mt-20 text-center">
          <h2 className="text-xl font-semibold text-gray-300">
            No pipelines found
          </h2>
          <p className="text-gray-500 mb-6">
            You haven’t created any pipelines yet.
          </p>
          <button
            onClick={() => navigate("/pipelines/new")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg"
          >
            Create Pipeline
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPipelines.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2
                    className="text-lg font-semibold cursor-pointer hover:text-blue-400"
                    onClick={() => navigate(`/pipelines/${p.id}`)}
                  >
                    {p.name}
                  </h2>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      p.status === "success"
                        ? "bg-green-700 text-green-200"
                        : p.status === "failed"
                        ? "bg-red-700 text-red-200"
                        : p.status === "running"
                        ? "bg-yellow-600 text-yellow-100 animate-pulse"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {p.status ? p.status.toUpperCase() : "IDLE"}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-3">
                  {p.description || "No description provided"}
                </p>

                <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-3">
                  <span className="bg-slate-800 px-2 py-1 rounded">
                    Branch: {p.config_json?.branch || "main"}
                  </span>
                  <span className="bg-slate-800 px-2 py-1 rounded">
                    Builds: {p.builds_count ?? 0}
                  </span>
                </div>

                {p.status === "running" && (
                  <div className="relative w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                    <div className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 animate-[move_2s_linear_infinite]" />
                  </div>
                )}

                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Last Run:{" "}
                    {p.last_run
                      ? new Date(p.last_run).toLocaleString()
                      : "—"}
                  </span>
                  <span>
                    Created:{" "}
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleRun(p.id)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-500 text-sm rounded"
                >
                  ▶ Run
                </button>
                <button
                  onClick={() => navigate(`/pipelines/${p.id}`)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-sm rounded"
                >
                  🔍 Details
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-sm rounded"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
