import { useState } from 'react';
import PedidosView from './PedidosView';
import ProductosView from './ProductosView';
import PromosView from './PromosView';
import AsistenciaView from './AsistenciaView';
import ChatButton from './ChatButton';
import PagosView from './PagosView';
import GananciaView from './GananciaView';
import InventarioView from './InventarioView';
import StockView from './StockView';

const tabsPorRol = {
  Administrador: [
    { id: 'pedidos', label: 'Pedidos', icon: '📋' },
    { id: 'productos', label: 'Productos', icon: '🧁' },
    { id: 'pagos', label: 'Pagos', icon: '💰' },
    { id: 'ganancia', label: 'Ganancia', icon: '📊' },
    { id: 'inventario', label: 'Inventario', icon: '📦' },
    { id: 'stock', label: 'Stock', icon: '🏷️' },
    { id: 'asistencia', label: 'Asistencia', icon: '⏱️' },
    { id: 'promos', label: 'Promos', icon: '🎉' },
  ],
  Empleado: [
    { id: 'asistencia', label: 'Asistencia', icon: '⏱️' },
    { id: 'pedidos', label: 'Pedidos', icon: '📋' },
    { id: 'productos', label: 'Productos', icon: '🧁' },
    { id: 'promos', label: 'Promos', icon: '🎉' },
  ],
  Cliente: [
    { id: 'productos', label: 'Productos', icon: '🧁' },
    { id: 'promos', label: 'Promos', icon: '🎉' },
  ],
};

export default function Dashboard({ session, onLogout }) {
  const [tab, setTab] = useState(session.rol_nombre === 'Administrador' ? 'pedidos' : 'productos');
  const [showRegEmpleado, setShowRegEmpleado] = useState(false);
  const [regForm, setRegForm] = useState({ nombre: '', email: '', password: '', cargo: '' });
  const [regMsg, setRegMsg] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const tabs = tabsPorRol[session.rol_nombre] || tabsPorRol.Cliente;

  const nombre = session.perfil?.nombre || session.email;
  const rolNombre = session.rol_nombre || 'Usuario';

  const registrarEmpleado = async (e) => {
    e.preventDefault(); setRegMsg(''); setRegLoading(true);
    try {
      const resp = await fetch('http://localhost:3000/api/auth/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...regForm, rol: 'empleado' })
      });
      const res = await resp.json();
      setRegLoading(false);
      if (res.usuario) {
        setRegForm({ nombre: '', email: '', password: '', cargo: '' });
        setShowRegEmpleado(false);
      } else {
        setRegMsg('❌ ' + (res.error || res.message || 'Error del servidor'));
      }
    } catch (err) {
      setRegLoading(false);
      setRegMsg('❌ Error de conexión: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-stone-200 flex flex-col shrink-0">
        {/* Logo area */}
        <div className="p-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <img src="/diseno_web/logo.png" alt="NuConexion" className="h-8 w-auto" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{nombre}</p>
              <p className="text-xs text-stone-400">{rolNombre}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                ${tab === t.id
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                }`}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-stone-100">
          {session.rol_nombre === 'Administrador' && (
            <button onClick={() => setShowRegEmpleado(true)}
              className="w-full mb-2 px-3 py-2 text-xs text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors font-medium">
              + Registrar Empleado
            </button>
          )}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-stone-400 truncate">{session.email}</span>
            <button onClick={onLogout}
              className="text-xs text-stone-400 hover:text-red-500 transition-colors shrink-0 ml-2 font-medium">
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative bg-stone-50">
        {tab === 'pedidos' && <PedidosView token={session.token} />}
        {tab === 'productos' && <ProductosView token={session.token} session={session} />}
        {tab === 'promos' && <PromosView session={session} token={session.token} />}
        {tab === 'asistencia' && <AsistenciaView token={session.token} session={session} />}
        {tab === 'pagos' && <PagosView token={session.token} />}
        {tab === 'ganancia' && <GananciaView token={session.token} />}
        {tab === 'inventario' && <InventarioView token={session.token} />}
        {tab === 'stock' && <StockView token={session.token} />}
        <ChatButton session={session} />
      </main>

      {/* Modal Registrar Empleado */}
      {showRegEmpleado && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4" onClick={() => !regLoading && setShowRegEmpleado(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium text-stone-800">Registrar Empleado</h2>
              {!regLoading && <button onClick={() => { setShowRegEmpleado(false); setRegMsg(''); }} className="text-stone-300 hover:text-stone-500 transition-colors">&times;</button>}
            </div>
            <form onSubmit={registrarEmpleado} className="space-y-4">
              <div>
                <label className="text-xs text-stone-500 block mb-1.5">Nombre completo</label>
                <input type="text" required value={regForm.nombre}
                  onChange={e => setRegForm({ ...regForm, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400 placeholder:text-stone-300" />
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1.5">Correo electrónico</label>
                <input type="email" required value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400 placeholder:text-stone-300" />
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1.5">Contraseña</label>
                <input type="password" required value={regForm.password}
                  onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400 placeholder:text-stone-300" />
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1.5">Cargo</label>
                <input type="text" value={regForm.cargo}
                  onChange={e => setRegForm({ ...regForm, cargo: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400 placeholder:text-stone-300"
                  placeholder="Ej: Pastelero, Cajero" />
              </div>
              {regMsg && <p className={`text-xs text-center ${regMsg.includes('✅') ? 'text-emerald-600' : 'text-red-500'}`}>{regMsg}</p>}
              <button type="submit" disabled={regLoading}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {regLoading ? 'Registrando...' : 'Registrar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
