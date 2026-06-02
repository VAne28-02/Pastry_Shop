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
      setMensaje(res.tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada');
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

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-stone-400">Cargando...</p></div>;

  return (
    <div className={`${esAdmin ? 'max-w-5xl' : 'max-w-2xl'} p-8 mx-auto`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium text-stone-800">Asistencia</h1>
          <p className="text-sm text-stone-400 mt-0.5">Registro de entrada y salida</p>
        </div>
        {esAdmin && (
          <button onClick={() => setModalAgregar(true)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
            Agregar
          </button>
        )}
      </div>

      {/* My attendance card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-600">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-800">Mi registro hoy</p>
              <p className="text-xs text-stone-400">{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${!hoy ? 'bg-stone-100 text-stone-500' : hoy.hora_salida ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {!hoy ? 'Sin marcar' : hoy.hora_salida ? 'Completado' : 'En curso'}
          </div>
        </div>

        <div className="flex items-center gap-8 mb-5">
          <div className="flex-1 bg-stone-50 rounded-xl p-4 text-center">
            <p className="text-xs text-stone-400 mb-1">Entrada</p>
            <p className="text-2xl font-light text-stone-800">{hoy ? formatear(hoy.hora_entrada) : '—'}</p>
          </div>
          <div className="text-stone-300 text-xl">→</div>
          <div className="flex-1 bg-stone-50 rounded-xl p-4 text-center">
            <p className="text-xs text-stone-400 mb-1">Salida</p>
            <p className="text-2xl font-light text-stone-800">{hoy?.hora_salida ? formatear(hoy.hora_salida) : '—'}</p>
          </div>
        </div>

        <button onClick={marcar}
          className={`w-full py-3 rounded-xl text-sm font-medium transition-colors shadow-sm ${
            !hoy
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : hoy.hora_salida
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
          disabled={hoy?.hora_salida}>
          {!hoy ? 'Marcar entrada' : hoy.hora_salida ? 'Jornada completada' : 'Marcar salida'}
        </button>
        {mensaje && (
          <p className={`text-xs text-center mt-3 ${mensaje.includes('✅') ? 'text-emerald-600' : 'text-red-500'}`}>{mensaje}</p>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6 shadow-sm flex items-center gap-3 flex-wrap">
        <div className="relative flex items-center">
          <input type="date" value={fechaFiltro} id="fechaFiltro"
            onChange={e => setFechaFiltro(e.target.value)}
            className="w-0 h-0 p-0 border-0 opacity-0 absolute" />
          <button onClick={() => document.getElementById('fechaFiltro')?.showPicker?.()}
            className="flex items-center gap-2 px-3 py-1.5 border border-stone-200 rounded-xl text-sm bg-stone-50 hover:bg-stone-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-stone-400">
              <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
            </svg>
            <span className="text-stone-500 text-sm">{fechaFiltro ? new Date(fechaFiltro + 'T00:00:00').toLocaleDateString('es-PE') : 'Filtrar fecha'}</span>
          </button>
        </div>
        <button onClick={aplicarFiltro}
          className="px-4 py-1.5 bg-emerald-600 text-white text-xs rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">Filtrar</button>
        {fechaFiltro && (
          <button onClick={limpiarFiltro}
            className="px-3 py-1.5 border border-stone-200 text-xs rounded-xl hover:bg-stone-50 transition-colors text-stone-500">Limpiar</button>
        )}
      </div>

      {/* Admin: employees by role */}
      {esAdmin && empleados.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-stone-400"><path d="M10 1a6 6 0 00-3.318 10.975C7.09 12.15 8 13.162 8 14.5v1a2 2 0 002 2h2a2 2 0 002-2v-1c0-1.338.91-2.35 1.318-2.525A6 6 0 0010 1z" /><circle cx="10" cy="4" r="1.5" /><path d="M6.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" /><path d="M10.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" /></svg>
            <p className="text-sm font-medium text-stone-700">Estado del equipo hoy</p>
          </div>
          {Object.entries(agruparPorCargo(hoyEmpleados)).map(([cargo, lista]) => (
            <div key={cargo} className="mb-4">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-2 px-1">{cargo}</p>
              <div className="space-y-2">
                {lista.map(({ empleado, asistencia }) => (
                  <div key={empleado.id}
                    className="bg-white rounded-xl border border-stone-200 px-5 py-3.5 flex items-center justify-between text-sm shadow-sm hover:border-stone-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${asistencia ? (asistencia.hora_salida ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-stone-200'}`} />
                      <div>
                        <span className="font-medium text-stone-800">{empleado.nombre}</span>
                        <span className="text-stone-400 ml-2 text-xs">{empleado.usuario?.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {asistencia ? (
                        <>
                          <div className="text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-1.5">
                            <span className="text-stone-400">Entrada </span>
                            <span className="font-medium text-stone-700">{formatear(asistencia.hora_entrada)}</span>
                          </div>
                          {asistencia.hora_salida ? (
                            <div className="text-xs bg-emerald-50 text-emerald-600 rounded-lg px-3 py-1.5 font-medium">
                              Salida {formatear(asistencia.hora_salida)}
                            </div>
                          ) : (
                            <button onClick={() => adminMarcar(empleado.id)} disabled={marcando === empleado.id}
                              className="px-4 py-1.5 bg-emerald-600 text-white text-xs rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
                              {marcando === empleado.id ? '...' : 'Marcar salida'}
                            </button>
                          )}
                        </>
                      ) : (
                        <button onClick={() => adminMarcar(empleado.id)} disabled={marcando === empleado.id}
                          className="px-4 py-1.5 bg-emerald-600 text-white text-xs rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
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

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-stone-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
          <p className="text-sm font-medium text-stone-700">
            {fechaFiltro ? `Registros del ${new Date(fechaFiltro + 'T00:00:00').toLocaleDateString('es-PE')}` : 'Últimos registros'}
          </p>
        </div>
        {historial.length > 0 ? (
          <div className="space-y-2">
            {historial.map(h => (
              <div key={h.id}
                className="bg-white rounded-xl border border-stone-200 px-5 py-3.5 flex items-center justify-between text-sm shadow-sm hover:border-stone-300 transition-colors">
                <div className="flex items-center gap-4">
                  {esAdmin && h.empleado && (
                    <span className="text-xs font-medium text-stone-600 bg-stone-50 rounded-lg px-2.5 py-1">{h.empleado.nombre}</span>
                  )}
                  <span className="text-stone-400 text-xs">{new Date(h.hora_entrada).toLocaleDateString('es-PE')}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-emerald-50 text-emerald-600 rounded-lg px-2.5 py-1 font-medium">
                      {formatear(h.hora_entrada)}
                    </span>
                    <span className="text-stone-300">→</span>
                    <span className={`rounded-lg px-2.5 py-1 font-medium ${h.hora_salida ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                      {h.hora_salida ? formatear(h.hora_salida) : '—'}
                    </span>
                  </div>
                </div>
                {esAdmin && (
                  <button onClick={() => abrirEditar(h)}
                    className="text-xs px-2.5 py-1.5 bg-white text-blue-600 rounded-lg border border-stone-200 hover:bg-blue-50 transition-colors flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M2.695 5.763A1.75 1.75 0 003.5 6.756V14.5A2.5 2.5 0 006 17h8a2.5 2.5 0 002.5-2.5V6.756a1.75 1.75 0 00.805-.993l.402-1.31A.75.75 0 0017 3.5H3a.75.75 0 00-.707.953l.402 1.31zM6 7.75a.75.75 0 011.5 0v5.5a.75.75 0 01-1.5 0v-5.5zm4.25 0a.75.75 0 011.5 0v5.5a.75.75 0 01-1.5 0v-5.5zm4.25 0a.75.75 0 011.5 0v5.5a.75.75 0 01-1.5 0v-5.5z" /></svg>
                    Editar
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-stone-200 mx-auto mb-2"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
            <p className="text-sm text-stone-300">No hay registros{fechaFiltro ? ' en esta fecha' : ''}.</p>
          </div>
        )}
      </div>

      {/* Modal Agregar Asistencia */}
      {modalAgregar && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setModalAgregar(false)}>
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-medium text-stone-800">Agregar Asistencia</h3>
              <button onClick={() => setModalAgregar(false)} className="text-stone-300 hover:text-stone-500 text-lg leading-none">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1.5 font-medium">Empleado</label>
                <select value={formAsis.empleado_id} onChange={e => setFormAsis({...formAsis, empleado_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white">
                  <option value="">Seleccionar</option>
                  {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} ({e.cargo})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1.5 font-medium">Fecha</label>
                <input type="date" value={formAsis.fecha}
                  onChange={e => setFormAsis({...formAsis, fecha: e.target.value })}
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 mb-1.5 font-medium">Entrada</label>
                  <input type="time" value={formAsis.hora_entrada}
                    onChange={e => setFormAsis({...formAsis, hora_entrada: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 mb-1.5 font-medium">Salida (opcional)</label>
                  <input type="time" value={formAsis.hora_salida}
                    onChange={e => setFormAsis({...formAsis, hora_salida: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={guardarAgregar}
                className="flex-1 py-2.5 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition-colors shadow-sm font-medium">Guardar</button>
              <button onClick={() => setModalAgregar(false)}
                className="py-2.5 px-5 border border-stone-200 text-sm rounded-xl hover:bg-stone-50 transition-colors text-stone-500">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Asistencia */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setModalEditar(null)}>
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-medium text-stone-800">Editar Asistencia</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {modalEditar.empleado?.nombre || ''} — {new Date(modalEditar.hora_entrada).toLocaleDateString('es-PE')}
                </p>
              </div>
              <button onClick={() => setModalEditar(null)} className="text-stone-300 hover:text-stone-500 text-lg leading-none">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 mb-1.5 font-medium">Entrada</label>
                  <input type="time" value={formAsis.hora_entrada}
                    onChange={e => setFormAsis({...formAsis, hora_entrada: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 mb-1.5 font-medium">Salida</label>
                  <input type="time" value={formAsis.hora_salida}
                    onChange={e => setFormAsis({...formAsis, hora_salida: e.target.value })}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-stone-50" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={guardarEditar}
                className="flex-1 py-2.5 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition-colors shadow-sm font-medium">Guardar</button>
              <button onClick={() => setModalEditar(null)}
                className="py-2.5 px-5 border border-stone-200 text-sm rounded-xl hover:bg-stone-50 transition-colors text-stone-500">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
