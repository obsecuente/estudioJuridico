import api from "./api";

const calculadoraService = {
  // calcular plazo procesal (flujo completo de 3 pasos)
  calcularPlazo: async (data) => {
    const response = await api.post("/calculadora/calcular-plazo", data);
    return response.data;
  },

  // calcular dias entre fechas (flujo simple para eventos)
  calcularDiasEntreFechas: async (data) => {
    const response = await api.post("/calculadora/dias-entre-fechas", data);
    return response.data;
  },

  // obtener proximos feriados
  obtenerProximosFeriados: async (jurisdiccion = "neuquen", limite = 10) => {
    const response = await api.get("/calculadora/proximos-feriados", {
      params: { jurisdiccion, limite },
    });
    return response.data;
  },

  // obtener feria judicial actual o proxima
  obtenerFeriaJudicial: async (jurisdiccion = "neuquen") => {
    const response = await api.get("/calculadora/feria-judicial", {
      params: { jurisdiccion },
    });
    return response.data;
  },
};

export default calculadoraService;
