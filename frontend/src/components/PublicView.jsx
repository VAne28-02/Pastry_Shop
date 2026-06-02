import { useState, useEffect } from 'react';
import ChatButton from './ChatButton';

const fondos = ['bg-emerald-50', 'bg-amber-50', 'bg-sky-50', 'bg-rose-50'];

export default function PublicView({ onOpenLogin }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [promos, setPromos] = useState([]);
  const [filtroCat, setFiltroCat] = useState('');
  const [modal, setModal] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo, setTipo] = useState('aqui');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/productos').then(r => r.json()).then(d => { if (Array.isArray(d)) setProductos(d); });
    fetch('http://localhost:3000/api/categorias').then(r => r.json()).then(d => { if (Array.isArray(d)) setCategorias(d); });
    fetch('http://localhost:3000/api/promos').then(r => r.json()).then(d => { if (d.success) setPromos(d.data); });
  }, []);

  const filtrados = filtroCat ? productos.filter(p => p.categoria_id === parseInt(filtroCat)) : productos;

  const enviarPedido = async () => {
    if (!nombre.trim()) return;
    setEnviando(true);
    const itemKey = modal.esPromo ? 'promo_id' : 'producto_id';
    const res = await fetch('http://localhost:3000/api/pedidos/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim() || undefined, tipo, items: [{ [itemKey]: modal.id, cantidad }] })
    }).then(r => r.json());
    setEnviando(false);
    if (res.success) {
      setMensaje('✅ Pedido registrado');
      setTimeout(() => { setModal(null); setMensaje(''); setNombre(''); setTelefono(''); setCantidad(1); }, 1200);
    } else {
      setMensaje('❌ ' + (res.error || 'Error'));
    }
  };

  useEffect(() => { document.documentElement.style.scrollBehavior = 'smooth'; return () => { document.documentElement.style.scrollBehavior = ''; }; }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur border-b border-stone-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <img src="/diseno_web/logo.png" alt="NuConexion" className="h-14 w-auto" />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#inicio" className="text-sm text-stone-400 hover:text-stone-800 transition-colors">Inicio</a>
            <a href="#carta" className="text-sm text-stone-400 hover:text-stone-800 transition-colors">Carta</a>
            <a href="#servicios" className="text-sm text-stone-400 hover:text-stone-800 transition-colors">Servicios</a>
            <a href="#contactanos" className="text-sm text-stone-400 hover:text-stone-800 transition-colors">Contáctanos</a>
          </nav>
          <button onClick={onOpenLogin}
            className="text-sm text-stone-400 hover:text-stone-800 transition-colors">
            Iniciar sesión
          </button>
        </div>
      </header>

      {/* Hero */}
      <section id="inicio" className="max-w-4xl mx-auto px-6 py-28 md:py-36 text-center">
        <div className="inline-flex items-center bg-stone-100 text-stone-500 text-xs px-4 py-1.5 rounded-full mb-8">
          Pastelería Saludable & Pet-Friendly
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl text-stone-800 leading-tight mb-6 font-light tracking-tight">
          Postres que{' '}
          <span className="text-emerald-600">cuidan</span>
          {' '}de ti y tu mascota
        </h1>
        <p className="text-stone-300 leading-relaxed max-w-lg mx-auto text-sm">
          NuConexion elabora postres artesanales con ingredientes naturales, sin azúcares refinados.
          El bienestar se encuentra con el sabor.
        </p>
        <div className="flex items-center justify-center gap-3 mt-10">
          <a href="#carta"
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-full text-sm hover:bg-emerald-700 transition-colors">
            Ver Carta
          </a>
          <a href="#servicios"
            className="px-6 py-2.5 text-stone-400 rounded-full text-sm border border-stone-200 hover:border-stone-300 transition-colors">
            Servicios
          </a>
        </div>
      </section>

      {/* Promos */}
      {promos.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-20 border-t border-stone-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg text-stone-800 font-light">Promociones</h2>
            <span className="text-xs text-stone-300">Deslizar →</span>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory" style={{ scrollbarWidth: 'thin' }}>
            {promos.map((p, i) => (
              <div key={p.id} className="w-72 shrink-0 snap-start rounded-xl bg-white border border-stone-100 overflow-hidden hover:shadow-sm transition-shadow group">
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.titulo} className="w-full h-40 object-cover" />
                ) : (
                  <div className={`h-40 flex items-center justify-center ${fondos[i % fondos.length]}`}>
                    <span className="text-4xl">{p.icono}</span>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-sm text-stone-700 mb-1">{p.titulo}</h3>
                  <p className="text-xs text-stone-400 mb-3 line-clamp-2 leading-relaxed">{p.descripcion}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-600 font-medium">S/.{p.precio}</span>
                    <button onClick={() => { setModal({ ...p, esPromo: true }); setCantidad(1); setNombre(''); setTelefono(''); setTipo('aqui'); setMensaje(''); }}
                      className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors opacity-0 group-hover:opacity-100">
                      Pedir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <ChatButton />

      {/* Productos */}
      <section id="carta" className="bg-stone-50/50 border-t border-stone-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-lg text-stone-800 font-light">Carta</h2>
              <p className="text-xs text-stone-300 mt-1">{filtrados.length} productos</p>
            </div>
            <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)}
              className="text-xs bg-transparent border border-stone-200 rounded-full px-3 py-1.5 focus:outline-none focus:border-stone-400 text-stone-400 appearance-none cursor-pointer">
              <option value="">Todas</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-stone-100 border border-stone-100 rounded-xl overflow-hidden">
            {filtrados.map(p => (
              <div key={p.id} className="bg-white p-5 hover:bg-stone-50 transition-colors group">
                <div className="w-full aspect-square bg-stone-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl opacity-20">⊘</span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm text-stone-700">{p.nombre}</h3>
                  {p.descripcion && <p className="text-xs text-stone-300 mt-1 line-clamp-2 leading-relaxed">{p.descripcion}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-base text-stone-800">S/.{p.precio_base}</span>
                    <button onClick={() => { setModal({ ...p, esPromo: false }); setCantidad(1); setNombre(''); setTelefono(''); setTipo('aqui'); setMensaje(''); }}
                      className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors opacity-0 group-hover:opacity-100">
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
        <h2 className="text-lg text-stone-800 font-light mb-3">Servicios</h2>
        <p className="text-xs text-stone-400 mb-12 max-w-xs mx-auto">Todo lo que ofrecemos para consentirte a ti y a tu mascota</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Delivery', desc: 'Llevamos tus postres favoritos a la puerta de tu casa.' },
            { title: 'Pet-Friendly', desc: 'Snacks saludables para tu mascota con ingredientes naturales.' },
            { title: 'Pedidos Personalizados', desc: 'Postres hechos a tu medida para eventos y celebraciones.' },
          ].map((s, i) => (
            <div key={i} className="px-6 py-10">
              <h3 className="text-sm text-stone-700 mb-2">{s.title}</h3>
              <p className="text-xs text-stone-400 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contactanos */}
      <section id="contactanos" className="bg-stone-800">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="text-lg text-white font-light mb-3">Contáctanos</h2>
          <p className="text-xs text-stone-400 mb-10">Estamos aquí para ayudarte.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { label: '+51 999 999 999', sub: 'Lun-Sáb 9am-8pm' },
              { label: 'contacto@nuconexion.pe', sub: 'Respuesta en 24h' },
              { label: 'Av. Las Americas 128', sub: 'Hunter, Arequipa' },
            ].map((c, i) => (
              <div key={i} className="px-4 py-6">
                <p className="text-sm text-stone-300">{c.label}</p>
                <p className="text-xs text-stone-500 mt-1">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-100">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/diseno_web/logo.png" alt="NuConexion" className="h-6 w-auto opacity-40" />
            <span className="text-xs text-stone-300">NuConexion</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#inicio" className="text-xs text-stone-300 hover:text-stone-600 transition-colors">Inicio</a>
            <a href="#carta" className="text-xs text-stone-300 hover:text-stone-600 transition-colors">Carta</a>
            <a href="#servicios" className="text-xs text-stone-300 hover:text-stone-600 transition-colors">Servicios</a>
            <a href="#contactanos" className="text-xs text-stone-300 hover:text-stone-600 transition-colors">Contacto</a>
          </div>
          <p className="text-xs text-stone-200">© {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* Modal pedido */}
      {modal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4" onClick={() => !enviando && setModal(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm text-stone-700">Nuevo Pedido</h2>
              {!enviando && <button onClick={() => setModal(null)} className="text-stone-300 hover:text-stone-500 transition-colors">&times;</button>}
            </div>
            <div className="bg-stone-50 rounded-lg p-4 mb-5">
              {modal.imagen_url && (
                <img src={modal.imagen_url} alt={modal.nombre || modal.titulo} className="w-full h-24 object-cover rounded-lg mb-3" />
              )}
              <p className="text-sm text-stone-700">{modal.nombre || modal.titulo}</p>
              <p className="text-xs text-stone-400 mt-0.5">S/.{modal.precio_base || modal.precio} c/u</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-stone-400 block mb-1.5">Cantidad</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="w-9 h-9 rounded-lg border border-stone-200 text-stone-400 hover:border-stone-300 transition-colors text-sm">−</button>
                  <span className="w-10 text-center text-sm text-stone-700">{cantidad}</span>
                  <button onClick={() => setCantidad(cantidad + 1)}
                    className="w-9 h-9 rounded-lg border border-stone-200 text-stone-400 hover:border-stone-300 transition-colors text-sm">+</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-1.5">Nombre</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400 placeholder:text-stone-300 transition-colors"
                  placeholder="Tu nombre" />
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-1.5">Teléfono (opcional)</label>
                <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400 placeholder:text-stone-300 transition-colors"
                  placeholder="999 999 999" />
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-2">Tipo</label>
                <div className="flex gap-2">
                  {['aqui', 'delivery'].map(t => (
                    <button key={t} onClick={() => setTipo(t)}
                      className={`flex-1 py-2.5 rounded-lg text-sm border transition-colors ${tipo === t ? 'bg-stone-800 text-white border-stone-800' : 'border-stone-200 text-stone-400 hover:border-stone-300'}`}>
                      {t === 'aqui' ? 'Aquí' : 'Delivery'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {mensaje && <p className="text-sm text-center mt-4 text-emerald-600">{mensaje}</p>}
            <button onClick={enviarPedido} disabled={enviando || !nombre.trim()}
              className="w-full mt-5 py-2.5 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50 transition-colors">
              {enviando ? 'Registrando...' : `Pedir — S/.${((modal.precio_base || modal.precio) * cantidad).toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
