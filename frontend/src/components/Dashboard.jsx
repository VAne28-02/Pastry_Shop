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
    { id: 'chat', label: 'Chat', icon: '💬' },
  ],
  Empleado: [
    { id: 'asistencia', label: 'Asistencia', icon: '⏱️' },
    { id: 'pedidos', label: 'Pedidos', icon: '📋' },
    { id: 'productos', label: 'Productos', icon: '🧁' },
    { id: 'promos', label: 'Promos', icon: '🎉' },
    { id: 'chat', label: 'Chat', icon: '💬' },
  ],
  Cliente: [
    { id: 'productos', label: 'Productos', icon: '🧁' },
    { id: 'promos', label: 'Promos', icon: '🎉' },
  ],
};

export default function Dashboard({ session, onLogout }) {
  const [tab, setTab] = useState(session.rol_nombre === 'Administrador' ? 'pedidos' : 'productos');
  const tabs = tabsPorRol[session.rol_nombre] || tabsPorRol.Cliente;

  const nombre = session.perfil?.nombre || session.email;
  const rolNombre = session.rol_nombre || 'Usuario';

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside className="w-56 bg-white border-r border-neutral-100 flex flex-col shrink-0">
        <div className="p-5 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-serif">P</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{nombre}</p>
              <p className="text-xs text-neutral-400">{rolNombre}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${tab === t.id
                  ? 'bg-neutral-100 text-neutral-900 font-medium'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-neutral-100">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-neutral-400 truncate">{session.email}</span>
            <button onClick={onLogout} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors shrink-0 ml-2">
              Salir
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative">
        {tab === 'pedidos' && <PedidosView token={session.token} />}
        {tab === 'productos' && <ProductosView token={session.token} session={session} />}
        {tab === 'promos' && <PromosView />}
        {tab === 'asistencia' && <AsistenciaView token={session.token} session={session} />}
        {tab === 'pagos' && <PagosView token={session.token} />}
        {tab === 'ganancia' && <GananciaView token={session.token} />}
        {tab === 'inventario' && <InventarioView token={session.token} />}
        {tab === 'stock' && <StockView token={session.token} />}
        {tab === 'chat' && (
          <div className="p-8 max-w-4xl mx-auto">
            <ChatButton embedded session={session} />
          </div>
        )}

        {/* Floating chat button for cliente and empleado roles */}
        {(session.rol_nombre === 'Cliente' || session.rol_nombre === 'Empleado') && <ChatButton session={session} />}
      </main>
    </div>
  );
}
