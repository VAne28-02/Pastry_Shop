import { useState, useEffect } from 'react';
import { api } from '../api';

const fondos = ['bg-amber-50', 'bg-emerald-50', 'bg-sky-50', 'bg-purple-50', 'bg-rose-50', 'bg-lime-50'];
const API = 'http://localhost:3000/api';

export default function PromosView({ session, token }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editPromo, setEditPromo] = useState(null);
  const [form, setForm] = useState({ titulo: '', descripcion: '', precio: '', imagen_url: '', stock: 0, icono: '' });
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo, setTipo] = useState('aqui');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const esAdmin = session?.rol_nombre === 'Administrador';

  const cargar = async () => {
    const res = await api.getPromos();
    if (res.success) setPromos(res.data);
    setLoading(false);
  };
  useEffect(() => { cargar(); }, []);

  const crearPromo = async () => {
    if (!form.titulo || !form.precio) return;
    const res = await fetch(`${API}/promos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, precio: parseFloat(form.precio), stock: parseInt(form.stock) })
    });
    if (res.ok) { setModal(null); setForm({ titulo: '', descripcion: '', precio: '', imagen_url: '', stock: 0, icono: '' }); cargar(); }
  };

  const guardarEdicion = async () => {
    if (!editPromo.titulo || !editPromo.precio) return;
    const res = await fetch(`${API}/promos/${editPromo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...editPromo, precio: parseFloat(editPromo.precio), stock: parseInt(editPromo.stock) })
    });
    if (res.ok) { setEditPromo(null); cargar(); }
  };

  const eliminarPromo = async (id, titulo) => {
    if (!confirm(`¿Eliminar la promoción "${titulo}"?`)) return;
    const res = await fetch(`${API}/promos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) cargar();
  };

  const registarPedido = async (promo) => {
    if (!nombre.trim()) return;
    setEnviando(true);
    const res = await fetch('http://localhost:3000/api/pedidos/promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim() || undefined, tipo, promoId: promo.id })
    }).then(r => r.json());
    setEnviando(false);
    if (res.success) {
      setMensaje('✅ Promoción registrada en pedidos');
      setTimeout(() => { setModal(null); setMensaje(''); setNombre(''); setTelefono(''); }, 1200);
    } else {
      setMensaje('❌ ' + (res.error || 'Error'));
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium text-stone-800">Promociones</h1>
          <p className="text-sm text-stone-400 mt-0.5">{promos.length} promociones</p>
        </div>
        {esAdmin && (
          <button onClick={() => setModal('crear')}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
            + Nueva Promo
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-stone-300 text-sm">Cargando...</div>
      ) : promos.length === 0 ? (
        <div className="text-center py-20 text-stone-300 text-sm">No hay promociones</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {promos.map((p, i) => (
            <div key={p.id}
              className="bg-white rounded-xl border border-stone-200 p-5 hover:border-emerald-200 hover:shadow-sm transition-all group relative">
              {esAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditPromo({ ...p })}
                    className="text-xs w-7 h-7 bg-white text-blue-600 rounded-lg border border-stone-200 hover:bg-blue-50 flex items-center justify-center shadow-sm">✎</button>
                  <button onClick={() => eliminarPromo(p.id, p.titulo)}
                    className="text-xs w-7 h-7 bg-white text-red-500 rounded-lg border border-stone-200 hover:bg-red-50 flex items-center justify-center shadow-sm">✕</button>
                </div>
              )}
              <div className={`w-full h-24 ${p.imagen_url ? '' : fondos[i % fondos.length]} rounded-lg mb-4 flex items-center justify-center overflow-hidden`}>
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.titulo} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="text-3xl opacity-50">{p.icono || '🎉'}</span>
                )}
              </div>
              <h3 className="font-medium text-sm text-stone-800">{p.titulo}</h3>
              <p className="text-xs text-stone-400 mt-1 line-clamp-2">{p.descripcion}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-light text-stone-800">S/.{p.precio}</span>
              </div>
              <button onClick={() => { setModal(p); setNombre(''); setTelefono(''); setTipo('aqui'); setMensaje(''); }}
                className="w-full mt-4 py-2 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                Registrar pedido
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear */}
      {modal === 'crear' && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-stone-700 mb-4">Nueva Promoción</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Título</label>
                <input value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" rows="3" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Precio</label>
                <input type="number" step="0.01" value={form.precio} onChange={e => setForm({...form, precio: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">URL imagen (opcional)</label>
                <input value={form.imagen_url} onChange={e => setForm({...form, imagen_url: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Stock</label>
                <input type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Icono (emoji)</label>
                <input value={form.icono} onChange={e => setForm({...form, icono: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={crearPromo} className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">Crear</button>
              <button onClick={() => setModal(null)} className="py-2 px-4 border border-stone-200 text-sm rounded-lg hover:bg-stone-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editPromo && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setEditPromo(null)}>
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-stone-700 mb-4">Editar Promoción</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Título</label>
                <input value={editPromo.titulo} onChange={e => setEditPromo({...editPromo, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Descripción</label>
                <textarea value={editPromo.descripcion} onChange={e => setEditPromo({...editPromo, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" rows="3" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Precio</label>
                <input type="number" step="0.01" value={editPromo.precio} onChange={e => setEditPromo({...editPromo, precio: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">URL imagen (opcional)</label>
                <input value={editPromo.imagen_url || ''} onChange={e => setEditPromo({...editPromo, imagen_url: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Stock</label>
                <input type="number" min="0" value={editPromo.stock} onChange={e => setEditPromo({...editPromo, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Icono (emoji)</label>
                <input value={editPromo.icono} onChange={e => setEditPromo({...editPromo, icono: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={guardarEdicion} className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">Guardar</button>
              <button onClick={() => setEditPromo(null)} className="py-2 px-4 border border-stone-200 text-sm rounded-lg hover:bg-stone-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal registro pedido */}
      {modal && modal !== 'crear' && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4" onClick={() => !enviando && setModal(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium text-stone-800">Registrar Promoción</h2>
              {!enviando && <button onClick={() => setModal(null)} className="text-stone-300 hover:text-stone-500 text-lg leading-none">&times;</button>}
            </div>
            <div className="bg-stone-50 rounded-lg p-3 mb-5">
              <p className="font-medium text-sm text-stone-800">{modal.titulo}</p>
              <p className="text-xs text-stone-400 mt-0.5">{modal.descripcion}</p>
              <p className="text-sm font-medium text-stone-700 mt-2">S/.{modal.precio}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-400 block mb-1">Nombre del cliente</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-300 transition-colors placeholder:text-stone-300"
                  placeholder="Obligatorio" />
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-1">Teléfono (opcional)</label>
                <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-300 transition-colors placeholder:text-stone-300"
                  placeholder="Opcional" />
              </div>
              <div>
                <label className="text-xs text-stone-400 block mb-2">Tipo</label>
                <div className="flex gap-2">
                  {['aqui', 'delivery'].map(t => (
                    <button key={t} onClick={() => setTipo(t)}
                      className={`flex-1 py-2.5 rounded-lg text-sm border transition-colors ${tipo === t ? 'bg-emerald-600 text-white border-emerald-600' : 'border-stone-200 text-stone-500 hover:border-emerald-300'}`}>
                      {t === 'aqui' ? 'Consumir aquí' : 'Delivery'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {mensaje && <p className="text-sm text-center mt-4">{mensaje}</p>}
            <button onClick={() => registarPedido(modal)} disabled={enviando || !nombre.trim()}
              className="w-full mt-5 py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
              {enviando ? 'Registrando...' : 'Registrar en pedidos'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
