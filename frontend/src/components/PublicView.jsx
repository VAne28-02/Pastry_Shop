import { useState, useEffect } from 'react';
import ChatButton from './ChatButton';

const fondos = ['bg-rose-50', 'bg-amber-50', 'bg-sky-50', 'bg-green-50'];
const promos = [
  { id: 1, titulo: '2x1 en Tortas', descripcion: 'Todos los martes y jueves. Lleva 2 tortas y paga 1.', icono: '🍰', precio: 25 },
  { id: 2, titulo: 'Café + Pastel', descripcion: 'Combina cualquier café con un pastel y ahorra $5.', icono: '☕', precio: 12 },
  { id: 3, titulo: 'Happy Hour', descripcion: 'De 5 a 7pm, 20% de descuento en todas las bebidas.', icono: '🥤', precio: 8 },
  { id: 4, titulo: 'Pedidos por WhatsApp', descripcion: 'Haz tu pedido por chat y obtén un postre de cortesía.', icono: '💬', precio: 0 },
];

export default function PublicView({ onOpenLogin }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
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
  }, []);

  const filtrados = filtroCat ? productos.filter(p => p.categoria_id === parseInt(filtroCat)) : productos;

  const enviarPedido = async () => {
    if (!nombre.trim()) return;
    setEnviando(true);
    const res = await fetch('http://localhost:3000/api/pedidos/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim() || undefined, tipo, items: [{ producto_id: modal.id, cantidad }] })
    }).then(r => r.json());
    setEnviando(false);
    if (res.success) {
      setMensaje('✅ Pedido registrado');
      setTimeout(() => { setModal(null); setMensaje(''); setNombre(''); setTelefono(''); setCantidad(1); }, 1200);
    } else {
      setMensaje('❌ ' + (res.error || 'Error'));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧁</span>
            <span className="font-medium text-neutral-900">Pastelería</span>
          </div>
          <button onClick={onOpenLogin}
            className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
            Iniciar sesión
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-neutral-50 border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-8 py-16 text-center">
          <h1 className="text-3xl font-light text-neutral-900 mb-3">Dulces momentos, sabores inolvidables</h1>
          <p className="text-sm text-neutral-400 max-w-lg mx-auto">Descubre nuestra selección de tortas, pasteles y bebidas preparados con los mejores ingredientes.</p>
        </div>
      </section>

      {/* Promos */}
      <section className="max-w-6xl mx-auto px-8 py-12">
        <h2 className="text-lg font-medium text-neutral-900 mb-6">Promociones</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {promos.map((p, i) => (
            <div key={p.id} className={`rounded-xl ${fondos[i]} p-5`}>
              <span className="text-2xl block mb-3">{p.icono}</span>
              <h3 className="font-medium text-sm text-neutral-900 mb-1">{p.titulo}</h3>
              <p className="text-xs text-neutral-500 mb-2">{p.descripcion}</p>
              <span className="text-xs font-medium text-neutral-700">S/.{p.precio}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Productos */}
      <section className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-neutral-900">Productos</h2>
          <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)}
            className="text-sm bg-white border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-400 text-neutral-500">
            <option value="">Todos</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtrados.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-neutral-100 p-5 hover:border-neutral-200 transition-colors">
              <div className="w-full h-24 bg-neutral-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="text-3xl opacity-30">🧁</span>
                )}
              </div>
              <h3 className="font-medium text-sm text-neutral-900">{p.nombre}</h3>
              {p.descripcion && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{p.descripcion}</p>}
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-light text-neutral-900">S/.{p.precio_base}</span>
                {p.categoria && <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full">{p.categoria.nombre}</span>}
              </div>
              <button onClick={() => { setModal(p); setCantidad(1); setNombre(''); setTelefono(''); setTipo('aqui'); setMensaje(''); }}
                className="w-full mt-4 py-2 bg-neutral-900 text-white text-xs rounded-lg hover:bg-neutral-800 transition-colors">
                Pedir
              </button>
            </div>
          ))}
        </div>
      </section>

      <ChatButton />
      {/* Footer */}
      <footer className="border-t border-neutral-100 mt-12">
        <div className="max-w-6xl mx-auto px-8 py-8 text-center text-xs text-neutral-300">
          Pastelería © {new Date().getFullYear()}
        </div>
      </footer>

      {/* Modal pedido */}
      {modal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4" onClick={() => !enviando && setModal(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium text-neutral-900">Nuevo Pedido</h2>
              {!enviando && <button onClick={() => setModal(null)} className="text-neutral-300 hover:text-neutral-500 text-lg leading-none">&times;</button>}
            </div>
            <div className="bg-neutral-50 rounded-lg p-3 mb-5">
              {modal.imagen_url && (
                <img src={modal.imagen_url} alt={modal.nombre} className="w-full h-24 object-cover rounded-lg mb-3" />
              )}
              <p className="font-medium text-sm text-neutral-900">{modal.nombre}</p>
              <p className="text-xs text-neutral-400 mt-0.5">S/.{modal.precio_base} c/u</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Cantidad</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="w-8 h-8 rounded-lg border border-neutral-200 text-neutral-500 hover:border-neutral-400 transition-colors text-sm">-</button>
                  <span className="w-10 text-center text-sm font-medium text-neutral-900">{cantidad}</span>
                  <button onClick={() => setCantidad(cantidad + 1)}
                    className="w-8 h-8 rounded-lg border border-neutral-200 text-neutral-500 hover:border-neutral-400 transition-colors text-sm">+</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Nombre</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 placeholder:text-neutral-300"
                  placeholder="Obligatorio" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Teléfono (opcional)</label>
                <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 placeholder:text-neutral-300"
                  placeholder="Opcional" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-2">Tipo</label>
                <div className="flex gap-2">
                  {['aqui', 'delivery'].map(t => (
                    <button key={t} onClick={() => setTipo(t)}
                      className={`flex-1 py-2.5 rounded-lg text-sm border transition-colors ${tipo === t ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>
                      {t === 'aqui' ? 'Aquí' : 'Delivery'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {mensaje && <p className="text-sm text-center mt-4">{mensaje}</p>}
            <button onClick={enviarPedido} disabled={enviando || !nombre.trim()}
              className="w-full mt-5 py-3 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors">
              {enviando ? 'Registrando...' : `Pedir — S/.${(modal.precio_base * cantidad).toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
