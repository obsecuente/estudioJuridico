import React from "react";
import "./GlassTable.css";

const GlassTable = ({ columns, children, loading }) => {
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
                <div className="spinner-sutil"></div>
                Cargando...
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
