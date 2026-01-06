import "./DeleteModal.css";

const variantData = {
  danger: {
    bg: "rgba(239, 68, 68, 0.2)",
    border: "rgba(239, 68, 68, 0.5)",
    color: "#ff4d4d",
    buttonBg: "rgba(239, 68, 68, 0.8)",
    buttonHover: "#ef4444",
    symbol: "!",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.32)",
    color: "#f59e0b",
    buttonBg: "rgba(245, 158, 11, 0.9)",
    buttonHover: "#f59e0b",
    symbol: "!",
  },
  success: {
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.28)",
    color: "#10b981",
    buttonBg: "rgba(16, 185, 129, 0.9)",
    buttonHover: "#10b981",
    symbol: "✓",
  },
};

const DeleteModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = "Eliminar permanentemente",
  confirmVariant = "danger",
}) => {
  if (!isOpen) return null;

  const v = variantData[confirmVariant] || variantData.danger;

  return (
    <div className="delete-modal-overlay">
      <div className={`delete-modal-card delete-modal-${confirmVariant}`}>
        <div
          className="delete-modal-icon"
          style={{
            background: v.bg,
            border: `2px solid ${v.border}`,
            boxShadow: `0 0 15px ${v.bg}`,
          }}
        >
          <span className="warning-symbol" style={{ color: v.color }}>
            {v.symbol}
          </span>
        </div>
        <h1>{title || "Confirmar eliminación"}</h1>
        <p>
          {message || "¿Estás seguro de que deseas eliminar este registro?"}
        </p>

        <div className="delete-modal-actions">
          <button className="btn-modal-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className={`btn-modal-confirm btn-modal-${confirmVariant}`}
            onClick={onConfirm}
            style={{ background: v.buttonBg }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
