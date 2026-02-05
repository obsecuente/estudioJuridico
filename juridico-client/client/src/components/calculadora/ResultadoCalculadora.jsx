import { useState } from "react";
import BackButton from "../common/BackButton";
import "./ResultadoCalculadora.css";

const ResultadoCalculadora = ({ resultado, onNuevoCalculo, onResultado }) => {
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  // ... resto del componente

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr + "T00:00:00");
    return fecha.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case "notificacion": return "🔵";
      case "habil": return "✅";
      case "inhabil": return "⬜";
      case "prorroga": return "🚫";
      case "vencimiento": return "🎯";
      default: return "•";
    }
  };

  const diasHastaVencimiento = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(resultado.fecha_vencimiento + "T00:00:00");
    const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const diff = diasHastaVencimiento();

  return (
    <div className="resultado-premium-container glass-card">
      <div className="resultado-header-premium">
        <BackButton onClick={onNuevoCalculo} text="Realizar otro cálculo" />
        <h2>Resultado del Análisis</h2>
      </div>

      <div className="vencimiento-hero-card">
        <span className="vencimiento-tag">FECHA DE VENCIMIENTO</span>
        <div className="vencimiento-main-date">
          {formatearFecha(resultado.fecha_vencimiento)}
        </div>
        <div className="vencimiento-status-info">
          {diff > 0 ? (
            <div className="status-badge positive">
              Quedan <span className="highlight">{diff}</span> días corridos
            </div>
          ) : diff === 0 ? (
            <div className="status-badge alert">Vence HOY</div>
          ) : (
            <div className="status-badge negative">Vencido hace {Math.abs(diff)} días</div>
          )}
        </div>

        {onResultado && (
          <div className="vencimiento-use-action" style={{ marginTop: '25px' }}>
            <button
              className="btn-nuevo"
              onClick={() => onResultado(resultado.fecha_vencimiento)}
              style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '14px' }}
            >
              ✅ USAR ESTA FECHA
            </button>
          </div>
        )}
      </div>

      <div className="analisis-grid">
        <div className="analisis-card">
          <h4>Cómputo</h4>
          <div className="analisis-stat">
            <span className="stat-value">{resultado.dias_habiles_computados}</span>
            <span className="stat-label">Días Hábiles</span>
          </div>
          <div className="analisis-stat">
            <span className="stat-value">{resultado.dias_corridos_transcurridos}</span>
            <span className="stat-label">Días Totales</span>
          </div>
        </div>

        <div className="analisis-card">
          <h4>Exclusiones</h4>
          <div className="exclusiones-mini">
            <div className="exc-item"><span>Fines de semana</span> <strong>{resultado.dias_excluidos.fines_de_semana}</strong></div>
            <div className="exc-item"><span>Feriados / Inhábiles</span> <strong>{resultado.dias_excluidos.feriados}</strong></div>
            {resultado.dias_excluidos.feria_judicial > 0 && (
              <div className="exc-item"><span>Feria Judicial</span> <strong>{resultado.dias_excluidos.feria_judicial}</strong></div>
            )}
          </div>
        </div>
      </div>

      {resultado.feriados_encontrados.length > 0 && (
        <div className="feriados-alert-box">
          <h5>🚫 Feriados detectados en el período:</h5>
          <div className="feriados-chips">
            {resultado.feriados_encontrados.map((f, i) => (
              <span key={i} className="feriado-chip">
                {new Date(f.fecha + "T00:00:00").toLocaleDateString("es-AR", { day: '2-digit', month: 'short' })}: {f.nombre}
              </span>
            ))}
          </div>
        </div>
      )}

      {resultado.plazo_gracia && (
        <div className="gracia-announcement">
          <span className="clock-icon">⏰</span>
          <div>
            <strong>Plazo de Gracia:</strong> {resultado.plazo_gracia.observacion}
          </div>
        </div>
      )}

      <div className="timeline-section">
        <button
          className="btn-toggle-timeline"
          onClick={() => setMostrarCalendario(!mostrarCalendario)}
        >
          {mostrarCalendario ? "Ocultar detalle de días" : "Ver detalle día por día"}
          <span className={`arrow ${mostrarCalendario ? 'up' : 'down'}`}>▾</span>
        </button>

        {mostrarCalendario && (
          <div className="timeline-grid">
            {resultado.calendario.map((dia, idx) => (
              <div key={idx} className={`timeline-day ${dia.tipo}`}>
                <div className="day-marker">{getIconoTipo(dia.tipo)}</div>
                <div className="day-info">
                  <div className="day-date">
                    <span className="day-num">{new Date(dia.fecha + "T00:00:00").getDate()}</span>
                    <span className="day-month">{new Date(dia.fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: 'short' })}</span>
                  </div>
                  <div className="day-desc">{dia.descripcion}</div>
                </div>
                {dia.numero_dia && (
                  <div className="day-count">Habil {dia.numero_dia}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="legal-disclaimer">
        <p>⚠️ <strong>Nota:</strong> Los cálculos se basan en la normativa procesal vigente y el calendario oficial. Verifique siempre con el expediente.</p>
      </div>
    </div>
  );
};

export default ResultadoCalculadora;
