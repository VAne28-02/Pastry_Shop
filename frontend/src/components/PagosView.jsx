import { useState, useEffect } from 'react';

const API = 'http://localhost:3000/api';

export default function PagosView({ token }) {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/pagos`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setPagos(await res.json());
      } catch (e) { console.error(e); }
      setCargando(false);
    })();
  }, [token]);

  const total = pagos.reduce((s, p) => s + p.monto, 0);

  if (cargando) return <div className="flex items-center justify-center h-64"><p className="text-stone-400">Cargando...</p></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-stone-800">Pagos</h1>
        <div className="text-sm text-stone-500">Total: <span className="font-semibold text-stone-800">S/.{total.toFixed(2)}</span></div>
      </div>
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <th className="text-left py-3 px-4 text-stone-500 font-medium">ID</th>
              <th className="text-left py-3 px-4 text-stone-500 font-medium">Monto</th>
              <th className="text-left py-3 px-4 text-stone-500 font-medium">Método</th>
              <th className="text-left py-3 px-4 text-stone-500 font-medium">Estado</th>
              <th className="text-left py-3 px-4 text-stone-500 font-medium">Pedido</th>
              <th className="text-left py-3 px-4 text-stone-500 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map(p => (
              <tr key={p.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                <td className="py-3 px-4 text-stone-600">#{p.id}</td>
                <td className="py-3 px-4 font-medium text-stone-800">S/.{p.monto.toFixed(2)}</td>
                <td className="py-3 px-4 capitalize text-stone-600">{p.metodo_pago}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    p.estado_pago === 'completado' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>{p.estado_pago}</span>
                </td>
                <td className="py-3 px-4 text-stone-600">#{p.pedido_id}</td>
                <td className="py-3 px-4 text-stone-400">{new Date(p.fecha_pago).toLocaleDateString()}</td>
              </tr>
            ))}
            {pagos.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-stone-400">No hay pagos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
