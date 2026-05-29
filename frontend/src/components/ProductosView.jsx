import { useState, useEffect } from 'react';
import { api } from '../api';

export default function ProductosView() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtroCat, setFiltroCat] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getProductos(), api.getCategorias()]).then(([p, c]) => {
      if (Array.isArray(p)) setProductos(p);
      if (Array.isArray(c)) setCategorias(c);
      setLoading(false);
    });
  }, []);

  const filtrados = filtroCat ? productos.filter(p => p.categoria_id === parseInt(filtroCat)) : productos;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium text-neutral-900">Productos</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{productos.length} productos</p>
        </div>

        <select
          value={filtroCat}
          onChange={e => setFiltroCat(e.target.value)}
          className="text-sm bg-white border border-neutral-200 rounded-lg px-3 py-2
                     focus:outline-none focus:border-neutral-400 text-neutral-600"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-neutral-300 text-sm">Cargando...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtrados.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-neutral-100 p-5">
              <div className="w-full h-24 bg-neutral-50 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-3xl opacity-30">🧁</span>
              </div>
              <h3 className="font-medium text-sm text-neutral-900">{p.nombre}</h3>
              {p.descripcion && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{p.descripcion}</p>}
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-light text-neutral-900">${p.precio_base}</span>
                {p.categoria && (
                  <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full">
                    {p.categoria.nombre}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
