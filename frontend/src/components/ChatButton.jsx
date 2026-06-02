import { useState, useRef, useEffect } from 'react';
import { api } from '../api';

export default function ChatButton({ session }) {
  const [abierto, setAbierto] = useState(false);
  const [identificador] = useState(session?.email || 'cliente_anonimo');
  const [mensaje, setMensaje] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cargandoHist, setCargandoHist] = useState(true);
  const [menuMode, setMenuMode] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const ref = useRef(null);

  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat, menuMode]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/chat/historial?remitente=${identificador}`).then(r => r.json());
        if (res.success && res.data) setChat(res.data);
      } catch (e) { console.error(e); }
      setCargandoHist(false);
    })();
  }, [identificador]);

  useEffect(() => {
    api.getCategorias().then(setCategorias);
    api.getProductos().then(setProductos);
  }, []);

  const enviar = async (texto) => {
    const msg = texto || mensaje;
    if (!msg.trim()) return;
    setMensaje('');
    setMenuMode(null);
    setSelectedCat(null);
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

  const abrirCategorias = () => {
    setMenuMode('categories');
  };

  const seleccionarCategoria = (cat) => {
    setSelectedCat(cat);
    setMenuMode('products');
  };

  const seleccionarProducto = (prod) => {
    enviar(`Quiero ${prod.nombre}`);
  };

  const volverACategorias = () => {
    setMenuMode('categories');
    setSelectedCat(null);
  };

  const prodFiltrados = selectedCat
    ? productos.filter(p => p.categoria_id === selectedCat.id)
    : [];

  return (
    <>
      {/* Bubble */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg
                   hover:bg-emerald-700 transition-all flex items-center justify-center text-2xl z-40"
      >
        {abierto ? (
          <span className="text-white text-lg leading-none">&times;</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
          </svg>
        )}
      </button>

      {/* Chat box */}
      {abierto && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-2xl shadow-xl border border-stone-200 flex flex-col z-40 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-emerald-600">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                  <path d="M10 1a6 6 0 00-3.318 10.975C7.09 12.15 8 13.162 8 14.5v1a2 2 0 002 2h2a2 2 0 002-2v-1c0-1.338.91-2.35 1.318-2.525A6 6 0 0010 1z" />
                  <circle cx="10" cy="4" r="1.5" />
                  <path d="M6.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                  <path d="M10.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-white">GourmetBot</span>
                <p className="text-[10px] text-white/70">Pastelería NuConexion</p>
              </div>
            </div>
            <button onClick={() => setAbierto(false)} className="text-white/70 hover:text-white text-lg leading-none">&times;</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-stone-50">
            {cargandoHist ? (
              <div className="text-center py-8 text-stone-300 text-xs">Cargando...</div>
            ) : chat.length === 0 && !menuMode ? (
              <div className="text-center py-8 text-stone-300 text-xs">¡Pregúntame sobre el menú!</div>
            ) : (
              chat.map((c, i) => (
                <div key={i} className={`flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2.5 rounded-xl text-xs leading-relaxed ${
                    c.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-white text-stone-700 rounded-bl-sm shadow-sm border border-stone-100'
                  }`}>
                    {c.content}
                  </div>
                </div>
              ))
            )}

            {/* Category buttons */}
            {menuMode === 'categories' && (
              <div className="flex flex-wrap gap-1.5">
                {categorias.map(cat => (
                  <button key={cat.id} onClick={() => seleccionarCategoria(cat)}
                    className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-xs font-medium hover:bg-emerald-50 transition-colors shadow-sm">
                    {cat.nombre}
                  </button>
                ))}
              </div>
            )}

            {/* Product buttons */}
            {menuMode === 'products' && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <button onClick={volverACategorias}
                    className="text-[10px] text-stone-400 hover:text-emerald-600 flex items-center gap-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" /></svg>
                    Volver
                  </button>
                  <span className="text-[10px] text-stone-400 font-medium">{selectedCat?.nombre}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {prodFiltrados.map(p => (
                    <button key={p.id} onClick={() => seleccionarProducto(p)}
                      className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 rounded-xl text-xs hover:border-emerald-300 hover:text-emerald-700 transition-colors shadow-sm">
                      {p.nombre} — S/.{p.precio_base}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-xl px-3 py-2.5 text-xs text-stone-400 shadow-sm border border-stone-100">...</div>
              </div>
            )}
            <div ref={ref} />
          </div>

          {/* Quick replies + Input */}
          <div className="border-t border-stone-100 bg-white">
            {/* Quick reply buttons */}
            {chat.length > 0 && !menuMode && !loading && (
              <div className="flex gap-1.5 px-3 pt-2 pb-1 overflow-x-auto">
                <button onClick={abrirCategorias}
                  className="shrink-0 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-[10px] font-medium hover:bg-emerald-100 transition-colors flex items-center gap-1">
                  <span></span> Ver Menú
                </button>
              </div>
            )}
            <div className="flex gap-2 p-3">
              <input type="text" value={mensaje} onChange={e => setMensaje(e.target.value)}
                onKeyDown={handleKeyDown} placeholder="Escribe un mensaje..."
                className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs
                           focus:outline-none focus:border-emerald-300 placeholder:text-stone-300" />
              <button onClick={() => enviar()} disabled={loading || !mensaje.trim()}
                className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
