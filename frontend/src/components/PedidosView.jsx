import { useState, useEffect } from 'react';
import { api } from '../api';

const estados = ['pendiente', 'PREPARANDO', 'LISTO', 'entregado', 'cancelado'];
const colores = {
  pendiente: 'bg-amber-50 text-amber-600 border-amber-200',
  PREPARANDO: 'bg-blue-50 text-blue-600 border-blue-200',
  LISTO: 'bg-green-50 text-green-600 border-green-200',
  entregado: 'bg-neutral-50 text-neutral-400 border-neutral-200',
  cancelado: 'bg-red-50 text-red-500 border-red-200',
};

const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

export default function PedidosView({ token }) {
  const [pedidos, setPedidos] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroFecha, setFiltroFecha] = useState(hoy());

  const filtrados = pedidos.filter(p => {
    if (filtroEstado && p.estado !== filtroEstado) return false;
    if (filtroTipo && p.tipo !== filtroTipo) return false;
    if (filtroFecha && p.fecha_creacion) {
      const fecha = new Date(p.fecha_creacion);
      const d = `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}`;
      if (d !== filtroFecha) return false;
    }
    return true;
  });



  const cargar = async () => {
    setLoading(true);
    const res = await api.getPedidos(token);
    if (res.success) setPedidos(res.data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (id, estado) => {
    const res = await api.updateEstado(id, estado, token);
    if (res.success) cargar();
  };

  const abrirDetalle = async (id) => {
    const res = await api.getPedido(id, token);
    if (res.success) setDetalle(res.data);
  };

  const siguienteEstado = (actual) => {
    const idx = estados.indexOf(actual);
    return idx < estados.length - 1 ? estados[idx + 1] : null;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium text-neutral-900">Pedidos</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {filtroEstado ? `${filtrados.length} de ${pedidos.length} pedidos` : `${pedidos.length} pedidos`}
          </p>
        </div>
        <button onClick={cargar} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
          Actualizar
        </button>
      </div>

      {/* Filtro por estado */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button onClick={() => setFiltroEstado('')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!filtroEstado ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>
          Todos
        </button>
        {estados.map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filtroEstado === e ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>
            {e}
          </button>
        ))}
      </div>

      {/* Filtro por tipo */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button onClick={() => setFiltroTipo('')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!filtroTipo ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>
          Todos
        </button>
        <button onClick={() => setFiltroTipo('aqui')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filtroTipo === 'aqui' ? 'bg-sky-600 text-white border-sky-600' : 'border-sky-200 text-sky-500 hover:border-sky-400'}`}>
          Aquí
        </button>
        <button onClick={() => setFiltroTipo('delivery')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filtroTipo === 'delivery' ? 'bg-purple-600 text-white border-purple-600' : 'border-purple-200 text-purple-500 hover:border-purple-400'}`}>
          Delivery
        </button>
      </div>

      {/* Filtro por fecha */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <label className="text-xs text-neutral-400">Fecha:</label>
        <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
          className="text-xs px-2 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400" />
        {filtrados.length > 0 && (
          <button
            onClick={async () => {
              if (!confirm(`¿Eliminar todos los pedidos del ${filtroFecha}?`)) return;
              if (!confirm(`Esta acción no se puede deshacer. ¿Continuar?`)) return;
              const res = await api.limpiarPedidosFecha(filtroFecha, token);
              if (res.success) cargar();
            }}
            className="ml-auto text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            Limpiar día
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-neutral-300 text-sm">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 text-neutral-300 text-sm">
          {filtroEstado ? `No hay pedidos con estado "${filtroEstado}"` : 'No hay pedidos'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-neutral-100 p-5 hover:border-neutral-200 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-neutral-900 text-sm">
                    {p.cliente?.nombre || 'Cliente'}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {p.cliente?.telefono || 'Sin teléfono'}
                  </p>
                  {p.fecha_creacion && (
                    <p className="text-[10px] text-neutral-300 mt-0.5">
                      {new Date(p.fecha_creacion).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${colores[p.estado] || 'bg-neutral-100 text-neutral-600'}`}>
                    {p.estado}
                  </span>
                  {p.tipo && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border
                      ${p.tipo === 'delivery' ? 'border-purple-200 text-purple-500 bg-purple-50' : 'border-sky-200 text-sky-500 bg-sky-50'}`}>
                      {p.tipo === 'delivery' ? 'Delivery' : 'Aquí'}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-2xl font-light text-neutral-900 mb-4">S/.{p.total}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => abrirDetalle(p.id)}
                  className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  Detalle
                </button>
                {siguienteEstado(p.estado) && (
                  <button
                    onClick={() => cambiarEstado(p.id, siguienteEstado(p.estado))}
                    className="ml-auto text-xs bg-neutral-900 text-white px-3 py-1.5 rounded-lg
                               hover:bg-neutral-800 transition-colors"
                  >
                    {siguienteEstado(p.estado)}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal detalle */}
      {detalle && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4" onClick={() => setDetalle(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-neutral-900">Pedido #{detalle.id}</h2>
              <button onClick={() => setDetalle(null)} className="text-neutral-300 hover:text-neutral-500 text-lg leading-none">&times;</button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${colores[detalle.estado] || 'bg-neutral-100 text-neutral-600'}`}>{detalle.estado}</span>
              {detalle.tipo && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${detalle.tipo === 'delivery' ? 'border-purple-200 text-purple-500 bg-purple-50' : 'border-sky-200 text-sky-500 bg-sky-50'}`}>
                  {detalle.tipo === 'delivery' ? 'Delivery' : 'Aquí'}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {detalle.detalles?.map(d => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">{d.cantidad}x {d.producto?.nombre || 'Producto'}</span>
                  <span className="text-neutral-500">S/.{d.subtotal}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between text-sm font-medium">
              <span className="text-neutral-500">Total</span>
              <span className="text-neutral-900">S/.{detalle.total}</span>
            </div>

            {/* Pagos */}
            {detalle.pagos?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">Pago</p>
                {detalle.pagos.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 capitalize">{p.metodo_pago}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">S/.{p.monto.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${p.estado_pago === 'completado' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                        {p.estado_pago}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {estados.map(e => (
                <button
                  key={e}
                  onClick={() => { cambiarEstado(detalle.id, e); setDetalle(null); }}
                  className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition-colors
                    ${detalle.estado === e ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
