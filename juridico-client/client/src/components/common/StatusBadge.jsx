// components/common/StatusBadge.jsx
import React from "react";
import "./StatusBadge.css";

const StatusBadge = ({ status }) => {
  const config = {
    pendiente: { text: "Pendiente", className: "badge-pendiente" },
    en_progreso: { text: "En Progreso", className: "badge-progreso" },
    resuelta: { text: "Resuelta", className: "badge-resuelta" },
  };

  const { text, className } = config[status] || {
    text: status,
    className: "badge-default",
  };

  return <span className={`status-badge ${className}`}>{text}</span>;
};

export default StatusBadge;
