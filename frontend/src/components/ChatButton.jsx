import { useState, useRef, useEffect } from 'react';
import { api } from '../api';

export default function ChatButton({ embedded, session }) {
  const [abierto, setAbierto] = useState(false);
  const [identificador] = useState(session?.email || 'cliente_anonimo');
  const [mensaje, setMensaje] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cargandoHist, setCargandoHist] = useState(true);
  const ref = useRef(null);

  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/chat/historial?remitente=${identificador}`).then(r => r.json());
        if (res.success && res.data) setChat(res.data);
      } catch (e) { console.error(e); }
      setCargandoHist(false);
    })();
  }, [identificador]);

  const enviar = async () => {
    if (!mensaje.trim()) return;
    const msg = mensaje;
    setMensaje('');
    setChat(c => [...c, { role: 'user', content: msg }]);
    setLoading(true);
    const body = { mensaje: msg, remitente: identificador };
    if (session?.rol_nombre) body.rol = session.rol_nombre;
    if (session?.email) body.email = session.email;
    if (session?.perfil?.nombre) body.nombre_usuario = session.perfil.nombre;
    const res = await fetch('http://localhost:3000/api/chat/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(r => r.json());
    setLoading(false);
    setChat(c => [...c, { role: 'bot', content: res.success ? res.respuesta : (res.mensaje || 'Error') }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  return (
    <>
      {!embedded && (
        <button
          onClick={() => setAbierto(!abierto)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-neutral-900 text-white rounded-full shadow-lg
                     hover:bg-neutral-800 transition-all flex items-center justify-center text-2xl z-40"
        >
          {abierto ? '✕' : '💬'}
        </button>
      )}

      {(abierto || embedded) && (
        <div className={`${embedded ? 'h-full flex flex-col' : 'fixed bottom-24 right-6 w-80 h-96 bg-white rounded-xl shadow-xl border border-neutral-100 flex flex-col z-40'}`}>
          {!embedded && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <span className="text-sm font-medium text-neutral-900">GourmetBot</span>
              <button onClick={() => setAbierto(false)} className="text-neutral-300 hover:text-neutral-500 text-lg leading-none">&times;</button>
            </div>
          )}
          <div className={`flex-1 overflow-y-auto p-3 space-y-2 ${embedded ? 'bg-white rounded-xl border border-neutral-100' : ''}`}>
            {chat.length === 0 && (
              <div className="text-center py-8 text-neutral-300 text-xs">Escribe un mensaje</div>
            )}
            {chat.map((c, i) => (
              <div key={i} className={`flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  c.role === 'user' ? 'bg-neutral-900 text-white rounded-br-sm' : 'bg-neutral-100 text-neutral-800 rounded-bl-sm'
                }`}>{c.content}</div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-neutral-100 rounded-xl px-3 py-2 text-xs text-neutral-400">...</div></div>}
            <div ref={ref} />
          </div>
          <div className={`flex gap-2 p-3 ${embedded ? '' : 'border-t border-neutral-100'}`}>
            <input type="text" value={mensaje} onChange={e => setMensaje(e.target.value)}
              onKeyDown={handleKeyDown} placeholder="Escribe..."
              className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs
                         focus:outline-none focus:border-neutral-400 placeholder:text-neutral-300" />
            <button onClick={enviar} disabled={loading || !mensaje.trim()}
              className="px-3 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors">
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
