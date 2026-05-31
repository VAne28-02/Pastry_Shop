import { useState, useEffect } from 'react';
import { api } from '../api';

const API = 'http://localhost:3000/api';

export default function ProductosView({ token, session }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtroCat, setFiltroCat] = useState('');
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo, setTipo] = useState('aqui');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const [adminModal, setAdminModal] = useState(null);
  const [editProd, setEditProd] = useState(null);
  const [formProd, setFormProd] = useState({ nombre: '', descripcion: '', precio_base: '', categoria_id: '', imagen_url: '' });

  const esAdmin = session?.rol_nombre === 'Administrador';

  const cargar = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([api.getProductos(), api.getCategorias()]);
    if (Array.isArray(p)) setProductos(p);
    if (Array.isArray(c)) setCategorias(c);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = filtroCat ? productos.filter(p => p.categoria_id === parseInt(filtroCat)) : productos;

  const abrirFormulario = (producto) => {
    setModal(producto);
    setCantidad(1);
    setNombre('');
    setTelefono('');
    setTipo('aqui');
    setMensaje('');
  };

  const enviarPedido = async () => {
    if (!nombre.trim()) return;
    setEnviando(true);
    const res = await api.registrarPedido({
      nombre: nombre.trim(),
      telefono: telefono.trim() || undefined,
      tipo,
      items: [{ producto_id: modal.id, cantidad }]
    });
    setEnviando(false);
    if (res.success) {
      setMensaje('✅ Pedido registrado');
      setTimeout(() => { setModal(null); setMensaje(''); }, 1200);
    } else {
      setMensaje('❌ ' + (res.error || 'Error'));
    }
  };

  const crearProducto = async () => {
    if (!formProd.nombre || !formProd.precio_base || !formProd.categoria_id) return;
    const res = await fetch(`${API}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...formProd, precio_base: parseFloat(formProd.precio_base), categoria_id: parseInt(formProd.categoria_id) })
    });
    if (res.ok) { setAdminModal(null); setFormProd({ nombre: '', descripcion: '', precio_base: '', categoria_id: '', imagen_url: '' }); cargar(); }
  };

  const guardarEdicion = async () => {
    if (!editProd.nombre || !editProd.precio_base || !editProd.categoria_id) return;
    const res = await fetch(`${API}/productos/${editProd.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...editProd, precio_base: parseFloat(editProd.precio_base), categoria_id: parseInt(editProd.categoria_id) })
    });
    if (res.ok) { setEditProd(null); cargar(); }
  };

  const eliminarProducto = async (id, nombreProd) => {
    if (!confirm(`¿Eliminar "${nombreProd}"?`)) return;
    const res = await fetch(`${API}/productos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) cargar();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium text-neutral-900">Productos</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{productos.length} productos</p>
        </div>
        <div className="flex items-center gap-3">
          {esAdmin && (
            <button onClick={() => setAdminModal('crear')}
              className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 transition-colors">
              + Nuevo Producto
            </button>
          )}
          <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)}
            className="text-sm bg-white border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-400 text-neutral-600">
            <option value="">Todas las categorías</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-neutral-300 text-sm">Cargando...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtrados.map(p => (
            <div key={p.id}
              className="bg-white rounded-xl border border-neutral-100 p-5 relative group">
              {esAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditProd({ ...p, precio_base: p.precio_base?.toString() || '', categoria_id: p.categoria_id?.toString() || '' })}
                    className="text-xs w-7 h-7 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center justify-center">✎</button>
                  <button onClick={() => eliminarProducto(p.id, p.nombre)}
                    className="text-xs w-7 h-7 bg-neutral-100 text-neutral-500 rounded hover:bg-neutral-200 flex items-center justify-center">✕</button>
                </div>
              )}
              <button onClick={() => abrirFormulario(p)} className="text-left w-full">
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
                  {p.categoria && (
                    <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full">{p.categoria.nombre}</span>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

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
                <label className="text-xs text-neutral-400 block mb-1">Nombre del cliente</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-300"
                  placeholder="Obligatorio" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Teléfono (opcional)</label>
                <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-300"
                  placeholder="Opcional" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-2">Tipo</label>
                <div className="flex gap-2">
                  {['aqui', 'delivery'].map(t => (
                    <button key={t} onClick={() => setTipo(t)}
                      className={`flex-1 py-2.5 rounded-lg text-sm border transition-colors ${tipo === t ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>
                      {t === 'aqui' ? 'Consumir aquí' : 'Delivery'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {mensaje && <p className="text-sm text-center mt-4">{mensaje}</p>}
            <button onClick={enviarPedido} disabled={enviando || !nombre.trim()}
              className="w-full mt-5 py-3 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors">
              {enviando ? 'Registrando...' : `Registrar pedido — S/.${(modal.precio_base * cantidad).toFixed(2)}`}
            </button>
          </div>
        </div>
      )}

      {/* Modal crear producto (admin) */}
      {adminModal === 'crear' && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setAdminModal(null)}>
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Nuevo Producto</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Nombre</label>
                <input value={formProd.nombre} onChange={e => setFormProd({...formProd, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Descripción</label>
                <textarea value={formProd.descripcion} onChange={e => setFormProd({...formProd, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" rows="2" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 mb-1">Precio</label>
                  <input type="number" step="0.01" value={formProd.precio_base}
                    onChange={e => setFormProd({...formProd, precio_base: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 mb-1">Categoría</label>
                  <select value={formProd.categoria_id} onChange={e => setFormProd({...formProd, categoria_id: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 bg-white">
                    <option value="">Seleccionar</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">URL imagen (opcional)</label>
                <input value={formProd.imagen_url} onChange={e => setFormProd({...formProd, imagen_url: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={crearProducto} className="flex-1 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 transition-colors">Crear</button>
              <button onClick={() => setAdminModal(null)} className="py-2 px-4 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar producto (admin) */}
      {editProd && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setEditProd(null)}>
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Editar Producto</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Nombre</label>
                <input value={editProd.nombre} onChange={e => setEditProd({...editProd, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Descripción</label>
                <textarea value={editProd.descripcion} onChange={e => setEditProd({...editProd, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" rows="2" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 mb-1">Precio</label>
                  <input type="number" step="0.01" value={editProd.precio_base}
                    onChange={e => setEditProd({...editProd, precio_base: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 mb-1">Categoría</label>
                  <select value={editProd.categoria_id} onChange={e => setEditProd({...editProd, categoria_id: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 bg-white">
                    <option value="">Seleccionar</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">URL imagen (opcional)</label>
                <input value={editProd.imagen_url} onChange={e => setEditProd({...editProd, imagen_url: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={guardarEdicion} className="flex-1 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 transition-colors">Guardar</button>
              <button onClick={() => setEditProd(null)} className="py-2 px-4 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
