import { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:3000/api';

export default function GananciaView({ token }) {
  const hoy = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(hoy);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);

  const consultar = async (f) => {
    setCargando(true);
    try {
      const res = await fetch(`${API}/ganancia/diaria?fecha=${f}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDatos(await res.json());
    } catch (e) { console.error(e); }
    setCargando(false);
  };

  const refFecha = useRef(fecha);
  useEffect(() => { refFecha.current = fecha; });
  useEffect(() => {
    consultar(fecha);
    const id = setInterval(() => consultar(refFecha.current), 15000);
    return () => clearInterval(id);
  }, [fecha]);

  const presets = [
    { label: 'Hoy', get: () => hoy },
    { label: 'Ayer', get: () => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; } },
    { label: 'Esta semana', get: () => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); return d.toISOString().split('T')[0]; } },
  ];

  const fechaDisplay = new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium text-stone-800">Ganancias</h1>
          <p className="text-sm text-stone-400 mt-0.5">Resumen financiero diario</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-400">Actualizado automáticamente</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-500">En vivo</span>
          </div>
        </div>
      </div>

      {/* Date selector */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-stone-400"><path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" /></svg>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="text-sm px-3 py-1.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50" />
          </div>
          <div className="flex gap-1.5">
            {presets.map(p => (
              <button key={p.label} onClick={() => setFecha(p.get())}
                className={`px-3 py-1.5 text-xs rounded-xl border transition-all ${
                  fecha === p.get()
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'border-stone-200 text-stone-500 hover:border-emerald-300 hover:text-emerald-600'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-stone-400 capitalize ml-auto">{fechaDisplay}</p>
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm text-stone-400">Cargando...</p>
          </div>
        </div>
      ) : !datos ? (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 text-stone-200 mx-auto mb-3">
            <path fillRule="evenodd" d="M1.22 5.222a.75.75 0 011.06 0L7 9.94l3.47-3.47a.75.75 0 011.06 0l2.47 2.47V5.75A.75.75 0 0114.75 5h1.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v.75h6v-5.69l-1.97 1.97a.75.75 0 01-1.06 0L10 6.06 6.03 10.03a.75.75 0 01-1.06 0L1.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            <path d="M4.5 11.5a.75.75 0 00-1.5 0v2.75A2.75 2.75 0 005.75 17h10.5A2.75 2.75 0 0019 14.25v-.5a.75.75 0 00-1.5 0v.5c0 .69-.56 1.25-1.25 1.25H5.75c-.69 0-1.25-.56-1.25-1.25V11.5z" />
          </svg>
          <p className="text-sm text-stone-300">Sin datos para esta fecha</p>
        </div>
      ) : (
        <>
          {/* Main metrics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-600">
                    <path d="M10 1a6 6 0 00-3.318 10.975C7.09 12.15 8 13.162 8 14.5v1a2 2 0 002 2h2a2 2 0 002-2v-1c0-1.338.91-2.35 1.318-2.525A6 6 0 0010 1z" />
                    <circle cx="10" cy="4" r="1.5" />
                    <path d="M6.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                    <path d="M10.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                  </svg>
                </div>
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium">Ingresos</p>
              </div>
              <p className="text-3xl font-light text-stone-800">S/.{datos.ingresos.toFixed(2)}</p>
              <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (datos.ingresos / (datos.ingresos || 1)) * 100)}%` }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:border-amber-200 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-600">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium">Costo Est.</p>
              </div>
              <p className="text-3xl font-light text-stone-500">S/.{datos.costoEstimado.toFixed(2)}</p>
              <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, datos.ingresos > 0 ? (datos.costoEstimado / datos.ingresos) * 100 : 0)}%` }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${datos.gananciaNeta >= 0 ? 'bg-emerald-50' : 'bg-red-50'} rounded-xl flex items-center justify-center`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${datos.gananciaNeta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-1.483 1.06V4.5a.75.75 0 00-1.5 0v3.869L8.357 7.31a.75.75 0 00-1.214.882l2.5 3.5a.75.75 0 001.214 0l2.5-3.5z" clipRule="evenodd" />
                    <path d="M4.5 13.25a.75.75 0 01.75-.75h9.5a.75.75 0 010 1.5h-9.5a.75.75 0 01-.75-.75z" />
                  </svg>
                </div>
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium">Ganancia Neta</p>
              </div>
              <p className={`text-3xl font-light ${datos.gananciaNeta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                S/.{datos.gananciaNeta.toFixed(2)}
              </p>
              <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${datos.gananciaNeta >= 0 ? 'bg-emerald-500' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(100, datos.ingresos > 0 ? Math.abs(datos.gananciaNeta / datos.ingresos) * 100 : 0)}%` }} />
              </div>
            </div>
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-stone-400">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.25-7.25a.75.75 0 000-1.5H6.75a.75.75 0 000 1.5h6.5z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium">Margen de ganancia</p>
              </div>
              <div className="flex items-end gap-3">
                <p className={`text-2xl font-semibold ${Number(datos.porcentaje) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {datos.porcentaje}%
                </p>
                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden mb-1">
                  <div className={`h-full rounded-full transition-all ${Number(datos.porcentaje) >= 30 ? 'bg-emerald-500' : Number(datos.porcentaje) >= 0 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${Math.min(100, Math.max(0, Number(datos.porcentaje) + 50))}%` }} />
                </div>
              </div>
              <p className="text-xs text-stone-400 mt-2">
                {Number(datos.porcentaje) >= 30 ? 'Excelente margen' : Number(datos.porcentaje) >= 15 ? 'Buen margen' : Number(datos.porcentaje) >= 0 ? 'Margen ajustado' : 'Margen negativo'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-stone-400">
                  <path d="M1 4.25a3.733 3.733 0 012.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0016.75 2H3.25A2.25 2.25 0 001 4.25z" />
                  <path d="M1 7.25a3.733 3.733 0 012.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0016.75 5H3.25A2.25 2.25 0 001 7.25z" />
                  <path d="M3.25 8.5A2.25 2.25 0 001 10.75v5A2.25 2.25 0 003.25 18h13.5A2.25 2.25 0 0019 15.75v-5A2.25 2.25 0 0016.75 8.5H3.25zM5 12.5a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75z" />
                </svg>
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium">Transacciones</p>
              </div>
              <p className="text-2xl font-semibold text-stone-800">{datos.totalTransacciones}</p>
              <p className="text-xs text-stone-400 mt-2">
                {datos.totalTransacciones === 0 ? 'Sin ventas' : datos.totalTransacciones === 1 ? '1 venta' : `${datos.totalTransacciones} ventas`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
