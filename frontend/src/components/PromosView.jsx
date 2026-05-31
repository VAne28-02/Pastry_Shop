import { useState } from 'react';
import { api } from '../api';

const promos = [
  { id: 1, titulo: '2x1 en Tortas', descripcion: 'Todos los martes y jueves. Lleva 2 tortas y paga 1.', icono: '🍰' },
  { id: 2, titulo: 'Café + Pastel', descripcion: 'Combina cualquier café con un pastel y ahorra $5.', icono: '☕' },
  { id: 3, titulo: 'Happy Hour', descripcion: 'De 5 a 7pm, 20% de descuento en todas las bebidas.', icono: '🥤' },
  { id: 4, titulo: 'Pedidos por WhatsApp', descripcion: 'Haz tu pedido por chat y obtén un postre de cortesía.', icono: '💬' },
];

const fondos = ['bg-rose-50', 'bg-amber-50', 'bg-sky-50', 'bg-green-50'];

export default function PromosView({ session }) {
  const [modal, setModal] = useState(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo, setTipo] = useState('aqui');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const registarPromo = async () => {
    if (!nombre.trim()) return;
    setEnviando(true);
    const res = await fetch('http://localhost:3000/api/pedidos/promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim() || undefined, tipo, promoTitulo: modal.titulo })
    }).then(r => r.json());
    setEnviando(false);
    if (res.success) {
      setMensaje('✅ Promoción registrada en pedidos');
      setTimeout(() => { setModal(null); setMensaje(''); setNombre(''); setTelefono(''); }, 1200);
    } else {
      setMensaje('❌ ' + (res.error || 'Error'));
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-medium text-neutral-900">Promociones</h1>
        <p className="text-sm text-neutral-400 mt-0.5">{promos.length} promociones</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {promos.map((p, i) => (
          <div key={p.id}
            className="bg-white rounded-xl border border-neutral-100 p-5 hover:border-neutral-200 transition-colors group">
            <div className={`w-full h-24 ${fondos[i % fondos.length]} rounded-lg mb-4 flex items-center justify-center`}>
              <span className="text-3xl opacity-50">{p.icono}</span>
            </div>
            <h3 className="font-medium text-sm text-neutral-900">{p.titulo}</h3>
            <p className="text-xs text-neutral-400 mt-1 line-clamp-3 mb-4">{p.descripcion}</p>
            <button onClick={() => { setModal(p); setNombre(''); setTelefono(''); setTipo('aqui'); setMensaje(''); }}
              className="w-full py-2 bg-neutral-900 text-white text-xs rounded-lg hover:bg-neutral-800 transition-colors">
              Registrar pedido
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4" onClick={() => !enviando && setModal(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium text-neutral-900">Registrar Promoción</h2>
              {!enviando && <button onClick={() => setModal(null)} className="text-neutral-300 hover:text-neutral-500 text-lg leading-none">&times;</button>}
            </div>
            <div className="bg-neutral-50 rounded-lg p-3 mb-5">
              <p className="font-medium text-sm text-neutral-900">{modal.titulo}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{modal.descripcion}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Nombre del cliente</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-300"
                  placeholder="Obligatorio" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Teléfono (opcional)</label>
                <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 transition-colors placeholder:text-neutral-300"
                  placeholder="Opcional" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-2">Tipo</label>
                <div className="flex gap-2">
                  {['aqui', 'delivery'].map(t => (
                    <button key={t} onClick={() => setTipo(t)}
                      className={`flex-1 py-2.5 rounded-lg text-sm border transition-colors ${tipo === t ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>
                      {t === 'aqui' ? 'Consumir aquí' : 'Delivery'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {mensaje && <p className="text-sm text-center mt-4">{mensaje}</p>}
            <button onClick={registarPromo} disabled={enviando || !nombre.trim()}
              className="w-full mt-5 py-3 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors">
              {enviando ? 'Registrando...' : 'Registrar en pedidos'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
