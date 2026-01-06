import React from "react";
import { FindIcon } from "./Icons";
import "./SearchInput.css";

const SearchInput = ({ value, onChange, placeholder }) => {
  return (
    <div className="search-container-glass">
      <div className="search-icon">
        <FindIcon />
      </div>
      <input
        type="text"
        className="search-input-glass"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default SearchInput;
