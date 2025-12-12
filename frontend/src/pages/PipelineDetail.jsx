import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

export default function PipelineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState(null);
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const API = "http://localhost:5000";

  useEffect(() => {
    fetchPipeline();
  }, [id]);

  const fetchPipeline = async () => {
    try {
      const res = await fetch(`${API}/api/pipelines/${id}`);
      const data = await res.json();
      setPipeline(data);
      setLogs(data.logs || []);
      setHistory(data.history || []);
    } catch (err) {
      console.error("Error loading pipeline:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    try {
      const res = await fetch(`${API}/api/pipelines/${id}/run`, { method: "POST" });
      if (res.ok) {
        alert("🚀 Pipeline started!");
        fetchPipeline();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this pipeline?")) return;
    try {
      const res = await fetch(`${API}/api/pipelines/${id}`, { method: "DELETE" });
      if (res.ok) navigate("/pipelines");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !pipeline) {
    return (
      <div className="text-center text-gray-400 mt-20 animate-pulse">
        Loading pipeline details...
      </div>
    );
  }

  const stages = pipeline.stages || [
    { name: "Build", status: "success" },
    { name: "Test", status: "running" },
    { name: "Deploy", status: "pending" },
  ];

  return (
    <div className="p-8 text-white bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-1 flex items-center gap-2">
            ⚙️ {pipeline.name}
          </h1>
          <p className="text-gray-400 text-sm">{pipeline.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm"
          >
            ▶ Run Pipeline
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm"
          >
            🗑 Delete
          </button>
          <button
            onClick={() => navigate("/pipelines")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
          >
            ⬅ Back
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 mb-6">
        <span
          className={`px-3 py-1 text-sm rounded ${
            pipeline.status === "success"
              ? "bg-green-700 text-green-200"
              : pipeline.status === "failed"
              ? "bg-red-700 text-red-200"
              : pipeline.status === "running"
              ? "bg-yellow-600 text-yellow-100 animate-pulse"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          Status: {pipeline.status?.toUpperCase() || "IDLE"}
        </span>
        <span className="text-gray-400 text-sm">
          Last Run: {pipeline.last_run || "—"}
        </span>
      </div>

      {/* Stages (Jenkins-like visualization) */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Pipeline Stages</h2>
        <div className="flex items-center justify-start gap-6 overflow-x-auto pb-4">
          {stages.map((stage, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`p-4 rounded-full border-2 text-center w-20 h-20 flex items-center justify-center font-semibold
                  ${
                    stage.status === "success"
                      ? "border-green-500 bg-green-900/30 text-green-300"
                      : stage.status === "failed"
                      ? "border-red-500 bg-red-900/30 text-red-300"
                      : stage.status === "running"
                      ? "border-yellow-400 bg-yellow-800/30 text-yellow-200 animate-pulse"
                      : "border-slate-700 bg-slate-800 text-gray-400"
                  }`}
              >
                {stage.name}
              </div>
              {index < stages.length - 1 && (
                <div className="w-10 h-1 bg-slate-700"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Logs section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-3">🧾 Build Logs</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 max-h-80 overflow-y-auto font-mono text-sm text-gray-300">
          {logs.length > 0 ? (
            logs.map((line, i) => <div key={i}>{line}</div>)
          ) : (
            <div className="text-gray-500 italic">No logs available</div>
          )}
        </div>
      </div>

      {/* Build History */}
      <div>
        <h2 className="text-xl font-semibold mb-3">🕒 Build History</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800 text-gray-400 uppercase text-xs">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((h, i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-800 hover:bg-slate-800/50"
                  >
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 text-gray-300">{h.date}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          h.status === "success"
                            ? "bg-green-700 text-green-200"
                            : h.status === "failed"
                            ? "bg-red-700 text-red-200"
                            : h.status === "running"
                            ? "bg-yellow-600 text-yellow-100"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {h.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">{h.duration || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-gray-500 p-4">
                    No history available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
