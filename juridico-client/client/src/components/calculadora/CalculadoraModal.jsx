import CalculadoraPlazos from "./CalculadoraPlazos";
import { Xicon } from "../common/Icons";
import "./CalculadoraModal.css";

const CalculadoraModal = ({ isOpen, onClose, onResultado }) => {
    if (!isOpen) return null;

    return (
        <div className="calculadora-modal-overlay">
            <div className="calculadora-modal-content">
                <button className="btn-close-modal-float" onClick={onClose} title="Cerrar calculadora">
                    <Xicon />
                </button>

                <div className="calculadora-modal-body">
                    <CalculadoraPlazos onResultado={onResultado} />
                </div>
            </div>
        </div>
    );
};

export default CalculadoraModal;
