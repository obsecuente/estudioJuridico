import { useState, useEffect, useCallback, useRef } from "react";
import "./ResumenIA.css";
import api from "../../services/api";
import {
  OpenAiIcon,
  RenewIcon,
  SendIcon,
  CenterIcon,
  PointIcon,
  ClientIcon,
  CalendarIcon,
  AlarmIcon,
  CheckIcon,
  DocumentosIcon,
  SpinnerIcon
} from "../common/Icons";

function ResumenIA({ idDocumento }) {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [expandido, setExpandido] = useState(false);

  // Estados para el Chat
  const [pregunta, setPregunta] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [enviandoPregunta, setEnviandoPregunta] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

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
    } finally {
      setCargando(false);
    }
  };

  const handleEnviarPregunta = async (e) => {
    e.preventDefault();
    if (!pregunta.trim() || enviandoPregunta) return;

    const nuevaPregunta = pregunta.trim();
    setPregunta("");
    setMensajes(prev => [...prev, { rol: 'user', texto: nuevaPregunta }]);
    setEnviandoPregunta(true);

    try {
      const response = await api.post(`/ia/preguntar/${idDocumento}`, { pregunta: nuevaPregunta });
      setMensajes(prev => [...prev, { rol: 'ai', texto: response.data.respuesta }]);
    } catch (error) {
      console.error("Error al preguntar:", error);
      setMensajes(prev => [...prev, { rol: 'ai', texto: "Lo siento, hubo un error al procesar tu consulta. Reintentá en unos segundos.", error: true }]);
    } finally {
      setEnviandoPregunta(false);
    }
  };

  const handleRegenerar = () => {
    if (window.confirm("¿Estás seguro de regenerar el resumen? Esto consumirá tokens de IA.")) {
      generarResumen(true);
    }
  };

  // Función Pro para renderizar con iconos reales
  const renderResumenPro = (texto) => {
    if (!texto) return null;

    // Dividimos por secciones basadas en ###
    const secciones = texto.split('###').filter(s => s.trim() !== "");

    return secciones.map((seccion, index) => {
      const lineas = seccion.trim().split('\n');
      const tituloOriginal = lineas[0].trim();
      const contenido = lineas.slice(1).join('\n').trim();

      // Mapeo selectivo de iconos premium
      let Icono = OpenAiIcon;
      if (tituloOriginal.includes("PARTES")) Icono = ClientIcon;
      if (tituloOriginal.includes("PUNTOS CLAVE")) Icono = PointIcon;
      if (tituloOriginal.includes("FECHAS") || tituloOriginal.includes("PLAZOS")) Icono = CalendarIcon;
      if (tituloOriginal.includes("ACCIÓN REQUERIDA")) Icono = AlarmIcon;
      if (tituloOriginal.includes("NATURALEZA") || tituloOriginal.includes("TEMA PRINCIPAL")) Icono = CenterIcon;
      if (tituloOriginal.includes("CONCLUSIÓN")) Icono = CheckIcon;
      if (tituloOriginal.includes("DOCUMENTO")) Icono = DocumentosIcon;
      // Nuevas secciones para resúmenes legales profesionales
      if (tituloOriginal.includes("MONTOS")) Icono = PointIcon;
      if (tituloOriginal.includes("DATOS DEL OBJETO") || tituloOriginal.includes("UBICACIÓN")) Icono = CenterIcon;
      if (tituloOriginal.includes("FUNDAMENTO LEGAL") || tituloOriginal.includes("FUNDAMENTO")) Icono = DocumentosIcon;
      if (tituloOriginal.includes("PRUEBAS")) Icono = DocumentosIcon;


      // Limpiamos el título de emojis de forma segura sin borrar acentos
      const tituloLimpio = tituloOriginal.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, "").trim();

      return (
        <div key={index} className="resumen-seccion-pro">
          <h4 className="resumen-titulo-pro">
            <span className="resumen-icono-pro"><Icono /></span>
            {tituloLimpio}
          </h4>
          <div className="resumen-cuerpo-item">
            {/* Renderizamos el contenido con saltos de línea y soporte básico de guiones */}
            {contenido.split('\n').map((linea, lidx) => {
              if (linea.startsWith('- ')) {
                return <div key={lidx} className="resumen-bullet-item">
                  <span className="bullet-dot"></span> {linea.replace('- ', '')}
                </div>;
              }
              return <p key={lidx} className="resumen-parrafo-pro">{linea}</p>;
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className={`resumen-ia-container-premium ${expandido ? 'is-expanded' : ''}`}>
      <div className="resumen-header-premium">
        <div className="header-ia-info">
          <div className="ia-icon-pulse"><OpenAiIcon /></div>
          <h3>Inteligencia Artificial</h3>
        </div>
        <div className="header-ia-actions">
          {expandido && (
            <button className="btn-ia-action btn-ia-outline" onClick={handleRegenerar} disabled={cargando}>
              <RenewIcon /> Regenerar
            </button>
          )}
          <button
            className={`btn-ia-action ${expandido ? 'btn-ia-secondary' : 'btn-ia-primary'}`}
            onClick={() => expandido ? setExpandido(false) : generarResumen(false)}
            disabled={cargando}
          >
            {cargando ? <span className="spinner-ia-mini"></span> : expandido ? "Ocultar" : "Analizar Documento"}
          </button>
        </div>
      </div>

      {expandido && resumen && (
        <div className="resumen-content-premium">
          <div className="resumen-body-scroll">
            {/* Renderizado Pro del Resumen */}
            <div className="resumen-render-pro">
              {renderResumenPro(resumen.resumen_texto)}
            </div>

            {/* Sección de Chat */}
            <div className="ia-chat-section">
              <div className="chat-divider">
                <span>Chat con el Documento</span>
              </div>

              <div className="chat-messages-container">
                {mensajes.length === 0 && (
                  <p className="chat-hint">Hacé una pregunta específica sobre este archivo...</p>
                )}
                {mensajes.map((m, idx) => (
                  <div key={idx} className={`chat-bubble ${m.rol === 'user' ? 'user-bubble' : 'ai-bubble'} ${m.error ? 'error-bubble' : ''}`}>
                    {m.texto}
                  </div>
                ))}
                {enviandoPregunta && (
                  <div className="chat-bubble ai-bubble typing-bubble">
                    <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>

          {/* Footer con Stats y Input */}
          <div className="resumen-footer-premium">
            <div className="ia-stats-bar">
              <span>🤖 {resumen.modelo_usado}</span>
              <span>⏱️ {(resumen.tiempo_procesamiento / 1000).toFixed(1)}s</span>
            </div>
            <form className="chat-input-wrapper" onSubmit={handleEnviarPregunta}>
              <input
                type="text"
                placeholder="Preguntale algo al documento..."
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                disabled={enviandoPregunta}
              />
              <button type="submit" className="btn-send-chat" disabled={!pregunta.trim() || enviandoPregunta}>
                {enviandoPregunta ? "..." : <SendIcon />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumenIA;
