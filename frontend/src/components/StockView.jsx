import { useState, useEffect } from 'react';
import { api } from '../api';

const API = 'http://localhost:3000/api';

export default function StockView({ token }) {
  const [productos, setProductos] = useState([]);
  const [promos, setPromos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editStock, setEditStock] = useState({ id: null, valor: 0, tipo: 'producto' });
  const [editProd, setEditProd] = useState(null);

  const cargar = async () => {
    const [p, pro, c] = await Promise.all([
      fetch(`${API}/productos`).then(r => r.json()),
      fetch(`${API}/promos`).then(r => r.json()),
      api.getCategorias()
    ]);
    if (Array.isArray(p)) setProductos(p);
    if (pro?.success) setPromos(pro.data);
    if (Array.isArray(c)) setCategorias(c);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const actualizarStockProducto = async (id, stock) => {
    try {
      const res = await fetch(`${API}/productos/${id}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stock })
      });
      const data = await res.json();
      if (res.ok) {
        setEditStock({ id: null, valor: 0, tipo: 'producto' });
        cargar();
      } else {
        alert('Error: ' + (data.error || 'Error desconocido'));
      }
    } catch (e) {
      alert('Error de red: ' + e.message);
    }
  };

  const actualizarStockPromo = async (id, stock) => {
    try {
      const res = await fetch(`${API}/promos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stock })
      });
      const data = await res.json();
      if (res.ok) {
        setEditStock({ id: null, valor: 0, tipo: 'producto' });
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

  const [filtroCat, setFiltroCat] = useState('');

  if (cargando) return <div className="flex items-center justify-center h-64"><p className="text-stone-400">Cargando...</p></div>;

  const stockRow = (item, tipo, idPrefix, categoriaLabel) => (
    <tr key={idPrefix + item.id} className="border-b border-stone-100 hover:bg-stone-50/50">
      <td className="py-3 px-4 font-medium text-stone-800">{item.nombre || item.titulo}</td>
      <td className="py-3 px-4 text-stone-600">S/.{(item.precio_base || item.precio)?.toFixed(2)}</td>
      <td className="py-3 px-4">
        {editStock.id === item.id && editStock.tipo === tipo ? (
          <div className="flex items-center gap-2">
            <input type="number" min="0" value={editStock.valor}
              onChange={e => setEditStock({ ...editStock, valor: Number(e.target.value) })}
              className="w-20 px-2 py-1 border border-stone-200 rounded text-sm" autoFocus />
            <button onClick={() => tipo === 'producto' ? actualizarStockProducto(item.id, editStock.valor) : actualizarStockPromo(item.id, editStock.valor)}
              className="text-xs text-emerald-600 font-medium">Guardar</button>
            <button onClick={() => setEditStock({ id: null, valor: 0, tipo: 'producto' })} className="text-xs text-stone-400">Cancelar</button>
          </div>
        ) : (
          <span className={`font-medium ${item.stock > 5 ? 'text-emerald-600' : item.stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
            {item.stock}
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          {tipo === 'producto' && (
            <>
              <button onClick={() => setEditProd({ ...item, precio_base: item.precio_base?.toString() || '', categoria_id: item.categoria_id?.toString() || '' })}
                className="text-xs px-2 py-1 bg-white text-blue-600 rounded-lg border border-stone-200 hover:bg-blue-50 transition-colors">✎</button>
              <button onClick={() => eliminarProducto(item.id, item.nombre)}
                className="text-xs px-2 py-1 bg-white text-red-500 rounded-lg border border-stone-200 hover:bg-red-50 transition-colors">✕</button>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const catsFiltradas = filtroCat
    ? categorias.filter(c => c.id === parseInt(filtroCat))
    : categorias;
  const mostrarPromos = !filtroCat || filtroCat === 'promos';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-stone-800">Stock</h1>
        <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)}
          className="text-sm bg-white border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-300 text-stone-600">
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          <option value="promos">Promociones</option>
        </select>
      </div>

      {catsFiltradas.map(cat => {
        const prods = productos.filter(p => p.categoria_id === cat.id);
        if (prods.length === 0) return null;
        return (
          <div key={cat.id} className="mb-8">
            <h2 className="text-sm font-medium text-stone-700 mb-3 px-1">{cat.nombre}</h2>
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="text-left py-3 px-4 text-stone-500 font-medium">Producto</th>
                    <th className="text-left py-3 px-4 text-stone-500 font-medium">Precio</th>
                    <th className="text-left py-3 px-4 text-stone-500 font-medium">Stock</th>
                    <th className="text-left py-3 px-4 text-stone-500 font-medium"></th>
                  </tr>
                </thead>
                <tbody>{prods.map(p => stockRow(p, 'producto', 'prod-', cat.nombre))}</tbody>
              </table>
            </div>
          </div>
        );
      })}

      {mostrarPromos && promos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-stone-700 mb-3 px-1">Promociones</h2>
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="text-left py-3 px-4 text-stone-500 font-medium">Promo</th>
                  <th className="text-left py-3 px-4 text-stone-500 font-medium">Precio</th>
                  <th className="text-left py-3 px-4 text-stone-500 font-medium">Stock</th>
                  <th className="text-left py-3 px-4 text-stone-500 font-medium"></th>
                </tr>
              </thead>
              <tbody>{promos.map(p => stockRow(p, 'promo', 'promo-', ''))}</tbody>
            </table>
          </div>
        </div>
      )}

      {editProd && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setEditProd(null)}>
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-stone-700 mb-4">Editar Producto</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Nombre</label>
                <input value={editProd.nombre} onChange={e => setEditProd({...editProd, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Descripción</label>
                <textarea value={editProd.descripcion} onChange={e => setEditProd({...editProd, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" rows="2" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 mb-1">Precio</label>
                  <input type="number" step="0.01" value={editProd.precio_base}
                    onChange={e => setEditProd({...editProd, precio_base: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 mb-1">Categoría</label>
                  <select value={editProd.categoria_id} onChange={e => setEditProd({...editProd, categoria_id: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white">
                    <option value="">Seleccionar</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={guardarEdicion} className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">Guardar</button>
              <button onClick={() => setEditProd(null)} className="py-2 px-4 border border-stone-200 text-sm rounded-lg hover:bg-stone-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
