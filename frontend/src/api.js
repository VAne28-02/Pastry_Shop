const BASE = 'http://localhost:3000/api';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return res.json();
}

export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  register: (data) => request('POST', '/auth/registrar', data),
  loginAs: (email, password) => request('POST', '/auth/login', { email, password }),
  getPedidos: (token) => request('GET', '/chat/pedidos', null, token),
  getPedido: (id, token) => request('GET', '/chat/pedido/' + id, null, token),
  updateEstado: (id, nuevoEstado, token) => request('PUT', '/chat/pedido/' + id + '/estado', { nuevoEstado }, token),
  getProductos: (token) => request('GET', '/productos', null, token),
  getCategorias: (token) => request('GET', '/categorias', null, token),
  enviarChat: (telefono, mensaje) => request('POST', '/chat/enviar', { telefono, mensaje }),
  registrarPedido: (data) => request('POST', '/pedidos/registrar', data),
  getPromos: () => request('GET', '/promos'),
  crearPromo: (data, token) => request('POST', '/promos', data, token),
  editarPromo: (id, data, token) => request('PUT', '/promos/' + id, data, token),
  eliminarPromo: (id, token) => request('DELETE', '/promos/' + id, null, token),
  limpiarPedidosFecha: (fecha, token) => request('DELETE', '/pedidos/limpiar?fecha=' + fecha, null, token),
  getAsistencia: (token) => request('GET', '/asistencia', null, token),
  marcarAsistencia: (token) => request('POST', '/asistencia/marcar', {}, token),
};
