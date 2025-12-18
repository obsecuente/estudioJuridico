import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar.jsx";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-app-container">
      <Sidebar />
      <div className="dashboard-main-area">
        <Topbar />
        <main className="dashboard-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
