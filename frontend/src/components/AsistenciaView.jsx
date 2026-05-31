import { useState, useEffect } from 'react';
import { api } from '../api';

const API = 'http://localhost:3000/api';

export default function AsistenciaView({ token, session }) {
  const [hoy, setHoy] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState('');

  const [empleados, setEmpleados] = useState([]);
  const [hoyEmpleados, setHoyEmpleados] = useState([]);
  const [marcando, setMarcando] = useState(null);

  const [modalAgregar, setModalAgregar] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [formAsis, setFormAsis] = useState({ empleado_id: '', fecha: '', hora_entrada: '', hora_salida: '' });

  const esAdmin = session?.rol_nombre === 'Administrador';

  const cargar = async (fecha) => {
    setLoading(true);
    let res;
    if (fecha) {
      res = await fetch(`${API}/asistencia?fecha=${fecha}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
    } else {
      res = await api.getAsistencia(token);
    }
    if (res.success) {
      setHoy(res.hoy);
      setHistorial(res.historial);
    }

    if (esAdmin) {
      const empRes = await fetch(`${API}/empleados`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
      if (Array.isArray(empRes)) {
        setEmpleados(empRes);
        const hoyStr = new Date().toISOString().split('T')[0];
        const promises = empRes.map(async (e) => {
          const attRes = await fetch(`${API}/asistencia?fecha=${hoyStr}&empleado_id=${e.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json());
          return { empleado: e, asistencia: attRes.hoy };
        });
        const results = await Promise.all(promises);
        setHoyEmpleados(results);
      }
    }

    setLoading(false);
  };

  useEffect(() => { cargar(fechaFiltro); }, []);

  const marcar = async () => {
    setMensaje('');
    const res = await api.marcarAsistencia(token);
    if (res.success) {
      setMensaje(res.tipo === 'entrada' ? '✅ Entrada registrada' : '✅ Salida registrada');
      cargar(fechaFiltro);
    } else {
      setMensaje('❌ ' + (res.error || 'Error'));
    }
  };

  const adminMarcar = async (empleadoId) => {
    setMarcando(empleadoId);
    const res = await fetch(`${API}/asistencia/admin/marcar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ empleado_id: empleadoId })
    }).then(r => r.json());
    setMarcando(null);
    if (res.success) cargar(fechaFiltro);
  };

  const guardarAgregar = async () => {
    if (!formAsis.empleado_id || !formAsis.fecha || !formAsis.hora_entrada) return;
    const res = await fetch(`${API}/asistencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(formAsis)
    }).then(r => r.json());
    if (res.success) {
      setModalAgregar(false);
      setFormAsis({ empleado_id: '', fecha: '', hora_entrada: '', hora_salida: '' });
      cargar(fechaFiltro);
    }
  };

  const guardarEditar = async () => {
    if (!modalEditar) return;
    const body = {};
    if (formAsis.hora_entrada) body.hora_entrada = new Date(`${formAsis.fecha}T${formAsis.hora_entrada}`).toISOString();
    if (formAsis.hora_salida) body.hora_salida = new Date(`${formAsis.fecha}T${formAsis.hora_salida}`).toISOString();

    const res = await fetch(`${API}/asistencia/${modalEditar.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    }).then(r => r.json());
    if (res.success) {
      setModalEditar(null);
      setFormAsis({ empleado_id: '', fecha: '', hora_entrada: '', hora_salida: '' });
      cargar(fechaFiltro);
    }
  };

  const abrirEditar = (h) => {
    const d = new Date(h.hora_entrada);
    const fecha = d.toISOString().split('T')[0];
    const horaEntrada = d.toTimeString().slice(0, 5);
    const horaSalida = h.hora_salida ? new Date(h.hora_salida).toTimeString().slice(0, 5) : '';
    setFormAsis({ empleado_id: '', fecha, hora_entrada: horaEntrada, hora_salida: horaSalida });
    setModalEditar(h);
  };

  const aplicarFiltro = () => { setLoading(true); cargar(fechaFiltro); };
  const limpiarFiltro = () => { setFechaFiltro(''); setLoading(true); cargar(''); };

  const formatear = (d) => new Date(d).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const agruparPorCargo = (arr) => {
    const grupos = {};
    arr.forEach(({ empleado, asistencia }) => {
      const cargo = empleado.cargo || 'Sin cargo';
      if (!grupos[cargo]) grupos[cargo] = [];
      grupos[cargo].push({ empleado, asistencia });
    });
    return grupos;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-neutral-400">Cargando...</p></div>;

  return (
    <div className={`${esAdmin ? 'max-w-4xl' : 'max-w-2xl'} p-8 mx-auto`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium text-neutral-900">Asistencia</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Registro de entrada y salida</p>
        </div>
        {esAdmin && (
          <button onClick={() => setModalAgregar(true)}
            className="px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 transition-colors">
            + Agregar
          </button>
        )}
      </div>

      {/* Tarjeta de hoy (propia) */}
      <div className="bg-white rounded-xl border border-neutral-100 p-6 mb-6">
        <p className="text-xs text-neutral-400 mb-4">Mi registro hoy</p>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-neutral-400">Entrada</p>
            <p className="text-lg font-medium text-neutral-900 mt-1">{hoy ? formatear(hoy.hora_entrada) : '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-400">Salida</p>
            <p className="text-lg font-medium text-neutral-900 mt-1">{hoy?.hora_salida ? formatear(hoy.hora_salida) : '—'}</p>
          </div>
        </div>
        <button onClick={marcar}
          className="mt-5 px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
          {!hoy ? 'Marcar entrada' : hoy.hora_salida ? 'Ya completaste hoy' : 'Marcar salida'}
        </button>
        {mensaje && <p className="text-sm mt-3">{mensaje}</p>}
      </div>

      {/* Filtro calendario */}
      <div className="bg-white rounded-xl border border-neutral-100 p-4 mb-6 flex items-center gap-3 flex-wrap">
        <p className="text-xs text-neutral-400 uppercase tracking-wider">Filtrar por fecha</p>
        <input type="date" value={fechaFiltro}
          onChange={e => setFechaFiltro(e.target.value)}
          className="px-3 py-1.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
        <button onClick={aplicarFiltro} className="px-4 py-1.5 bg-neutral-900 text-white text-xs rounded-lg hover:bg-neutral-800 transition-colors">Filtrar</button>
        {fechaFiltro && <button onClick={limpiarFiltro} className="px-3 py-1.5 border border-neutral-200 text-xs rounded-lg hover:bg-neutral-50 transition-colors">Limpiar</button>}
      </div>

      {/* Panel admin: empleados por cargo */}
      {esAdmin && empleados.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Empleados — Estado hoy</p>
          {Object.entries(agruparPorCargo(hoyEmpleados)).map(([cargo, lista]) => (
            <div key={cargo} className="mb-4">
              <p className="text-sm font-medium text-neutral-700 mb-2 capitalize">{cargo}</p>
              <div className="space-y-2">
                {lista.map(({ empleado, asistencia }) => (
                  <div key={empleado.id} className="bg-white rounded-lg border border-neutral-100 px-4 py-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-neutral-800">{empleado.nombre}</span>
                      <span className="text-neutral-400 ml-2 text-xs">{empleado.usuario?.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {asistencia ? (
                        <>
                          <span className="text-xs text-neutral-500">Entrada {formatear(asistencia.hora_entrada)}</span>
                          {asistencia.hora_salida ? (
                            <span className="text-xs text-green-600">Salida {formatear(asistencia.hora_salida)} ✓</span>
                          ) : (
                            <button onClick={() => adminMarcar(empleado.id)} disabled={marcando === empleado.id}
                              className="px-3 py-1 bg-neutral-900 text-white text-xs rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors">
                              {marcando === empleado.id ? '...' : 'Marcar salida'}
                            </button>
                          )}
                        </>
                      ) : (
                        <button onClick={() => adminMarcar(empleado.id)} disabled={marcando === empleado.id}
                          className="px-3 py-1 bg-neutral-900 text-white text-xs rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors">
                          {marcando === empleado.id ? '...' : 'Marcar entrada'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 ? (
        <div>
          <p className="text-xs text-neutral-400 mb-3">
            {fechaFiltro ? `Registros del ${new Date(fechaFiltro).toLocaleDateString('es-PE')}` : 'Últimos registros'}
          </p>
          <div className="space-y-2">
            {historial.map(h => (
              <div key={h.id} className="bg-white rounded-lg border border-neutral-100 px-4 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  {esAdmin && h.empleado && (
                    <span className="text-xs text-neutral-400 font-medium">{h.empleado.nombre}</span>
                  )}
                  <span className="text-neutral-500">{new Date(h.hora_entrada).toLocaleDateString('es-PE')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-neutral-700">Entrada {formatear(h.hora_entrada)}</span>
                  <span className="text-neutral-400">→</span>
                  <span className="text-neutral-700">{h.hora_salida ? `Salida ${formatear(h.hora_salida)}` : '—'}</span>
                  {esAdmin && (
                    <button onClick={() => abrirEditar(h)}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">✎</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-neutral-400 text-center py-8">No hay registros{fechaFiltro ? ' en esta fecha' : ''}.</p>
      )}

      {/* Modal Agregar Asistencia */}
      {modalAgregar && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setModalAgregar(false)}>
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Agregar Asistencia</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Empleado</label>
                <select value={formAsis.empleado_id} onChange={e => setFormAsis({...formAsis, empleado_id: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 bg-white">
                  <option value="">Seleccionar</option>
                  {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} ({e.cargo})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Fecha</label>
                <input type="date" value={formAsis.fecha}
                  onChange={e => setFormAsis({...formAsis, fecha: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 mb-1">Entrada</label>
                  <input type="time" value={formAsis.hora_entrada}
                    onChange={e => setFormAsis({...formAsis, hora_entrada: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 mb-1">Salida (opcional)</label>
                  <input type="time" value={formAsis.hora_salida}
                    onChange={e => setFormAsis({...formAsis, hora_salida: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={guardarAgregar} className="flex-1 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 transition-colors">Guardar</button>
              <button onClick={() => setModalAgregar(false)} className="py-2 px-4 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Asistencia */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setModalEditar(null)}>
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Editar Asistencia</h3>
            <p className="text-xs text-neutral-400 mb-3">
              {modalEditar.empleado?.nombre || ''} — {new Date(modalEditar.hora_entrada).toLocaleDateString('es-PE')}
            </p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 mb-1">Entrada</label>
                  <input type="time" value={formAsis.hora_entrada}
                    onChange={e => setFormAsis({...formAsis, hora_entrada: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 mb-1">Salida</label>
                  <input type="time" value={formAsis.hora_salida}
                    onChange={e => setFormAsis({...formAsis, hora_salida: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={guardarEditar} className="flex-1 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 transition-colors">Guardar</button>
              <button onClick={() => setModalEditar(null)} className="py-2 px-4 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
