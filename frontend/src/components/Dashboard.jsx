import { useState } from 'react';
import { api } from '../api';
import PedidosView from './PedidosView';
import ProductosView from './ProductosView';
import ChatView from './ChatView';

const tabs = [
  { id: 'pedidos', label: 'Pedidos', icon: '📋' },
  { id: 'productos', label: 'Productos', icon: '🧁' },
  { id: 'chat', label: 'Chat', icon: '💬' },
];

export default function Dashboard({ session, onLogout }) {
  const [tab, setTab] = useState('pedidos');

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-neutral-100 flex flex-col">
        <div className="p-5 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-serif">P</span>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">Pastelería</p>
              <p className="text-xs text-neutral-400">Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
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
            <button onClick={onLogout} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {tab === 'pedidos' && <PedidosView token={session.token} />}
        {tab === 'productos' && <ProductosView />}
        {tab === 'chat' && <ChatView />}
      </main>
    </div>
  );
}
