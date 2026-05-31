import http from 'http';
const data = JSON.stringify({ nombre: 'Laura Gómez', telefono: '555666777', tipo: 'delivery', items: [{ producto_id: 1, cantidad: 2 }] });
const opts = { hostname: 'localhost', port: 3000, path: '/api/pedidos/registrar', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
const req = http.request(opts, res => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>{ console.log(res.statusCode, b); process.exit(0); }); });
req.on('error', e => { console.error(e.message); process.exit(1); });
req.write(data); req.end();
