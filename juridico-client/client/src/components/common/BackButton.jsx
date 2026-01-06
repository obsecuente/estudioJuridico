import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "../common/Icons"; // Asegúrate que la ruta sea correcta
import "./BackButton.css";

const BackButton = ({ to = "/dashboard", text = "Volver al listado" }) => {
  return (
    <div className="back-button-container">
      <Link to={to} className="btn-back-premium">
        <ArrowLeftIcon /> {text}
      </Link>
    </div>
  );
};

export default BackButton;
