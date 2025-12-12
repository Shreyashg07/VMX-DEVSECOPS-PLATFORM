import React from 'react'
import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-700 to-blue-500 flex items-center justify-center shadow-neon-glow">
          <span className="text-xl font-bold text-white" style={{textShadow:'0 0 8px rgba(110,231,255,0.8)'}}>PX</span>
        </div>
        <div>
          <div className="text-lg font-semibold">PipelineX</div>
          <div className="text-xs text-slate-400">CI/CD pipelines — subpage</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <nav className="flex gap-3">
          <Link to="/" className="text-slate-300 hover:text-white">Dashboard</Link>
          <Link to="/pipelines" className="text-slate-300 hover:text-white">Pipelines</Link>
        </nav>

        {/* User profile placeholder (connection path intentionally empty for later integration) */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">JS</div>
          <div className="text-right text-sm">
            <div className="text-white">John Doe</div>
            <div className="text-xs text-slate-400">Dev</div>
          </div>
        </div>
      </div>
    </header>
  )
}
