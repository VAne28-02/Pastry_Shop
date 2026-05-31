import { useState } from 'react';

const API = 'http://localhost:3000/api';

const meses = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

export default function GananciaView({ token }) {
  const hoy = new Date();
  const [fecha, setFecha] = useState(hoy.toISOString().split('T')[0]);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);

  const consultar = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API}/ganancia/diaria?fecha=${fecha}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDatos(await res.json());
    } catch (e) { console.error(e); }
    setCargando(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-xl font-serif text-neutral-700 mb-6">Ganancia del Día</h1>

      <div className="flex items-center gap-4 mb-8">
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
        />
        <button
          onClick={consultar}
          disabled={cargando}
          className="px-5 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          {cargando ? 'Consultando...' : 'Consultar'}
        </button>
      </div>

      {datos && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-neutral-100 p-5">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Ingresos</p>
            <p className="text-2xl font-semibold text-neutral-900">${datos.ingresos.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-100 p-5">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Costo Estimado</p>
            <p className="text-2xl font-semibold text-neutral-600">${datos.costoEstimado.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-100 p-5">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Ganancia Neta</p>
            <p className={`text-2xl font-semibold ${datos.gananciaNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${datos.gananciaNeta.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-100 p-5">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Margen</p>
            <p className="text-2xl font-semibold text-neutral-900">{datos.porcentaje}%</p>
          </div>
          <div className="col-span-2 bg-white rounded-xl border border-neutral-100 p-5">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Transacciones</p>
            <p className="text-2xl font-semibold text-neutral-900">{datos.totalTransacciones}</p>
          </div>
        </div>
      )}
    </div>
  );
}
