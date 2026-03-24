// src/components/common/GlobalSearch.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./GlobalSearch.css";

const GlobalSearch = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);
    const navigate = useNavigate();

    // Cerrar al hacer click afuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Escape para cerrar
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setIsOpen(false);
                inputRef.current?.blur();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const buscar = useCallback(async (termino) => {
        if (!termino || termino.trim().length < 2) {
            setResults(null);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/buscar?q=${encodeURIComponent(termino)}&limit=5`);
            setResults(res.data);
        } catch (err) {
            console.error("Error en búsqueda:", err);
            setResults({ clientes: [], casos: [], consultas: [], total: 0 });
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        setIsOpen(true);

        // Debounce 300ms
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => buscar(value), 300);
    };

    const handleNavigate = (path) => {
        setIsOpen(false);
        setQuery("");
        setResults(null);
        navigate(path);
    };

    const hasResults = results && results.total > 0;
    const noResults = results && results.total === 0 && query.trim().length >= 2;

    return (
        <div className="gs-wrapper" ref={wrapperRef}>
            <div className={`gs-input-container ${isOpen ? "gs-open" : ""}`}>
                <svg className="gs-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    className="gs-input"
                    placeholder="Buscar clientes, casos, consultas..."
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => { setIsOpen(true); if (query.trim().length >= 2) buscar(query); }}
                />
            </div>

            {isOpen && (hasResults || noResults || loading) && (
                <div className="gs-dropdown">
                    {loading && (
                        <div className="gs-loading">
                            <div className="gs-spinner" />
                            <span>Buscando...</span>
                        </div>
                    )}

                    {!loading && noResults && (
                        <div className="gs-no-results">
                            No se encontraron resultados para &quot;{query}&quot;
                        </div>
                    )}

                    {!loading && hasResults && (
                        <>
                            {/* Clientes */}
                            {results.clientes.length > 0 && (
                                <div className="gs-group">
                                    <div className="gs-group-label">👤 Clientes</div>
                                    {results.clientes.map((c) => (
                                        <button
                                            key={`c-${c.id_cliente}`}
                                            className="gs-result-item"
                                            onClick={() => handleNavigate(`/dashboard/clientes/${c.id_cliente}`)}
                                        >
                                            <div className="gs-result-main">
                                                <span className="gs-result-title">{c.nombre} {c.apellido}</span>
                                                <span className="gs-result-sub">
                                                    {c.tipo_persona === "juridica" ? `CUIT: ${c.cuit || "—"}` : `DNI: ${c.dni || "—"}`}
                                                    {c.email ? ` · ${c.email}` : ""}
                                                </span>
                                            </div>
                                            <span className="gs-result-arrow">→</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Casos */}
                            {results.casos.length > 0 && (
                                <div className="gs-group">
                                    <div className="gs-group-label">⚖️ Casos</div>
                                    {results.casos.map((caso) => (
                                        <button
                                            key={`caso-${caso.id_caso}`}
                                            className="gs-result-item"
                                            onClick={() => handleNavigate(`/dashboard/casos/${caso.id_caso}`)}
                                        >
                                            <div className="gs-result-main">
                                                <span className="gs-result-title">#{caso.id_caso} — {caso.descripcion}</span>
                                                <span className="gs-result-sub">
                                                    {caso.cliente ? `${caso.cliente.nombre} ${caso.cliente.apellido}` : ""}
                                                    {caso.numero_expediente ? ` · Exp: ${caso.numero_expediente}` : ""}
                                                    {caso.demandado_nombre ? ` vs ${caso.demandado_nombre}` : ""}
                                                </span>
                                            </div>
                                            <span className={`gs-result-badge ${caso.estado === "abierto" ? "gs-badge-open" : "gs-badge-closed"}`}>
                                                {caso.estado}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Consultas */}
                            {results.consultas.length > 0 && (
                                <div className="gs-group">
                                    <div className="gs-group-label">📋 Consultas</div>
                                    {results.consultas.map((con) => (
                                        <button
                                            key={`con-${con.id_consulta}`}
                                            className="gs-result-item"
                                            onClick={() => handleNavigate(`/dashboard/consultas`)}
                                        >
                                            <div className="gs-result-main">
                                                <span className="gs-result-title">{con.mensaje || "Sin detalle"}</span>
                                                <span className="gs-result-sub">
                                                    {con.nombre_contacto || (con.cliente ? `${con.cliente.nombre} ${con.cliente.apellido}` : "")}
                                                    {con.fecha_envio ? ` · ${new Date(con.fecha_envio).toLocaleDateString("es-AR")}` : ""}
                                                </span>
                                            </div>
                                            <span className={`gs-result-badge ${con.estado === "pendiente" ? "gs-badge-pending" : "gs-badge-done"}`}>
                                                {con.estado}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
