import { useState, useEffect } from "react";
import ModalFrame from "../../components/common/ModalFrame";
import casosService from "../../services/casos.service";
import { SaveIcon, SpinnerIcon } from "../../components/common/Icons";
import CustomSelect from "../../components/common/CustomSelect";

const EditarEtapaModal = ({ idCaso, casoData, onClose, showToast }) => {
    const [form, setForm] = useState({
        instancia: casoData?.instancia || "",
        tipo_proceso: casoData?.tipo_proceso || "",
        fuero: casoData?.fuero || "",
        jurisdiccion: casoData?.jurisdiccion || "",
        numero_expediente: casoData?.numero_expediente || "",
        etapa_actual: casoData?.etapa_actual || "",
    });
    const [etapas, setEtapas] = useState([]);
    const [saving, setSaving] = useState(false);

    // Cargar etapas cuando cambia tipo_proceso
    useEffect(() => {
        if (form.tipo_proceso) {
            casosService.getEtapasLegales(form.tipo_proceso).then((res) => {
                setEtapas(res.data || []);
            }).catch(() => setEtapas([]));
        } else {
            setEtapas([]);
        }
    }, [form.tipo_proceso]);

    const handleChange = (field, value) => {
        setForm(prev => {
            const next = { ...prev, [field]: value };
            // Reset etapa_actual si cambia tipo_proceso
            if (field === "tipo_proceso") next.etapa_actual = "";
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await casosService.actualizarEtapa(idCaso, {
                instancia: form.instancia || null,
                tipo_proceso: form.tipo_proceso || null,
                fuero: form.fuero || null,
                jurisdiccion: form.jurisdiccion || null,
                numero_expediente: form.numero_expediente || null,
                etapa_actual: form.etapa_actual ? parseInt(form.etapa_actual) : null,
            });
            showToast("Etapa procesal actualizada", "success");
            onClose(true);
        } catch (err) {
            showToast(err.response?.data?.error || "Error al actualizar", "error");
        } finally {
            setSaving(false);
        }
    };

    const instanciaOptions = [
        { value: "", label: "Seleccionar..." },
        { value: "Extrajudicial", label: "Extrajudicial" },
        { value: "Administrativa", label: "Administrativa" },
        { value: "Judicial", label: "Judicial" },
    ];

    const procesoOptions = [
        { value: "", label: "Seleccionar..." },
        { value: "Ordinario", label: "Ordinario" },
        { value: "Ejecutivo", label: "Ejecutivo" },
        { value: "Sumarisimo", label: "Sumarisimo" },
        { value: "Penal", label: "Penal" },
        { value: "Laboral", label: "Laboral" },
        { value: "Familia", label: "Familia" },
    ];

    const fueroOptions = [
        { value: "", label: "Seleccionar..." },
        { value: "civil", label: "Civil" },
        { value: "laboral", label: "Laboral" },
        { value: "penal", label: "Penal" },
        { value: "familia", label: "Familia" },
        { value: "comercial", label: "Comercial" },
    ];

    const jurisdiccionOptions = [
        { value: "", label: "Seleccionar..." },
        { value: "nacional", label: "Nacional" },
        { value: "neuquen", label: "Neuquen" },
        { value: "rio_negro", label: "Rio Negro" },
    ];

    const etapaOptions = [
        { value: "", label: "Seleccionar etapa..." },
        ...etapas.map(e => ({
            value: String(e.numero_etapa),
            label: `${e.descripcion_corta || "Etapa " + e.numero_etapa} - ${e.descripcion}`,
        })),
    ];

    return (
        <ModalFrame
            title="Editar Etapa Procesal"
            onClose={() => onClose(false)}
            className="editar-etapa-modal"
        >
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="form-body">
                    <div className="form-row-2col">
                        <div className="form-group">
                            <label>Instancia</label>
                            <CustomSelect
                                name="instancia"
                                options={instanciaOptions}
                                value={form.instancia}
                                onChange={(val) => handleChange("instancia", val)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Tipo de Proceso</label>
                            <CustomSelect
                                name="tipo_proceso"
                                options={procesoOptions}
                                value={form.tipo_proceso}
                                onChange={(val) => handleChange("tipo_proceso", val)}
                            />
                        </div>
                    </div>

                    <div className="form-row-2col">
                        <div className="form-group">
                            <label>Fuero</label>
                            <CustomSelect
                                name="fuero"
                                options={fueroOptions}
                                value={form.fuero}
                                onChange={(val) => handleChange("fuero", val)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Jurisdiccion</label>
                            <CustomSelect
                                name="jurisdiccion"
                                options={jurisdiccionOptions}
                                value={form.jurisdiccion}
                                onChange={(val) => handleChange("jurisdiccion", val)}
                            />
                        </div>
                    </div>

                    <div className="form-row-2col">
                        <div className="form-group">
                            <label>Etapa Actual</label>
                            <CustomSelect
                                name="etapa_actual"
                                options={etapaOptions}
                                value={form.etapa_actual ? String(form.etapa_actual) : ""}
                                onChange={(val) => handleChange("etapa_actual", val)}
                                disabled={!form.tipo_proceso}
                            />
                        </div>
                        <div className="form-group">
                            <label>Numero de Expediente</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ej: 12345/2026"
                                value={form.numero_expediente}
                                onChange={(e) => handleChange("numero_expediente", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={() => onClose(false)} disabled={saving}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-submit" disabled={saving}>
                        {saving ? <><SpinnerIcon /> Guardando...</> : <><SaveIcon /> Guardar</>}
                    </button>
                </div>
            </form>
        </ModalFrame>
    );
};

export default EditarEtapaModal;
