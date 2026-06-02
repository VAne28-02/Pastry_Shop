import { useState, useEffect } from 'react';

const API = 'http://localhost:3000/api';

export default function InventarioView({ token }) {
  const [ingredientes, setIngredientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);
  const [editarIngr, setEditarIngr] = useState(null);
  const [nuevoIngr, setNuevoIngr] = useState({ nombre: '', unidad_medida: '', costo_por_unidad: 0, stock_actual: 0, stock_minimo: 0 });
  const [movimiento, setMovimiento] = useState({ id: null, tipo: 'entrada', cantidad: 0 });

  const cargar = async () => {
    try {
      const res = await fetch(`${API}/ingredientes`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setIngredientes(await res.json());
    } catch (e) { console.error(e); }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [token]);

  const filtrados = busqueda
    ? ingredientes.filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : ingredientes;

  const bajoStock = filtrados.filter(i => i.stock_actual <= i.stock_minimo);
  const totalCosto = filtrados.reduce((s, i) => s + (i.costo_por_unidad * i.stock_actual), 0);

  const crearIngrediente = async () => {
    if (!nuevoIngr.nombre || !nuevoIngr.unidad_medida) return;
    const res = await fetch(`${API}/ingredientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(nuevoIngr)
    });
    if (res.ok) { setNuevoIngr({ nombre: '', unidad_medida: '', costo_por_unidad: 0, stock_actual: 0, stock_minimo: 0 }); setModal(null); cargar(); }
  };

  const guardarEdicion = async () => {
    if (!editarIngr.nombre || !editarIngr.unidad_medida) return;
    const res = await fetch(`${API}/ingredientes/${editarIngr.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nombre: editarIngr.nombre,
        unidad_medida: editarIngr.unidad_medida,
        costo_por_unidad: editarIngr.costo_por_unidad,
        stock_actual: editarIngr.stock_actual,
        stock_minimo: editarIngr.stock_minimo
      })
    });
    if (res.ok) { setEditarIngr(null); cargar(); }
  };

  const eliminarIngrediente = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    const res = await fetch(`${API}/ingredientes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) cargar();
  };

  const aplicarMovimiento = async () => {
    if (!movimiento.cantidad || movimiento.cantidad <= 0) return;
    const res = await fetch(`${API}/ingredientes/${movimiento.id}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ cantidad: Number(movimiento.cantidad), tipo: movimiento.tipo })
    });
    if (res.ok) { setMovimiento({ id: null, tipo: 'entrada', cantidad: 0 }); cargar(); }
  };

  const stockRatio = (actual, minimo) => {
    if (minimo <= 0) return 100;
    return Math.min(100, Math.round((actual / (minimo * 2)) * 100));
  };

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm text-stone-400">Cargando...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-stone-800">Inventario</h1>
          <p className="text-sm text-stone-400 mt-0.5">{ingredientes.length} ingredientes registrados</p>
        </div>
        <button onClick={() => setModal('crear')}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
          Nuevo Ingrediente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-stone-200 px-4 py-3 shadow-sm">
          <p className="text-xs text-stone-400">Total ingredientes</p>
          <p className="text-lg font-semibold text-stone-800 mt-0.5">{filtrados.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 px-4 py-3 shadow-sm">
          <p className="text-xs text-stone-400">Stock bajo</p>
          <p className={`text-lg font-semibold mt-0.5 ${bajoStock.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {bajoStock.length} {bajoStock.length === 1 ? 'alerta' : 'alertas'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 px-4 py-3 shadow-sm">
          <p className="text-xs text-stone-400">Valor inventario</p>
          <p className="text-lg font-semibold text-stone-800 mt-0.5">S/.{totalCosto.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 px-4 py-3 shadow-sm">
          <p className="text-xs text-stone-400">Sin stock</p>
          <p className={`text-lg font-semibold mt-0.5 ${ingredientes.filter(i => i.stock_actual === 0).length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {ingredientes.filter(i => i.stock_actual === 0).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar ingrediente..."
              className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50 placeholder:text-stone-300" />
          </div>
          {busqueda && (
            <button onClick={() => setBusqueda('')}
              className="text-xs text-stone-400 hover:text-stone-600 px-2">Limpiar</button>
          )}
          <p className="text-xs text-stone-400 ml-auto">{filtrados.length} de {ingredientes.length}</p>
        </div>
      </div>

      {/* Table */}
      {filtrados.length === 0 ? (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 text-stone-200 mx-auto mb-3">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-stone-300">{busqueda ? 'Sin resultados para tu búsqueda' : 'No hay ingredientes registrados.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left py-3.5 px-5 text-stone-500 font-medium">Nombre</th>
                <th className="text-left py-3.5 px-5 text-stone-500 font-medium">Unidad</th>
                <th className="text-left py-3.5 px-5 text-stone-500 font-medium">Stock</th>
                <th className="text-left py-3.5 px-5 text-stone-500 font-medium">Mínimo</th>
                <th className="text-left py-3.5 px-5 text-stone-500 font-medium">Costo/Unidad</th>
                <th className="text-right py-3.5 px-5 text-stone-500 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(i => {
                const bajo = i.stock_actual <= i.stock_minimo;
                const sinStock = i.stock_actual === 0;
                const ratio = stockRatio(i.stock_actual, i.stock_minimo);
                return (
                  <tr key={i.id} className="border-b border-stone-100 hover:bg-stone-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${sinStock ? 'bg-red-500' : bajo ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        <span className="font-medium text-stone-800">{i.nombre}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-stone-400 text-xs bg-stone-100 rounded-lg px-2.5 py-1">{i.unidad_medida}</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[100px] h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            sinStock ? 'bg-red-500' : bajo ? 'bg-amber-400' : 'bg-emerald-500'
                          }`} style={{ width: `${ratio}%` }} />
                        </div>
                        <span className={`text-sm font-medium ${sinStock ? 'text-red-600' : bajo ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {i.stock_actual}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`text-sm ${i.stock_actual <= i.stock_minimo ? 'text-red-500 font-medium' : 'text-stone-400'}`}>
                        {i.stock_minimo}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-stone-600">S/.{i.costo_por_unidad.toFixed(2)}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setMovimiento({ id: i.id, tipo: 'entrada', cantidad: 0 })}
                          className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center text-sm font-medium shadow-sm" title="Agregar stock">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                        </button>
                        <button onClick={() => setMovimiento({ id: i.id, tipo: 'salida', cantidad: 0 })}
                          className="w-8 h-8 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center text-sm font-medium shadow-sm" title="Reducir stock">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={() => setEditarIngr({ ...i })}
                          className="w-8 h-8 bg-white text-stone-400 rounded-xl border border-stone-200 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center text-sm shadow-sm" title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2.695 5.763A1.75 1.75 0 003.5 6.756V14.5A2.5 2.5 0 006 17h8a2.5 2.5 0 002.5-2.5V6.756a1.75 1.75 0 00.805-.993l.402-1.31A.75.75 0 0017 3.5H3a.75.75 0 00-.707.953l.402 1.31zM6 7.75a.75.75 0 011.5 0v5.5a.75.75 0 01-1.5 0v-5.5zm4.25 0a.75.75 0 011.5 0v5.5a.75.75 0 01-1.5 0v-5.5zm4.25 0a.75.75 0 011.5 0v5.5a.75.75 0 01-1.5 0v-5.5z" /></svg>
                        </button>
                        <button onClick={() => eliminarIngrediente(i.id, i.nombre)}
                          className="w-8 h-8 bg-white text-stone-400 rounded-xl border border-stone-200 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center text-sm shadow-sm" title="Eliminar">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c-.84 0-1.673.025-2.5.075V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.325C11.673 4.025 10.84 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal movimiento */}
      {movimiento.id && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setMovimiento({ id: null, tipo: 'entrada', cantidad: 0 })}>
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${movimiento.tipo === 'entrada' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${movimiento.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {movimiento.tipo === 'entrada'
                    ? <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    : <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
                  }
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-stone-800 capitalize">{movimiento.tipo} de Stock</h3>
                <p className="text-xs text-stone-400">{movimiento.tipo === 'entrada' ? 'Aumentar cantidad' : 'Reducir cantidad'}</p>
              </div>
            </div>
            <input type="number" min="0" step="0.1" placeholder="Cantidad"
              value={movimiento.cantidad || ''}
              onChange={e => setMovimiento({ ...movimiento, cantidad: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50 placeholder:text-stone-300" autoFocus />
            <div className="flex gap-2">
              <button onClick={aplicarMovimiento}
                className="flex-1 py-2.5 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition-colors shadow-sm font-medium">Aplicar</button>
              <button onClick={() => setMovimiento({ id: null, tipo: 'entrada', cantidad: 0 })}
                className="py-2.5 px-5 border border-stone-200 text-sm rounded-xl hover:bg-stone-50 transition-colors text-stone-500">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar ingrediente */}
      {editarIngr && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setEditarIngr(null)}>
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-medium text-stone-800">Editar Ingrediente</h3>
              <button onClick={() => setEditarIngr(null)} className="text-stone-300 hover:text-stone-500 text-lg leading-none">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1.5 font-medium">Nombre</label>
                <input value={editarIngr.nombre}
                  onChange={e => setEditarIngr({...editarIngr, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1.5 font-medium">Unidad</label>
                <input value={editarIngr.unidad_medida}
                  onChange={e => setEditarIngr({...editarIngr, unidad_medida: e.target.value })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 mb-1.5 font-medium">Stock</label>
                  <input type="number" value={editarIngr.stock_actual}
                    onChange={e => setEditarIngr({...editarIngr, stock_actual: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 mb-1.5 font-medium">Mínimo</label>
                  <input type="number" value={editarIngr.stock_minimo}
                    onChange={e => setEditarIngr({...editarIngr, stock_minimo: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1.5 font-medium">Costo/Unidad</label>
                <input type="number" step="0.01" value={editarIngr.costo_por_unidad}
                  onChange={e => setEditarIngr({...editarIngr, costo_por_unidad: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={guardarEdicion}
                className="flex-1 py-2.5 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition-colors shadow-sm font-medium">Guardar</button>
              <button onClick={() => setEditarIngr(null)}
                className="py-2.5 px-5 border border-stone-200 text-sm rounded-xl hover:bg-stone-50 transition-colors text-stone-500">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear ingrediente */}
      {modal === 'crear' && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-medium text-stone-800">Nuevo Ingrediente</h3>
              <button onClick={() => setModal(null)} className="text-stone-300 hover:text-stone-500 text-lg leading-none">&times;</button>
            </div>
              <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1.5 font-medium">Nombre</label>
                <input placeholder="Ej: Harina" value={nuevoIngr.nombre}
                  onChange={e => setNuevoIngr({...nuevoIngr, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50 placeholder:text-stone-300" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1.5 font-medium">Unidad</label>
                <input placeholder="kg, L, pz" value={nuevoIngr.unidad_medida}
                  onChange={e => setNuevoIngr({...nuevoIngr, unidad_medida: e.target.value })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50 placeholder:text-stone-300" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1.5 font-medium">Stock</label>
                <input type="number" placeholder="0" value={nuevoIngr.stock_actual}
                  onChange={e => setNuevoIngr({...nuevoIngr, stock_actual: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50 placeholder:text-stone-300" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1.5 font-medium">Mínimo</label>
                <input type="number" placeholder="0" value={nuevoIngr.stock_minimo}
                  onChange={e => setNuevoIngr({...nuevoIngr, stock_minimo: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50 placeholder:text-stone-300" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1.5 font-medium">Costo/Unidad</label>
                <input type="number" step="0.01" placeholder="0.00" value={nuevoIngr.costo_por_unidad}
                  onChange={e => setNuevoIngr({...nuevoIngr, costo_por_unidad: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50 placeholder:text-stone-300" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={crearIngrediente}
                className="flex-1 py-2.5 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition-colors shadow-sm font-medium">Crear</button>
              <button onClick={() => setModal(null)}
                className="py-2.5 px-5 border border-stone-200 text-sm rounded-xl hover:bg-stone-50 transition-colors text-stone-500">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
