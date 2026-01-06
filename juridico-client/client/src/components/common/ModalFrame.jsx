import React, { useEffect, useRef } from "react";
import "./ModalFrame.css";

const ModalFrame = ({
  title,
  onClose,
  children,
  className = "",
  /**
   * closeOnEsc: keep Escape key enabled to close for accessibility (default true)
   * overlay clicks no longer close the modal to avoid accidental dismissal
   */
  closeOnEsc = true,
}) => {
  const contentRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeOnEscRef = useRef(closeOnEsc);

  // keep refs up to date without causing the main effect to re-run
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    closeOnEscRef.current = closeOnEsc;
  }, [closeOnEsc]);

  useEffect(() => {
    // Lock background scroll while modal is open (mount)
    const prevOverflow = document.body.style.overflow || "";
    document.body.style.overflow = "hidden";

    // Save active element to restore focus later (mount)
    const prevActive = document.activeElement;

    // Move focus into the modal for keyboard users if focus is outside
    if (
      contentRef.current &&
      !contentRef.current.contains(document.activeElement)
    ) {
      contentRef.current.focus();
    }

    const onKeyDown = (e) => {
      if (e.key === "Escape" && closeOnEscRef.current) {
        if (onCloseRef.current) onCloseRef.current(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      // cleanup only on unmount
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      if (prevActive && prevActive.focus) prevActive.focus();
    };
    // Intentionally empty deps: run only on mount/unmount to avoid stealing focus on re-renders
  }, []);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`modal-content glass-card ${className}`}
        ref={contentRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()} // prevent accidental overlay-click close
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="btn-close-modal"
            onClick={() => onClose(false)}
            type="button"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};

export default ModalFrame;
