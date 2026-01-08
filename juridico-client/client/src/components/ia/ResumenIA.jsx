import { useState, useEffect, useCallback } from "react";
import "./ResumenIA.css";
import api from "../../services/api";

function ResumenIA({ idDocumento }) {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [expandido, setExpandido] = useState(false);

  const cargarResumenExistente = useCallback(async () => {
    if (!idDocumento) return;
    try {
      const response = await api.get(`/ia/resumen/${idDocumento}`);
      if (response.data) {
        setResumen(response.data);
        setExpandido(true);
      }
    } catch (error) {
      console.log("No hay resumen previo");
    }
  }, [idDocumento]);

  useEffect(() => {
    cargarResumenExistente();
  }, [cargarResumenExistente]);

  const generarResumen = async (forzarRegeneracion = false) => {
    setCargando(true);
    try {
      const response = await api.post(
        `/ia/resumir/${idDocumento}?forzar=${forzarRegeneracion}`
      );

      setResumen(response.data.resumen);
      setExpandido(true);
    } catch (error) {
      console.error("Error al generar resumen:", error);
      alert(error.response?.data?.error || "Error al generar resumen con IA");
    } finally {
      setCargando(false);
    }
  };

  const handleRegenerar = () => {
    if (
      window.confirm(
        "¿Estás seguro de regenerar el resumen? Esto consumirá tokens de IA."
      )
    ) {
      generarResumen(true);
    }
  };

  return (
    <>
      {/* HEADER: Aquí alineamos el título con el botón a la derecha extrema */}
      <div className="card-header">
        <h2>Resumen Inteligente</h2>
        <button
          className="btn-small btn-ia-header"
          onClick={() =>
            expandido ? handleRegenerar() : generarResumen(false)
          }
          disabled={cargando}
        >
          {cargando ? (
            <>
              <span className="spinner-mini"></span>
              {expandido ? "Regenerando..." : "Generando..."}
            </>
          ) : expandido ? (
            "🔄 Regenerar Resumen"
          ) : (
            "✨ Generar con IA"
          )}
        </button>
      </div>

      {/* CUERPO: Se integra dentro del card-body del padre */}
      <div className="card-body">
        {expandido && resumen ? (
          <div className="resumen-ia-contenido-final">
            <div className="resumen-interno-header">
              <h3>📄 Análisis de IA</h3>
              <button
                className="btn-cerrar-x"
                onClick={() => setExpandido(false)}
              >
                ✕
              </button>
            </div>

            <div className="resumen-contenido">
              <div
                className="resumen-parrafo"
                dangerouslySetInnerHTML={{
                  __html: resumen?.resumen_texto?.replace(/\n/g, "<br>") || "",
                }}
              />
            </div>

            <div className="resumen-metadata">
              <span className="metadata-item">
                <strong>🤖 Modelo:</strong> {resumen?.modelo_usado}
              </span>
              <span className="metadata-item">
                <strong>🎯 Tokens:</strong>{" "}
                {resumen?.tokens_usados?.toLocaleString()}
              </span>
              <span className="metadata-item">
                <strong>⏱️ Tiempo:</strong>{" "}
                {(resumen?.tiempo_procesamiento / 1000).toFixed(2)}s
              </span>
            </div>
          </div>
        ) : (
          <div className="resumen-vacio">
            <p>No se ha generado un resumen para este documento todavía.</p>
          </div>
        )}
      </div>
    </>
  );
}

export default ResumenIA;
