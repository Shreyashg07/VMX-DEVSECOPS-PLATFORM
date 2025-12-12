import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  Activity,
  Users,
  Settings,
  HelpCircle,
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  // get last segment → e.g. "/dashboard" → "dashboard"
  const activeLink = location.pathname.split("/").pop() || "dashboard";

  const navLinks = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "reports", label: "Reports", icon: FileText, path: "/reports" },
    { id: "pipelines", label: "Pipelines", icon: GitBranch, path: "/pipelines" },
    { id: "activity", label: "Log Activity", icon: Activity, path: "/activity" },
    // ✅ Renamed "User Management" to "About Developers"
    { id: "about", label: "About Developers", icon: Users, path: "/about" },
  ];

  const toolLinks = [
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
    { id: "help", label: "Help", icon: HelpCircle, path: "/help" },
  ];

  return (
    <aside className="w-64 bg-[#112240] border-r border-[#233554] min-h-screen">
      <div className="py-5">
        <div className="px-8 py-2 mb-2 text-xs uppercase text-[#8892b0] border-b border-[#233554]">
          Navigation
        </div>

        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = activeLink === link.id;

          return (
            <Link
              key={link.id}
              to={link.path}
              className={`w-full flex items-center px-8 py-3 transition-colors ${
                isActive
                  ? "bg-[#1a2a42] text-[#64ffda] border-l-4 border-[#64ffda]"
                  : "text-[#ccd6f6] hover:bg-[#1a2a42] hover:text-[#64ffda]"
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {link.label}
            </Link>
          );
        })}

        <div className="px-8 py-2 mb-2 mt-5 text-xs uppercase text-[#8892b0] border-b border-[#233554]">
          Tools
        </div>

        {toolLinks.map((link) => {
          const Icon = link.icon;
          const isActive = activeLink === link.id;

          return (
            <Link
              key={link.id}
              to={link.path}
              className={`w-full flex items-center px-8 py-3 transition-colors ${
                isActive
                  ? "bg-[#1a2a42] text-[#64ffda] border-l-4 border-[#64ffda]"
                  : "text-[#ccd6f6] hover:bg-[#1a2a42] hover:text-[#64ffda]"
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
