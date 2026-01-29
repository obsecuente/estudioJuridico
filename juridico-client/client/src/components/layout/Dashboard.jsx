import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar.jsx";
import "./Dashboard.css";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main-area">
        <Topbar onToggleMenu={() => setSidebarOpen(!sidebarOpen)} />
        <main className="dashboard-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
