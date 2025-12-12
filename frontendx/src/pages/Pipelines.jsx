import { useState, useEffect } from "react";
import axios from "axios";
import DashboardCard from "../components/DashboardCard";
import { GitBranch, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function Pipelines() {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5000/api/pipelines");
        if (Array.isArray(res.data)) {
          setPipelines(res.data);
        } else {
          console.warn("⚠️ Unexpected API format:", res.data);
          setPipelines([]);
        }
      } catch (err) {
        console.error("❌ Error fetching pipelines:", err.message);
        setPipelines([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Optional auto-refresh every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "running":
        return <Clock className="w-5 h-5 text-[#64ffda] animate-spin" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <GitBranch className="w-5 h-5 text-[#8892b0]" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-400";
      case "running":
        return "text-[#64ffda]";
      case "failed":
        return "text-red-400";
      default:
        return "text-[#8892b0]";
    }
  };

  const total = pipelines.length;
  const successCount = pipelines.filter((p) => p.status === "success").length;
  const runningCount = pipelines.filter((p) => p.status === "running").length;
  const failedCount = pipelines.filter((p) => p.status === "failed").length;
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;

  return (
    <div className="p-6">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">CI/CD Pipelines</h1>
        <p className="text-[#8892b0]">
          Monitor and analyze pipeline executions, performance, and reliability.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-[#8892b0] py-10 animate-pulse">
          Loading pipelines...
        </div>
      ) : (
        <>
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            <DashboardCard title="Total Pipelines">
              <p className="text-4xl font-bold text-[#64ffda]">{total}</p>
            </DashboardCard>

            <DashboardCard title="Success Rate">
              <p className="text-4xl font-bold text-green-400">{successRate}%</p>
            </DashboardCard>

            <DashboardCard title="Running Pipelines">
              <p className="text-4xl font-bold text-[#64ffda]">{runningCount}</p>
            </DashboardCard>

            <DashboardCard title="Failed Pipelines">
              <p className="text-4xl font-bold text-red-400">{failedCount}</p>
            </DashboardCard>
          </div>

          {/* Pipeline Executions List */}
          <DashboardCard title="Pipeline Executions">
            {Array.isArray(pipelines) && pipelines.length > 0 ? (
              <div className="space-y-3">
                {pipelines.map((pipeline) => (
                  <div
                    key={pipeline.id}
                    className="p-4 bg-[#0a1929] rounded-lg border border-[#233554] hover:border-[#64ffda] transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(pipeline.status)}
                        <div>
                          <h3 className="text-[#ccd6f6] font-semibold">
                            {pipeline.name || "Unnamed Pipeline"}
                          </h3>
                          <p className="text-[#8892b0] text-sm">
                            ID:{" "}
                            <span className="text-[#64ffda]">{pipeline.id}</span>{" "}
                            • Runtime:{" "}
                            <span className="text-[#64ffda]">
                              {pipeline.runtime || "N/A"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-semibold ${getStatusColor(
                            pipeline.status
                          )}`}
                        >
                          {pipeline.status
                            ? pipeline.status.charAt(0).toUpperCase() +
                              pipeline.status.slice(1)
                            : "Unknown"}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar (for running) */}
                    {pipeline.status === "running" && (
                      <div className="w-full bg-[#1a2a42] rounded-full h-2">
                        <div
                          className="bg-[#64ffda] h-full animate-pulse"
                          style={{ width: "60%" }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                No pipelines found.
              </p>
            )}
          </DashboardCard>
        </>
      )}
    </div>
  );
}
