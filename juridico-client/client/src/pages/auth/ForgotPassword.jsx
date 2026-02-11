import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./Login.css";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await api.post("/auth/forgot-password", { email });
            setSuccess(true);
        } catch (err) {
            console.error("Error al solicitar recuperación:", err);
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError("Error al procesar la solicitud. Intentá nuevamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Sistema Jurídico</h1>
                <h2>Recuperar Contraseña</h2>

                {success ? (
                    <div className="success-message">
                        <div className="success-icon">✉️</div>
                        <p>
                            Si el email está registrado, recibirás un enlace para restablecer
                            tu contraseña.
                        </p>
                        <p className="success-hint">Revisá tu bandeja de entrada y spam.</p>
                        <Link to="/login" className="btn-back-login">
                            Volver al login
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="forgot-description">
                            Ingresá tu email y te enviaremos instrucciones para recuperar tu
                            contraseña.
                        </p>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    autoComplete="email"
                                    placeholder="tu@email.com"
                                />
                            </div>

                            <button type="submit" disabled={loading} className="btn-login">
                                {loading ? "Enviando..." : "Enviar instrucciones"}
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

export default ForgotPassword;
