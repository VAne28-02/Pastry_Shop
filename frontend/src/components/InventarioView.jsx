import { useState, useEffect } from 'react';

const API = 'http://localhost:3000/api';

export default function InventarioView({ token }) {
  const [ingredientes, setIngredientes] = useState([]);
  const [cargando, setCargando] = useState(true);
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

  if (cargando) return <div className="flex items-center justify-center h-64"><p className="text-neutral-400">Cargando...</p></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-serif text-neutral-700">Inventario de Ingredientes</h1>
        <button onClick={() => setModal('crear')} className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 transition-colors">
          + Nuevo Ingrediente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="text-left py-3 px-4 text-neutral-500 font-medium">Nombre</th>
              <th className="text-left py-3 px-4 text-neutral-500 font-medium">Unidad</th>
              <th className="text-left py-3 px-4 text-neutral-500 font-medium">Stock</th>
              <th className="text-left py-3 px-4 text-neutral-500 font-medium">Mínimo</th>
              <th className="text-left py-3 px-4 text-neutral-500 font-medium">Costo/Unidad</th>
              <th className="text-left py-3 px-4 text-neutral-500 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {ingredientes.map(i => {
              const bajoStock = i.stock_actual <= i.stock_minimo;
              return (
                <tr key={i.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                  <td className="py-3 px-4 font-medium text-neutral-800">{i.nombre}</td>
                  <td className="py-3 px-4 text-neutral-500">{i.unidad_medida}</td>
                  <td className={`py-3 px-4 font-medium ${bajoStock ? 'text-red-600' : 'text-green-600'}`}>
                    {i.stock_actual} {bajoStock && '⚠️'}
                  </td>
                  <td className="py-3 px-4 text-neutral-400">{i.stock_minimo}</td>
                  <td className="py-3 px-4 text-neutral-600">${i.costo_por_unidad.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button onClick={() => setMovimiento({ id: i.id, tipo: 'entrada', cantidad: 0 })}
                        className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">+</button>
                      <button onClick={() => setMovimiento({ id: i.id, tipo: 'salida', cantidad: 0 })}
                        className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">-</button>
                      <button onClick={() => setEditarIngr({ ...i })}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">✎</button>
                      <button onClick={() => eliminarIngrediente(i.id, i.nombre)}
                        className="text-xs px-2 py-1 bg-neutral-100 text-neutral-500 rounded hover:bg-neutral-200">✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {ingredientes.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-neutral-400">No hay ingredientes registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal movimiento */}
      {movimiento.id && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setMovimiento({ id: null, tipo: 'entrada', cantidad: 0 })}>
          <div className="bg-white rounded-xl p-6 w-80 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-neutral-700 mb-4 capitalize">{movimiento.tipo} de Stock</h3>
            <input type="number" min="0" step="0.1" placeholder="Cantidad"
              value={movimiento.cantidad || ''}
              onChange={e => setMovimiento({ ...movimiento, cantidad: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-neutral-300"
            />
            <div className="flex gap-2">
              <button onClick={aplicarMovimiento} className="flex-1 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 transition-colors">Aplicar</button>
              <button onClick={() => setMovimiento({ id: null, tipo: 'entrada', cantidad: 0 })} className="py-2 px-4 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar ingrediente */}
      {editarIngr && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setEditarIngr(null)}>
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Editar Ingrediente</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Nombre</label>
                <input value={editarIngr.nombre}
                  onChange={e => setEditarIngr({...editarIngr, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Unidad</label>
                <input value={editarIngr.unidad_medida}
                  onChange={e => setEditarIngr({...editarIngr, unidad_medida: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Stock</label>
                <input type="number" value={editarIngr.stock_actual}
                  onChange={e => setEditarIngr({...editarIngr, stock_actual: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Mínimo</label>
                <input type="number" value={editarIngr.stock_minimo}
                  onChange={e => setEditarIngr({...editarIngr, stock_minimo: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Costo/Unidad</label>
                <input type="number" step="0.01" value={editarIngr.costo_por_unidad}
                  onChange={e => setEditarIngr({...editarIngr, costo_por_unidad: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={guardarEdicion} className="flex-1 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 transition-colors">Guardar</button>
              <button onClick={() => setEditarIngr(null)} className="py-2 px-4 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear ingrediente */}
      {modal === 'crear' && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Nuevo Ingrediente</h3>
            <div className="space-y-3">
              <input placeholder="Nombre" value={nuevoIngr.nombre}
                onChange={e => setNuevoIngr({...nuevoIngr, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              />
              <input placeholder="Unidad de medida (kg, L, pz)" value={nuevoIngr.unidad_medida}
                onChange={e => setNuevoIngr({...nuevoIngr, unidad_medida: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              />
              <div className="flex gap-3">
                <input type="number" placeholder="Costo x unidad" value={nuevoIngr.costo_por_unidad}
                  onChange={e => setNuevoIngr({...nuevoIngr, costo_por_unidad: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
                <input type="number" placeholder="Stock mínimo" value={nuevoIngr.stock_minimo}
                  onChange={e => setNuevoIngr({...nuevoIngr, stock_minimo: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>
              <input type="number" placeholder="Stock inicial" value={nuevoIngr.stock_actual}
                onChange={e => setNuevoIngr({...nuevoIngr, stock_actual: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={crearIngrediente} className="flex-1 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 transition-colors">Crear</button>
              <button onClick={() => setModal(null)} className="py-2 px-4 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
