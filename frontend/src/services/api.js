const API_URL = 'http://localhost:3000/api';

export const getPedidos = () => fetch(`${API_URL}/chat/pedidos`).then(res => res.json());

export const updateEstado = (id, nuevoEstado) => 
    fetch(`${API_URL}/chat/pedido/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado })
    });