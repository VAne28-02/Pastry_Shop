import { useState, useEffect } from 'react';
import { api } from '../api';

const API = 'http://localhost:3000/api';

export default function StockView({ token }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editStock, setEditStock] = useState({ id: null, valor: 0 });
  const [editProd, setEditProd] = useState(null);

  const cargar = async () => {
    const [p, c] = await Promise.all([
      fetch(`${API}/productos`).then(r => r.json()),
      api.getCategorias()
    ]);
    if (Array.isArray(p)) setProductos(p);
    if (Array.isArray(c)) setCategorias(c);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const actualizarStock = async (id, stock) => {
    try {
      const res = await fetch(`${API}/productos/${id}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stock })
      });
      const data = await res.json();
      if (res.ok) {
        setEditStock({ id: null, valor: 0 });
        cargar();
      } else {
        alert('Error: ' + (data.error || 'Error desconocido'));
      }
    } catch (e) {
      alert('Error de red: ' + e.message);
    }
  };

  const guardarEdicion = async () => {
    if (!editProd.nombre || !editProd.precio_base || !editProd.categoria_id) return;
    const res = await fetch(`${API}/productos/${editProd.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nombre: editProd.nombre,
        descripcion: editProd.descripcion,
        precio_base: parseFloat(editProd.precio_base),
        categoria_id: parseInt(editProd.categoria_id)
      })
    });
    if (res.ok) { setEditProd(null); cargar(); }
  };

  const eliminarProducto = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    const res = await fetch(`${API}/productos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) cargar();
  };

  if (cargando) return <div className="flex items-center justify-center h-64"><p className="text-neutral-400">Cargando...</p></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-xl font-serif text-neutral-700 mb-6">Stock de Productos</h1>

      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="text-left py-3 px-4 text-neutral-500 font-medium">Producto</th>
              <th className="text-left py-3 px-4 text-neutral-500 font-medium">Categoría</th>
              <th className="text-left py-3 px-4 text-neutral-500 font-medium">Precio</th>
              <th className="text-left py-3 px-4 text-neutral-500 font-medium">Stock</th>
              <th className="text-left py-3 px-4 text-neutral-500 font-medium">Disponible</th>
              <th className="text-left py-3 px-4 text-neutral-500 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                <td className="py-3 px-4 font-medium text-neutral-800">{p.nombre}</td>
                <td className="py-3 px-4 text-neutral-500">{p.categoria?.nombre || '—'}</td>
                <td className="py-3 px-4 text-neutral-600">${p.precio_base?.toFixed(2)}</td>
                <td className="py-3 px-4">
                  {editStock.id === p.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" value={editStock.valor}
                        onChange={e => setEditStock({ ...editStock, valor: Number(e.target.value) })}
                        className="w-20 px-2 py-1 border border-neutral-200 rounded text-sm" autoFocus />
                      <button onClick={() => actualizarStock(p.id, editStock.valor)} className="text-xs text-green-600 font-medium">Guardar</button>
                      <button onClick={() => setEditStock({ id: null, valor: 0 })} className="text-xs text-neutral-400">Cancelar</button>
                    </div>
                  ) : (
                    <span className={`font-medium ${p.stock > 5 ? 'text-green-600' : p.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {p.stock}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${p.disponible ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {p.disponible ? 'Sí' : 'No'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setEditStock({ id: p.id, valor: p.stock })}
                      className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded hover:bg-neutral-200">Stock</button>
                    <button onClick={() => setEditProd({ ...p, precio_base: p.precio_base?.toString() || '', categoria_id: p.categoria_id?.toString() || '' })}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">✎</button>
                    <button onClick={() => eliminarProducto(p.id, p.nombre)}
                      className="text-xs px-2 py-1 bg-neutral-100 text-neutral-500 rounded hover:bg-neutral-200">✕</button>
                  </div>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-neutral-400">No hay productos.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal editar producto */}
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
