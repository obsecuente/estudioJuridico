// src/components/common/ChatIA.jsx
import { useState, useRef, useEffect } from "react";
import api from "../../services/api";
import "./ChatIA.css";
import { AbogadosIcon, OpenAiIcon, SendIcon, TrashICon } from "./Icons";

const ChatIA = () => {
    const [open, setOpen] = useState(false);
    const [mensajes, setMensajes] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatBodyRef = useRef(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [mensajes, open]);

    const enviar = async () => {
        if (!input.trim() || loading) return;
        const userMsg = { role: "user", content: input.trim() };
        const nuevosMensajes = [...mensajes, userMsg];
        setMensajes(nuevosMensajes);
        setInput("");
        setLoading(true);

        try {
            const res = await api.post("/ia/chat-general", { mensajes: nuevosMensajes });
            setMensajes([...nuevosMensajes, { role: "assistant", content: res.data.respuesta }]);
        } catch (err) {
            setMensajes([
                ...nuevosMensajes,
                { role: "assistant", content: "⚠️ Error al conectar con la IA. Intentá de nuevo." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const limpiar = () => {
        setMensajes([]);
        setInput("");
    };

    return (
        <>
            {/* Botón flotante */}
            <button className={`chat-fab ${open ? "chat-fab-open" : ""}`} onClick={() => setOpen(!open)} title="Chat IA">
                {open ? "✕" : <OpenAiIcon />}
            </button>

            {/* Ventana de chat */}
            {open && (
                <div className="chat-window">
                    <div className="chat-header">
                        <div className="chat-header-info">

                            <div>
                                <div className="chat-header-title">Asistente Legal IA</div>
                            </div>
                        </div>
                        <button className="chat-clear-btn" onClick={limpiar} title="Limpiar conversación"><TrashICon /> </button>
                    </div>

                    <div className="chat-body" ref={chatBodyRef}>
                        {mensajes.length === 0 && (
                            <div className="chat-welcome">
                                <div className="chat-welcome-icon"><AbogadosIcon /></div>
                                <p>Soy tu asistente legal.</p>
                                <p>Preguntame sobre plazos, procedimientos, artículos del CPCC...</p>
                            </div>
                        )}
                        {mensajes.map((m, i) => (
                            <div key={i} className={`chat-msg chat-msg-${m.role}`}>
                                <div className="chat-bubble">
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="chat-msg chat-msg-assistant">
                                <div className="chat-bubble chat-typing-text">
                                    <i>Analizando información del estudio...</i>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="chat-footer">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Escribí tu consulta..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && enviar()}
                            disabled={loading}
                        />
                        <button className="chat-send" onClick={enviar} disabled={loading || !input.trim()}>
                            <SendIcon />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatIA;
