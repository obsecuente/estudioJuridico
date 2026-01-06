import React, { useState, useRef, useEffect, memo } from "react";
import "./CustomSelect.css";

// Usamos memo para evitar re-renders innecesarios cuando escribes en otros campos
const CustomSelect = memo(
  ({
    options = [],
    value = "",
    onChange = () => {},
    placeholder = "",
    disabled = false,
    name,
    className = "",
  }) => {
    const [open, setOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const ref = useRef(null);

    // Usamos un ID estático para el menú basado en el nombre o un valor fijo inicial
    const menuId = useRef(
      "menu-" + Math.random().toString(36).substr(2, 9)
    ).current;

    const selectedOption = options.find(
      (o) => String(o.value) === String(value)
    );

    useEffect(() => {
      const onClickOutside = (e) => {
        if (ref.current && !ref.current.contains(e.target)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const toggle = () => {
      if (disabled) return;
      setOpen((s) => !s);
    };

    const handleOptionSelect = (opt) => {
      onChange(opt.value);
      setOpen(false);
    };

    return (
      <div
        className={`custom-select ${className} ${
          disabled ? "is-disabled" : ""
        }`}
        ref={ref}
      >
        {name && <input type="hidden" name={name} value={value} />}

        <button
          type="button"
          className={`custom-select__control ${open ? "is-open" : ""}`}
          onClick={toggle}
          disabled={disabled}
        >
          <span className="custom-select__value">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="custom-select__arrow">▾</span>
        </button>

        {open && (
          <ul className="custom-select__menu">
            {options.map((opt, idx) => (
              <li
                key={opt.value}
                className={`custom-select__option ${
                  String(opt.value) === String(value) ? "is-selected" : ""
                }`}
                onClick={() => handleOptionSelect(opt)}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

export default CustomSelect;
