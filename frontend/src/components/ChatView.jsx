import { useState, useRef, useEffect } from 'react';
import { api } from '../api';

export default function ChatView() {
  const [telefono, setTelefono] = useState('987654321');
  const [mensaje, setMensaje] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  const enviar = async () => {
    if (!mensaje.trim()) return;
    const msg = mensaje;
    setMensaje('');
    setChat(c => [...c, { role: 'user', content: msg }]);
    setLoading(true);
    const res = await api.enviarChat(telefono, msg);
    setLoading(false);
    if (res.success) {
      setChat(c => [...c, { role: 'bot', content: res.respuesta }]);
    } else {
      setChat(c => [...c, { role: 'bot', content: 'Error: ' + (res.mensaje || res.error) }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col h-screen">
      <div className="mb-6">
        <h1 className="text-xl font-medium text-neutral-900">Chat</h1>
        <p className="text-sm text-neutral-400 mt-0.5">Simulador del chatbot para WhatsApp</p>
      </div>

      <div className="mb-4">
        <label className="text-xs text-neutral-400 block mb-1">Teléfono del cliente</label>
        <input
          type="text" value={telefono}
          onChange={e => setTelefono(e.target.value)}
          className="w-full max-w-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm
                     focus:outline-none focus:border-neutral-400 transition-colors"
        />
      </div>

      <div className="flex-1 bg-white rounded-xl border border-neutral-100 p-4 overflow-y-auto mb-4 space-y-3">
        {chat.length === 0 && (
          <div className="text-center py-12 text-neutral-300 text-sm">
            Escribe un mensaje para comenzar
          </div>
        )}
        {chat.map((c, i) => (
          <div key={i} className={`flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
              c.role === 'user'
                ? 'bg-neutral-900 text-white rounded-br-sm'
                : 'bg-neutral-100 text-neutral-800 rounded-bl-sm'
            }`}>
              {c.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 rounded-xl px-4 py-2.5 text-sm text-neutral-400">
              ...
            </div>
          </div>
        )}
        <div ref={ref} />
      </div>

      <div className="flex gap-2">
        <input
          type="text" value={mensaje}
          onChange={e => setMensaje(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          disabled={loading}
          className="flex-1 px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm
                     focus:outline-none focus:border-neutral-400 transition-colors
                     placeholder:text-neutral-300 disabled:opacity-50"
        />
        <button
          onClick={enviar} disabled={loading || !mensaje.trim()}
          className="px-5 py-3 bg-neutral-900 text-white rounded-lg text-sm font-medium
                     hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
