import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PipelineNew() {
  const navigate = useNavigate();
  const API = "http://localhost:5000";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [steps, setSteps] = useState([{ name: "Step 1", cmd: "" }]);
  const [loading, setLoading] = useState(false);

  const handleAddStep = () => {
    setSteps([...steps, { name: `Step ${steps.length + 1}`, cmd: "" }]);
  };

  const handleRemoveStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/pipelines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ Correct format (NOT double-stringified)
        body: JSON.stringify({
          name,
          description,
          branch,
          repo_url: repoUrl,
          config_json: { steps }, // ✅ Perfect JSON for backend
        }),
      });

      if (res.ok) {
        alert("✅ Pipeline created successfully!");
        navigate("/pipelines");
      } else {
        alert("❌ Failed to create pipeline");
      }
    } catch (err) {
      console.error("Error creating pipeline:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-neon">➕ Create New Pipeline</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-gray-300 mb-2">Pipeline Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-neon outline-none"
              placeholder="e.g., Build and Deploy API"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-neon outline-none"
              placeholder="Describe what this pipeline does..."
            />
          </div>

          {/* GitHub Repo */}
          <div>
            <label className="block text-gray-300 mb-2">GitHub Repository (optional)</label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repo.git"
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Branch */}
          <div>
            <label className="block text-gray-300 mb-2">Branch (optional)</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Steps */}
          <div>
            <label className="block text-gray-300 mb-2">Pipeline Steps</label>
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={step.name}
                  onChange={(e) => handleStepChange(i, "name", e.target.value)}
                  required
                  placeholder={`Step ${i + 1} name`}
                  className="w-1/3 p-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-neon outline-none"
                />
                <input
                  type="text"
                  value={step.cmd}
                  onChange={(e) => handleStepChange(i, "cmd", e.target.value)}
                  required
                  placeholder="Command to run"
                  className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-neon outline-none"
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(i)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddStep}
              className="mt-2 px-3 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded text-sm"
            >
              ➕ Add Step
            </button>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => navigate("/pipelines")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg"
            >
              ⬅ Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-lg ${
                loading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-500"
              }`}
            >
              {loading ? "Creating..." : "✅ Create Pipeline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
