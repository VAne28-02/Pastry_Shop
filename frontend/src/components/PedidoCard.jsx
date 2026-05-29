export const PedidoCard = ({ pedido, onUpdate }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-lg">{pedido.cliente.nombre}</h3>
        <p className="text-sm text-slate-400 mb-4">{pedido.cliente.telefono}</p>
        <p className="text-3xl font-bold mb-6">${pedido.total}</p>
        <div className="flex gap-2">
            <button onClick={() => onUpdate(pedido.id, 'PREPARANDO')} 
                    className="bg-slate-900 text-white py-2 px-4 rounded-lg text-sm">
                Preparar
            </button>
        </div>
    </div>
);