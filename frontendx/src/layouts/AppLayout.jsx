import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 bg-[#061328] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
