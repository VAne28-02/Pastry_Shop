import { useState, useEffect } from 'react';
import { api } from '../api';

const estados = ['Pendiente', 'Preparando', 'Listo', 'Entregado', 'Cancelado'];
const colores = {
  Pendiente: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  Preparando: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  Listo: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  Entregado: { bg: 'bg-stone-50', text: 'text-stone-400', border: 'border-stone-200' },
  Cancelado: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200' },
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

  const stats = [
    { label: 'Total', count: pedidos.length, color: 'text-stone-800' },
    { label: 'Hoy', count: pedidos.filter(p => {
      const d = new Date(p.fecha_creacion);
      const f = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return f === hoy();
    }).length, color: 'text-emerald-600' },
    { label: 'Pendiente', count: pedidos.filter(p => p.estado === 'Pendiente').length, color: 'text-amber-600' },
    { label: 'Preparando', count: pedidos.filter(p => p.estado === 'Preparando').length, color: 'text-blue-600' },
  ];

  const totalHoy = pedidos.filter(p => {
    const d = new Date(p.fecha_creacion);
    const f = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return f === hoy();
  }).reduce((s, p) => s + Number(p.total), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-stone-800">Pedidos</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {filtroEstado ? `${filtrados.length} de ${pedidos.length} pedidos` : `${pedidos.length} pedidos`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-stone-400">Total hoy</p>
            <p className="text-sm font-semibold text-emerald-600">S/.{totalHoy.toFixed(2)}</p>
          </div>
          <button onClick={cargar}
            className="px-4 py-2 bg-white border border-stone-200 text-stone-500 text-xs rounded-xl hover:text-emerald-600 hover:border-emerald-300 transition-all flex items-center gap-1.5 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" /></svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-stone-200 px-4 py-3 shadow-sm">
            <p className="text-xs text-stone-400">{s.label}</p>
            <p className={`text-lg font-semibold mt-0.5 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Estado filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-stone-400 font-medium mr-1">Estado:</span>
            <button onClick={() => setFiltroEstado('')}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${!filtroEstado ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'border-stone-200 text-stone-500 hover:border-emerald-300 hover:text-emerald-600'}`}>
              Todos
            </button>
            {estados.map(e => (
              <button key={e} onClick={() => setFiltroEstado(e)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${filtroEstado === e ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'border-stone-200 text-stone-500 hover:border-emerald-300 hover:text-emerald-600'}`}>
                {e}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-stone-200 mx-1" />

          {/* Tipo filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400 font-medium mr-1">Tipo:</span>
            <button onClick={() => setFiltroTipo('')}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${!filtroTipo ? 'bg-stone-700 text-white border-stone-700 shadow-sm' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}>
              Todos
            </button>
            <button onClick={() => setFiltroTipo('aqui')}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${filtroTipo === 'aqui' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'border-emerald-200 text-emerald-500 hover:border-emerald-400'}`}>
              Aquí
            </button>
            <button onClick={() => setFiltroTipo('delivery')}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${filtroTipo === 'delivery' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'border-amber-200 text-amber-500 hover:border-amber-400'}`}>
              Delivery
            </button>
          </div>

          <div className="w-px h-6 bg-stone-200 mx-1" />

          {/* Date filter */}
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-stone-400"><path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" /></svg>
            <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
              className="text-xs px-3 py-1.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50" />
            {filtrados.length > 0 && (
              <button
                onClick={async () => {
                  if (!confirm(`¿Eliminar todos los pedidos del ${filtroFecha}?`)) return;
                  if (!confirm(`Esta acción no se puede deshacer. ¿Continuar?`)) return;
                  const res = await api.limpiarPedidosFecha(filtroFecha, token);
                  if (res.success) cargar();
                }}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c-.84 0-1.673.025-2.5.075V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.325C11.673 4.025 10.84 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
                Limpiar día
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders grid */}
      {loading ? (
        <div className="text-center py-20 text-stone-300 text-sm">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 text-stone-200 mx-auto mb-3"><path d="M3.196 12.87l-.825.483a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.758 0l7.25-4.25a.75.75 0 000-1.294l-.825-.484-5.666 3.322a2.25 2.25 0 01-2.276 0L3.196 12.87z" /><path d="M3.196 8.87l-.825.483a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.758 0l7.25-4.25a.75.75 0 000-1.294l-.825-.484-5.666 3.322a2.25 2.25 0 01-2.276 0L3.196 8.87z" /><path d="M10.38 1.103a.75.75 0 00-.76 0l-7.25 4.25a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.76 0l7.25-4.25a.75.75 0 000-1.294l-7.25-4.25z" /></svg>
          <p className="text-sm text-stone-300">
            {filtroEstado ? `No hay pedidos con estado "${filtroEstado}"` : 'No hay pedidos'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(p => {
            const c = colores[p.estado] || { bg: 'bg-stone-100', text: 'text-stone-600', border: 'border-stone-200' };
            const inicial = (p.cliente?.nombre || 'C')[0].toUpperCase();
            const sig = siguienteEstado(p.estado);
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-stone-200 p-5 hover:border-emerald-200 hover:shadow-md transition-all shadow-sm">
                {/* Top: client + status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-sm font-medium text-emerald-600">
                      {inicial}
                    </div>
                    <div>
                      <h3 className="font-medium text-stone-800 text-sm">{p.cliente?.nombre || 'Cliente'}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-stone-300"><path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" /></svg>
                        <span className="text-xs text-stone-400">{p.cliente?.telefono || 'Sin teléfono'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
                      {p.estado}
                    </span>
                    {p.tipo && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        p.tipo === 'delivery'
                          ? 'border-amber-200 text-amber-500 bg-amber-50'
                          : 'border-emerald-200 text-emerald-500 bg-emerald-50'
                      }`}>
                        {p.tipo === 'delivery' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M6.5 3c-1.051 0-2.093.04-3.125.117A1.49 1.49 0 002 4.607V10.5h3.75c.414 0 .75.336.75.75 0 .256.05.505.145.742a.75.75 0 01-.358.913 10.02 10.02 0 00-.994.622c-.3.218-.576.455-.83.72H2v2.496c0 .83.673 1.5 1.5 1.5h1.039a3 3 0 005.922 0h3.578a3 3 0 005.922 0h1.039c.827 0 1.5-.67 1.5-1.5v-2.496h-2.517a.75.75 0 01-.53-.22l-2.25-2.25A.75.75 0 0014 10.5h-1.5v-3a.75.75 0 00-.75-.75H6.5z" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M3.75 3A1.75 1.75 0 002 4.75v3.5c0 .414.336.75.75.75h3.5a.75.75 0 00.75-.75v-3.5A1.75 1.75 0 005.25 3h-1.5zM3.75 10.5A1.75 1.75 0 002 12.25v3.5c0 .414.336.75.75.75h3.5a.75.75 0 00.75-.75v-3.5a1.75 1.75 0 00-1.75-1.75h-1.5zM10.75 10.5A1.75 1.75 0 009 12.25v3.5c0 .414.336.75.75.75h3.5a1.75 1.75 0 001.75-1.75v-3.5a1.75 1.75 0 00-1.75-1.75h-3.5zM14.25 3c-.966 0-1.75.784-1.75 1.75v3.5c0 .414.336.75.75.75h3.5a.75.75 0 00.75-.75v-3.5A1.75 1.75 0 0015.75 3h-1.5z" /></svg>
                        )}
                        {p.tipo === 'delivery' ? 'Delivery' : 'Aquí'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items preview */}
                {p.detalles && p.detalles.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {p.detalles.slice(0, 2).map(d => (
                      <div key={d.id} className="flex items-center justify-between text-xs text-stone-500">
                        <span>{d.cantidad}x {d.producto?.nombre || 'Producto'}</span>
                        <span>S/.{d.subtotal}</span>
                      </div>
                    ))}
                    {p.detalles.length > 2 && (
                      <p className="text-[10px] text-stone-300">+{p.detalles.length - 2} más</p>
                    )}
                  </div>
                )}

                {/* Total + time */}
                <div className="flex items-end justify-between mt-3 pt-3 border-t border-stone-100">
                  <div>
                    <p className="text-xl font-light text-stone-800">S/.{p.total}</p>
                    {p.fecha_creacion && (
                      <p className="text-[10px] text-stone-300 mt-0.5 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
                        {new Date(p.fecha_creacion).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => abrirDetalle(p.id)}
                      className="text-xs px-3 py-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                      Detalle
                    </button>
                    {sig && (
                      <button onClick={() => cambiarEstado(p.id, sig)}
                        className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm font-medium">
                        {sig}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalle */}
      {detalle && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4" onClick={() => setDetalle(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="bg-stone-50 px-6 py-4 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-stone-800">Pedido #{detalle.id}</h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {detalle.cliente?.nombre || 'Cliente'} · {detalle.cliente?.telefono || 'Sin teléfono'}
                  </p>
                </div>
                <button onClick={() => setDetalle(null)} className="w-7 h-7 bg-white rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors">&times;</button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${colores[detalle.estado]?.bg || 'bg-stone-100'} ${colores[detalle.estado]?.text || 'text-stone-600'} ${colores[detalle.estado]?.border || 'border-stone-200'}`}>{detalle.estado}</span>
                {detalle.tipo && (
                  <span className={`text-[11px] px-2.5 py-1 rounded-full border flex items-center gap-1 ${detalle.tipo === 'delivery' ? 'border-amber-200 text-amber-500 bg-amber-50' : 'border-emerald-200 text-emerald-500 bg-emerald-50'}`}>
                    {detalle.tipo === 'delivery' ? 'Delivery' : 'Aquí'}
                  </span>
                )}
              </div>
            </div>

            {/* Modal body */}
            <div className="p-6">
              {/* Products */}
              <div className="space-y-2 mb-5">
                {detalle.detalles?.map(d => (
                  <div key={d.id} className="flex items-center justify-between py-2 px-3 bg-stone-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-stone-500 bg-white px-2 py-0.5 rounded-lg border border-stone-200">{d.cantidad}x</span>
                      <span className="text-sm text-stone-700">{d.producto?.nombre || 'Producto'}</span>
                    </div>
                    <span className="text-sm font-medium text-stone-700">S/.{d.subtotal}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between py-3 px-3 bg-emerald-50 rounded-xl mb-5">
                <span className="text-sm font-semibold text-stone-700">Total</span>
                <span className="text-sm font-semibold text-stone-800">S/.{detalle.total}</span>
              </div>

              {/* Pagos */}
              {detalle.pagos?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs text-stone-400 font-medium mb-2 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M10.75 10.818v-1.614l1.456-.37a.75.75 0 10-.412-1.442l-1.529.389-.07-.07a3.223 3.223 0 00-4.39-.09l-.04.033a3.222 3.222 0 00-.09 4.646l.04.04a2.503 2.503 0 00.264.289l.27.27.04.04a3.222 3.222 0 004.388.088l.04-.033a3.22 3.22 0 00.729-.883l.053-.11.14.006a2.5 2.5 0 002.5-2.5v-.048a2.502 2.502 0 00-2.074-2.46l-1.042-.208v1.613a.75.75 0 11-1.5 0z" /><path fillRule="evenodd" d="M10 1a9 9 0 100 18 9 9 0 000-18zM3.5 10a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" clipRule="evenodd" /></svg>
                    Pago
                  </p>
                  {detalle.pagos.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-white border border-stone-200 rounded-xl mb-1.5">
                      <span className="text-sm text-stone-600 capitalize">{p.metodo_pago}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-700">S/.{p.monto.toFixed(2)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${p.estado_pago === 'completado' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {p.estado_pago}
                        </span>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => window.open(`http://localhost:3000/api/factura/${detalle.id}`, '_blank')}
                    className="mt-2 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[10px] text-stone-500 hover:bg-stone-100 hover:text-emerald-600 transition-all inline-flex items-center gap-1 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 117.5 0 .75.75 0 01-7.5 0zm0 3a.75.75 0 117.5 0 .75.75 0 01-7.5 0z" clipRule="evenodd" /></svg>
                    Generar Factura
                  </button>
                </div>
              )}

              {/* Quick status buttons */}
              <div>
                <p className="text-xs text-stone-400 font-medium mb-2">Cambiar estado</p>
                <div className="flex flex-wrap gap-1.5">
                  {estados.map(e => {
                    const c = colores[e] || {};
                    return (
                      <button key={e}
                        onClick={() => { cambiarEstado(detalle.id, e); setDetalle(null); }}
                        className={`text-[11px] px-3 py-1.5 rounded-xl border font-medium transition-all ${
                          detalle.estado === e
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : `${c.bg || 'bg-white'} ${c.text || 'text-stone-500'} ${c.border || 'border-stone-200'} hover:opacity-80`
                        }`}>
                        {e}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
