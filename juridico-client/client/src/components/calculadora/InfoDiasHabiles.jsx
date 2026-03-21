import { useState, useEffect } from "react";
import { AlarmIcon, CalendarIcon, CheckIcon } from "../common/Icons";
import "./InfoDiasHabiles.css";

const InfoDiasHabiles = ({ fechaSeleccionada, jurisdiccion = "neuquen" }) => {
  const [info, setInfo] = useState(null);
  const [feriadosMes, setFeriadosMes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fechaSeleccionada) {
      setInfo(null);
      setFeriadosMes([]);
      return;
    }

    cargarDatos();
  }, [fechaSeleccionada, jurisdiccion]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        calcularDias(),
        cargarFeriadosMes()
      ]);
    } catch (err) {
      setError("No se pudo cargar la información");
    } finally {
      setLoading(false);
    }
  };

  const cargarFeriadosMes = async () => {
    try {
      const fecha = new Date(fechaSeleccionada + "T00:00:00");
      const anio = fecha.getFullYear();
      const mes = fecha.getMonth() + 1;

      const response = await fetch(`/api/calculadora/feriados-mes?anio=${anio}&mes=${mes}&jurisdiccion=${jurisdiccion}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFeriadosMes(data.feriados || []);
      }
    } catch (err) {
      console.error("Error cargando feriados del mes:", err);
    }
  };

  const calcularDias = async () => {
    const hoy = new Date().toISOString().split("T")[0];

    try {
      const response = await fetch("/api/calculadora/dias-entre-fechas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          fecha_inicio: hoy,
          fecha_fin: fechaSeleccionada,
          jurisdiccion: jurisdiccion,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al calcular días");
      }

      const data = await response.json();
      setInfo(data);
    } catch (err) {
      console.error("Error:", err);
      throw err;
    }
  };

  if (!fechaSeleccionada) return null;
  if (loading) {
    return (
      <div className="info-dias-container loading">
        <div className="spinner-small"></div>
        <span>Calculando días hábiles...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="info-dias-container error">
        <span><AlarmIcon /> {error}</span>
      </div>
    );
  }
  if (!info) return null;

  return (
    <div className="info-dias-container">
      {info.fecha_fin_es_habil ? (
        <div className="info-habil">
          <span className="badge badge-success">Día hábil</span>
        </div>
      ) : (
        <div className="info-inhabill">
          <span className="badge badge-warning"><AlarmIcon /> {info.razon_inhabill}</span>
          {info.sugerencias_fechas_habiles.length > 0 && (
            <div className="sugerencias">
              <p>Fechas hábiles cercanas:</p>
              <div className="sugerencias-botones">
                {info.sugerencias_fechas_habiles.map((fecha) => (
                  <button
                    key={fecha}
                    type="button"
                    className="btn-sugerencia"
                    onClick={() => {
                      const event = new Event("input", { bubbles: true });
                      const inputs = document.querySelectorAll('input[type="date"]');
                      const input = Array.from(inputs).find(i => i.name.includes("fecha"));
                      if (input) {
                        input.value = fecha;
                        input.dispatchEvent(event);
                      }
                    }}
                  >
                    {new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="info-detalles">
        <div className="info-item">
          <span className="info-label">Desde hoy:</span>
          <span className="info-value">{info.dias_corridos} días corridos</span>
        </div>
        <div className="info-item">
          <span className="info-label">Días hábiles:</span>
          <span className="info-value">{info.dias_habiles} días</span>
        </div>

        {feriadosMes.length > 0 && (
          <div className="info-feriados">
            <span className="info-label"><CalendarIcon /> Feriados del mes ({feriadosMes.length}):</span>
            <ul className="feriados-lista">
              {feriadosMes.map((feriado) => {
                const esSeleccionado = feriado.fecha === fechaSeleccionada;
                return (
                  <li key={feriado.fecha} className={esSeleccionado ? "feriado-seleccionado" : ""}>
                    <span className="feriado-fecha">
                      {new Date(feriado.fecha + "T00:00:00").toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="feriado-nombre">{feriado.nombre}</span>
                    <small className="feriado-alcance">
                      ({feriado.alcance === 'ambos' ? 'Nacional/Prov.' : feriado.alcance})
                    </small>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoDiasHabiles;
