import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Login.css";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Token de recuperación no válido");
        }
    }, [token]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError("");
    };

    const validatePassword = () => {
        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!validatePassword()) {
            return;
        }

        setLoading(true);

        try {
            await api.post("/auth/reset-password", {
                token,
                nuevaPassword: formData.password,
            });
            setSuccess(true);
            // Redirigir al login después de 3 segundos
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            console.error("Error al resetear contraseña:", err);
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError("Error al restablecer la contraseña. El enlace puede haber expirado.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Sistema Jurídico</h1>
                <h2>Nueva Contraseña</h2>

                {success ? (
                    <div className="success-message">
                        <div className="success-icon">✅</div>
                        <p>¡Contraseña restablecida exitosamente!</p>
                        <p className="success-hint">
                            Serás redirigido al login en unos segundos...
                        </p>
                        <Link to="/login" className="btn-back-login">
                            Ir al login ahora
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="forgot-description">
                            Ingresá tu nueva contraseña para acceder a tu cuenta.
                        </p>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="password">Nueva contraseña</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                        autoComplete="new-password"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    autoComplete="new-password"
                                    placeholder="Repetí la contraseña"
                                />
                            </div>

                            <button type="submit" disabled={loading || !token} className="btn-login">
                                {loading ? "Guardando..." : "Restablecer contraseña"}
                            </button>
                        </form>

                        <div className="auth-links">
                            <Link to="/login" className="auth-link">
                                ← Volver al login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
