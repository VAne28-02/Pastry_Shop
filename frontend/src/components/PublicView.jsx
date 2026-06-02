import { useState, useEffect } from 'react';
import ChatButton from './ChatButton';

const fondos = ['bg-emerald-50', 'bg-amber-50', 'bg-sky-50', 'bg-rose-50'];

export default function PublicView({ onOpenLogin }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [promos, setPromos] = useState([]);
  const [filtroCat, setFiltroCat] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo, setTipo] = useState('aqui');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [pedidoCreado, setPedidoCreado] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/productos').then(r => r.json()).then(d => { if (Array.isArray(d)) setProductos(d); });
    fetch('http://localhost:3000/api/categorias').then(r => r.json()).then(d => { if (Array.isArray(d)) setCategorias(d); });
    fetch('http://localhost:3000/api/promos').then(r => r.json()).then(d => { if (d.success) setPromos(d.data); });
  }, []);

  const filtrados = (filtroCat ? productos.filter(p => p.categoria_id === parseInt(filtroCat)) : productos).filter(p =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const enviarPedido = async () => {
    if (!nombre.trim()) return;
    setEnviando(true);
    const itemKey = modal.esPromo ? 'promo_id' : 'producto_id';
    const res = await fetch('http://localhost:3000/api/pedidos/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim() || undefined, tipo, metodo_pago: metodoPago, items: [{ [itemKey]: modal.id, cantidad }] })
    }).then(r => r.json());
    setEnviando(false);
    if (res.success) {
      setMensaje('✅ Pedido registrado');
      setPedidoCreado(res.data?.id || res.pedido?.id);
      setTimeout(() => { setModal(null); setMensaje(''); setNombre(''); setTelefono(''); setCantidad(1); setPedidoCreado(null); }, 3000);
    } else {
      setMensaje('❌ ' + (res.error || 'Error'));
    }
  };

  useEffect(() => { document.documentElement.style.scrollBehavior = 'smooth'; return () => { document.documentElement.style.scrollBehavior = ''; }; }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-white to-amber-50/40">
      {/* Floating decorative shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-20 -right-20 w-[26rem] h-[26rem] bg-emerald-200/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-28 w-80 h-80 bg-amber-200/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-rose-200/15 rounded-full blur-[90px]" />
        <div className="absolute top-2/3 left-1/3 w-60 h-60 bg-sky-200/15 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-emerald-100/40 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <img src="/diseno_web/logo.png" alt="NuConexion" className="h-14 w-auto drop-shadow-sm" />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#inicio" className="text-sm text-emerald-800/50 hover:text-emerald-700 font-medium transition-colors">Inicio</a>
            <a href="#carta" className="text-sm text-emerald-800/50 hover:text-emerald-700 font-medium transition-colors">Carta</a>
            <a href="#servicios" className="text-sm text-emerald-800/50 hover:text-emerald-700 font-medium transition-colors">Servicios</a>
            <a href="#contactanos" className="text-sm text-emerald-800/50 hover:text-emerald-700 font-medium transition-colors">Contáctanos</a>
          </nav>
          <button onClick={onOpenLogin}
            className="text-sm text-emerald-800/50 hover:text-emerald-700 font-medium transition-colors">
            Iniciar sesión
          </button>
        </div>
      </header>

      {/* Hero */}
      <section id="inicio" className="max-w-5xl mx-auto px-6 py-24 md:py-32 text-center relative">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 text-xs font-medium px-4 py-1.5 rounded-full mb-8 border border-emerald-200/50 shadow-sm">
          Pastelería Saludable & Pet-Friendly
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl text-emerald-900 leading-tight mb-6 font-bold tracking-tight">
          Postres que{' '}
          <span className="text-emerald-600 relative">
            cuidan
            <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 100 6" preserveAspectRatio="none">
              <path d="M0,3 Q25,0 50,3 Q75,6 100,3" fill="none" stroke="#059669" strokeWidth="2.5" opacity="0.35"/>
            </svg>
          </span>
          {' '}de ti y tu mascota
        </h1>
        <p className="text-emerald-700/50 leading-relaxed max-w-lg mx-auto text-base">
          NuConexion elabora postres artesanales con ingredientes 100% naturales, sin azúcares refinados ni conservantes. El verdadero sabor está en lo saludable.
        </p>
        <div className="flex items-center justify-center gap-4 mt-10">
          <a href="#carta"
            className="px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-full text-sm font-semibold hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-200/50">
            Ver Carta
          </a>
          <a href="#servicios"
            className="px-7 py-2.5 text-emerald-600 rounded-full text-sm font-medium border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all shadow-sm">
            Servicios
          </a>
        </div>
      </section>

      {/* Promos */}
      {promos.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl text-emerald-900 font-bold mb-2">Promociones</h2>
            <p className="text-emerald-700/50 text-sm">Aprovecha nuestras ofertas especiales</p>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'thin' }}>
            {promos.map((p, i) => (
              <div key={p.id} className="w-72 shrink-0 snap-start rounded-xl bg-white border border-emerald-100/60 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group">
                <div className="relative overflow-hidden">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt={p.titulo} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className={`h-40 flex items-center justify-center ${fondos[i % fondos.length]}`}>
                      <span className="text-5xl opacity-60">{p.icono}</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                    -{p.descuento || '20'}%
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-sm text-emerald-900 font-semibold mb-1.5">{p.titulo}</h3>
                  <p className="text-xs text-emerald-700/50 mb-3 line-clamp-2 leading-relaxed">{p.descripcion}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-emerald-600 font-bold">S/.{p.precio}</span>
                    <button onClick={() => { setModal({ ...p, esPromo: true }); setCantidad(1); setNombre(''); setTelefono(''); setTipo('aqui'); setMensaje(''); }}
                      className="text-xs text-emerald-600 font-medium bg-emerald-50 px-4 py-1.5 rounded-full hover:bg-emerald-100 transition-all opacity-0 group-hover:opacity-100">
                      Pedir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <ChatButton onBuscar={setBusqueda} />

      {/* Productos */}
      <section id="carta" className="bg-gradient-to-b from-white to-emerald-50/30 border-t border-emerald-100/40">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl text-emerald-900 font-bold mb-2">Nuestra Carta</h2>
            <p className="text-emerald-700/50 text-sm">{filtrados.length} productos disponibles</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                className="bg-white border border-emerald-200 rounded-full px-4 py-2 text-sm text-emerald-700 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 placeholder:text-emerald-300 shadow-sm w-40"
                placeholder="Buscar..." />
              <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)}
                className="bg-white border border-emerald-200 rounded-full px-4 py-2 text-sm text-emerald-700 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none cursor-pointer shadow-sm">
                <option value="">Todas</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtrados.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-emerald-100/60 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group">
                <div className="relative overflow-hidden">
                  <div className="w-full aspect-square bg-gradient-to-br from-emerald-50 to-amber-50 flex items-center justify-center">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <span className="text-4xl opacity-20">⊘</span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm text-emerald-900 font-semibold mb-1">{p.nombre}</h3>
                  {p.descripcion && <p className="text-xs text-emerald-700/50 mb-3 line-clamp-2 leading-relaxed">{p.descripcion}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-base text-emerald-600 font-bold">S/.{p.precio_base}</span>
                    <button onClick={() => { setModal({ ...p, esPromo: false }); setCantidad(1); setNombre(''); setTelefono(''); setTipo('aqui'); setMensaje(''); }}
                      className="text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-all opacity-0 group-hover:opacity-100">
                      Pedir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl text-emerald-900 font-bold mb-2">Servicios</h2>
        <p className="text-emerald-700/50 text-sm mb-14">Todo lo que ofrecemos para consentirte</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Delivery', desc: 'Llevamos tus postres favoritos a la puerta de tu casa.', color: 'bg-emerald-100' },
            { title: 'Pet-Friendly', desc: 'Snacks saludables para tu mascota con ingredientes naturales.', color: 'bg-amber-100' },
            { title: 'Pedidos Personalizados', desc: 'Postres hechos a tu medida para eventos y celebraciones.', color: 'bg-rose-100' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-emerald-100/60 p-8 shadow-md hover:shadow-lg transition-all duration-300">
              <div className={`w-14 h-14 ${s.color} rounded-xl flex items-center justify-center mx-auto mb-5 shadow-sm`}>
                <span className="text-xl">✦</span>
              </div>
              <h3 className="text-base text-emerald-900 font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-emerald-700/60 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contactanos */}
      <section id="contactanos" className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-amber-300/10 rounded-full blur-[60px]" />
        </div>
        <div className="max-w-5xl mx-auto px-6 py-20 text-center relative">
          <h2 className="text-2xl text-white font-bold mb-2">Contáctanos</h2>
          <p className="text-emerald-200/50 text-sm mb-14">Estamos aquí para ayudarte</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-2xl mx-auto">
            {[
              { label: '+51 999 999 999', sub: 'Lun-Sáb 9am-8pm' },
              { label: 'contacto@nuconexion.pe', sub: 'Respuesta en 24h' },
              { label: 'Av. Las Americas 128', sub: 'Hunter, Arequipa' },
            ].map((c, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-7 border border-white/10 hover:bg-white/15 transition-all">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-base text-white/60">✦</span>
                </div>
                <p className="text-sm text-white font-medium mb-1">{c.label}</p>
                <p className="text-xs text-emerald-200/50">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-50 border-t border-emerald-100">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-emerald-700/30">© {new Date().getFullYear()} NuConexion</p>
        </div>
      </footer>

      {/* Modal pedido */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !enviando && setModal(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-emerald-900">Nuevo Pedido</h2>
              {!enviando && <button onClick={() => setModal(null)} className="text-emerald-300 hover:text-emerald-500 transition-colors">&times;</button>}
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-amber-50 rounded-lg p-4 mb-5">
              {modal.imagen_url && (
                <img src={modal.imagen_url} alt={modal.nombre || modal.titulo} className="w-full h-24 object-cover rounded-lg mb-3" />
              )}
              <p className="text-sm font-semibold text-emerald-900">{modal.nombre || modal.titulo}</p>
              <p className="text-xs text-emerald-700/50 mt-0.5">S/.{modal.precio_base || modal.precio} c/u</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-emerald-700/60 font-medium block mb-1.5">Cantidad</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="w-9 h-9 rounded-lg border border-emerald-200 text-emerald-500 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-sm">−</button>
                  <span className="w-10 text-center text-sm font-semibold text-emerald-900">{cantidad}</span>
                  <button onClick={() => setCantidad(cantidad + 1)}
                    className="w-9 h-9 rounded-lg border border-emerald-200 text-emerald-500 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-sm">+</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-emerald-700/60 font-medium block mb-1.5">Nombre</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg text-sm text-emerald-900 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 placeholder:text-emerald-300 transition-all"
                  placeholder="Tu nombre" />
              </div>
              <div>
                <label className="text-xs text-emerald-700/60 font-medium block mb-1.5">Teléfono (opcional)</label>
                <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)}
                  className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg text-sm text-emerald-900 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 placeholder:text-emerald-300 transition-all"
                  placeholder="999 999 999" />
              </div>
              <div>
                <label className="text-xs text-emerald-700/60 font-medium block mb-2">Tipo</label>
                <div className="flex gap-2">
                  {['aqui', 'delivery'].map(t => (
                    <button key={t} onClick={() => setTipo(t)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${tipo === t ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'border-emerald-200 text-emerald-500 hover:border-emerald-300 hover:bg-emerald-50'}`}>
                      {t === 'aqui' ? 'Aquí' : 'Delivery'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-emerald-700/60 font-medium block mb-2">Método de pago</label>
                <div className="flex gap-2">
                  {['efectivo', 'yape', 'transferencia'].map(m => (
                    <button key={m} onClick={() => setMetodoPago(m)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all ${metodoPago === m ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'border-emerald-200 text-emerald-500 hover:border-emerald-300 hover:bg-emerald-50'}`}>
                      {m === 'efectivo' ? 'Efectivo' : m === 'yape' ? 'Yape' : 'Transferencia'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {mensaje && (
              <div className="text-center mt-4">
                <p className="text-sm text-emerald-600 font-medium">{mensaje}</p>
                {pedidoCreado && (
                  <button onClick={() => window.open(`http://localhost:3000/api/factura/${pedidoCreado}`, '_blank')}
                    className="mt-2 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[10px] text-stone-500 hover:bg-stone-100 hover:text-emerald-600 transition-all inline-flex items-center gap-1 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 117.5 0 .75.75 0 01-7.5 0zm0 3a.75.75 0 117.5 0 .75.75 0 01-7.5 0z" clipRule="evenodd" /></svg>
                    Generar Factura
                  </button>
                )}
              </div>
            )}
            <button onClick={enviarPedido} disabled={enviando || !nombre.trim()}
              className="w-full mt-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg text-sm font-semibold hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50 transition-all shadow-md">
              {enviando ? 'Registrando...' : `Pedir — S/.${((modal.precio_base || modal.precio) * cantidad).toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
