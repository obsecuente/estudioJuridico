import React from "react";
import { SpinnerIcon } from "./Icons";
import EmptyState from "./EmptyState";
import "./GlassTable.css";

const GlassTable = ({ 
  columns, 
  children, 
  loading, 
  isEmpty, 
  emptyTitle, 
  emptyMessage 
}) => {
  return (
    <div className="table-wrapper-glass">
      <table className="table-glass">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="loading-cell">
                <div className="loading-container-glass">
                  <SpinnerIcon />
                  <span>Cargando datos...</span>
                </div>
              </td>
            </tr>
          ) : isEmpty ? (
            <tr>
              <td colSpan={columns.length} className="empty-cell-glass">
                <EmptyState title={emptyTitle} message={emptyMessage} />
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
};

export default GlassTable;
