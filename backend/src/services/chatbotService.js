const { Groq } = require('groq-sdk');
const prisma = require('../config/db');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extraerPedidoDeHistorial(sesionId) {
  const historial = await prisma.mensajeChat.findMany({
    where: { sesion_id: sesionId },
    orderBy: { fecha_hora: 'asc' }
  });

  const productosBD = await prisma.producto.findMany({ select: { nombre: true } });
  const nombresValidos = productosBD.map(p => p.nombre).join(', ');

  const textoHistorial = historial.map(m => `${m.emisor}: ${m.contenido_mensaje}`).join('\n');

  const promptExtraccion = `
    Productos disponibles (usa SOLO estos nombres exactos): ${nombresValidos}.
    Analiza el historial de chat y extrae los productos que el cliente pidió.
    Responde ÚNICAMENTE en formato JSON: {"items": [{"nombre": "Nombre exacto del producto", "cantidad": 1}]}.
    El nombre debe coincidir EXACTAMENTE con uno de la lista. Si no hay productos, devuelve {"items": []}.
    Historial:
    ${textoHistorial}
  `;

  const respuesta = await groq.chat.completions.create({
    messages: [{ role: 'user', content: promptExtraccion }],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: "json_object" }
  });

  return JSON.parse(respuesta.choices[0].message.content);
}

const responderPreguntaConHistorial = async (identificador, mensajeUsuario, contexto = {}) => {
  try {
    let sesion = await prisma.sesionChat.findFirst({
      where: { telefono_whatsapp: identificador.toString(), estado_sesion: 'activa' },
      include: { cliente: true }
    });

    if (!sesion) {
      sesion = await prisma.sesionChat.create({
        data: { telefono_whatsapp: identificador.toString(), estado_sesion: 'activa' }
      });
    }

    const { rol, email, nombre_usuario } = contexto;

    // Datos en tiempo real según el rol
    let datosContexto = '';

    const pedidosPendientes = await prisma.pedido.count({ where: { estado: { in: ['pendiente', 'PREPARANDO'] } } });
    const pedidosHoy = await prisma.pedido.count({
      where: { id: { gte: await prisma.pedido.findFirst({ orderBy: { id: 'desc' }, select: { id: true } }).then(r => r?.id || 0) } }
    });

    if (rol === 'Empleado' || rol === 'Administrador') {
      const empleado = email ? await prisma.empleado.findFirst({ where: { usuario: { email } }, include: { asistencias: { take: 1, orderBy: { hora_entrada: 'desc' } } } }) : null;
      if (empleado) {
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const asisHoy = await prisma.asistencia.findFirst({ where: { empleado_id: empleado.id, hora_entrada: { gte: hoy } } });
        datosContexto += `👤 Tu perfil: ${empleado.nombre} (${empleado.cargo})\n`;
        datosContexto += `⏱ Asistencia hoy: ${asisHoy ? (asisHoy.hora_salida ? 'Completa (entrada y salida)' : 'Solo entrada registrada') : 'No has marcado entrada aún'}\n`;
      }
      datosContexto += `📊 Total pedidos pendientes/PREPARANDO: ${pedidosPendientes}\n`;

      const pedidosDetalle = await prisma.pedido.findMany({
        where: { estado: { in: ['pendiente', 'PREPARANDO', 'LISTO'] } },
        include: { cliente: true, detalles: { include: { producto: true } }, pagos: true },
        orderBy: { id: 'desc' },
        take: 20
      });
      if (pedidosDetalle.length > 0) {
        datosContexto += `\n📋 **PEDIDOS DETALLADOS (pendientes/PREPARANDO/LISTO):**\n`;
        for (const p of pedidosDetalle) {
          const cliente = p.cliente?.nombre || 'Cliente ocasional';
          const items = p.detalles.map(d => `${d.cantidad}x ${d.producto.nombre} ($${d.subtotal})`).join(', ');
          datosContexto += `  • #${p.id} | ${cliente} | ${p.tipo} | $${p.total} | ${p.estado} | ${items}\n`;
        }
      }
    }

    if (rol === 'Cliente' || !rol) {
      if (sesion.cliente_id) {
        const cliente = await prisma.cliente.findUnique({ where: { id: sesion.cliente_id }, include: { pedidos: { take: 3, orderBy: { id: 'desc' } } } });
        if (cliente) {
          datosContexto += `👤 Cliente: ${cliente.nombre}\n`;
          datosContexto += `📦 Tus últimos pedidos: ${cliente.pedidos.map(p => `#${p.id} (${p.estado} - $${p.total})`).join(', ') || 'Ninguno aún'}\n`;
        }
      }
    }

    const categorias = await prisma.categoria.findMany({ include: { productos: { where: { disponible: true } } } });
    const menuLimpio = categorias.map(c => `### ${c.nombre}:\n${c.productos.map(p => `- ${p.nombre}: $${p.precio_base}`).join('\n')}`).join('\n\n');

    const systemPrompt = `Eres "GourmetBot", el asistente virtual de la Pastelería. Responde de forma amable y breve en español.

## DATOS EN TIEMPO REAL
${datosContexto}

## SISTEMA DE LA PASTELERÍA

### Roles del sistema
- Administrador: acceso total (pedidos, productos, pagos, ganancias, inventario, asistencia, stock, chat).
- Empleado (Pastelero, Barista, Limpieza, etc.): marca asistencia, ve y actualiza pedidos, usa el chat.
- Cliente: ve productos, promos y puede pedir por chat.

### MENÚ COMPLETO (TODOS DISPONIBLES):
${menuLimpio}

**REGLAS ESTRICTAS SOBRE EL MENÚ:**
1. Todos los productos listados arriba están disponibles. NUNCA digas que no hay stock de un producto listado.
2. Si un cliente pregunta por un producto que SÍ está en el menú, confirma que está disponible.
3. Si un cliente pregunta por algo que NO está en el menú, dile amablemente que no lo tenemos y sugiérele productos del menú.
4. NO menciones stock ni cantidades. Solo precios.

### Pedidos
- Estados: pendiente → PREPARANDO → LISTO → entregado (también: cancelado).
- Tipos: "aqui" (consumir en local) o "delivery" (para llevar).
- Al crear un pedido, se genera automáticamente un pago.
- Los empleados pueden cambiar el estado de los pedidos (PREPARANDO, LISTO, entregado).
- El empleado TIENE acceso a la lista de pedidos detallados con cliente, productos, cantidades, subtotales, total, tipo y estado en los DATOS EN TIEMPO REAL. Puede responder preguntas como "¿qué pidió el cliente X?", "¿cuántos pedidos tiene Juan?", "dame detalles del pedido #5", etc.

### Pagos
- Métodos: efectivo, tarjeta, transferencia, etc.
- Cada pedido genera un pago automático.

### Ganancias (solo Administrador)
- El administrador puede ver ganancias diarias y por rango de fechas.

### Inventario de Ingredientes (solo Administrador)
- La pastelería gestiona ingredientes con stock actual y mínimo.

### Stock de Productos
- Solo el administrador gestiona el stock.

### Asistencia (Empleado y Administrador)
- Empleados marcan entrada y salida.
- Administrador puede marcar por ellos y ver historial.

Reglas de conversación:
- Si el usuario finaliza su pedido y da todos los datos, responde con [PEDIDO_FINALIZADO].
- Usa [NOMBRE: X] para capturar el nombre del cliente (ej: "Me llamo Juan" → [NOMBRE: Juan]).
- Pregunta al cliente si es para "aqui" o "delivery" y captúralo con [TIPO: aqui] o [TIPO: delivery].
- No inventes productos, solo usa los del menú.
- Si preguntan por funciones del sistema, explica según los roles.`;

    const historialMensajes = await prisma.mensajeChat.findMany({ where: { sesion_id: sesion.id }, orderBy: { fecha_hora: 'asc' }, take: 10 });
    const mensajesParaIA = [{ role: 'system', content: systemPrompt }, ...historialMensajes.map(m => ({ role: m.emisor === 'bot' ? 'assistant' : 'user', content: m.contenido_mensaje })), { role: 'user', content: mensajeUsuario }];

    const chatCompletion = await groq.chat.completions.create({ messages: mensajesParaIA, model: 'llama-3.3-70b-versatile', temperature: 0.6 });
    let respuestaFinal = chatCompletion.choices[0].message.content;

    if (respuestaFinal.includes("[NOMBRE:")) {
      const match = respuestaFinal.match(/\[NOMBRE: (.*?)\]/);
      const telefono = identificador.toString();
      await prisma.cliente.upsert({
        where: { telefono },
        update: { nombre: match[1] },
        create: { telefono, nombre: match[1] }
      });
      if (!sesion.cliente_id) {
        const cliente = await prisma.cliente.findUnique({ where: { telefono } });
        await prisma.sesionChat.update({ where: { id: sesion.id }, data: { cliente_id: cliente.id } });
        sesion.cliente_id = cliente.id;
      }
      respuestaFinal = respuestaFinal.replace(/\[NOMBRE: .*?\]/, "").trim();
    }

    // Lógica de Tipo (aqui/delivery)
    let tipoPedido = 'aqui';
    if (respuestaFinal.includes("[TIPO:")) {
      const match = respuestaFinal.match(/\[TIPO: (.*?)\]/);
      if (match && (match[1] === 'aqui' || match[1] === 'delivery')) tipoPedido = match[1];
      respuestaFinal = respuestaFinal.replace(/\[TIPO: .*?\]/, "").trim();
    }

    if (respuestaFinal.includes("[PEDIDO_FINALIZADO]")) {
      const datosPedido = await extraerPedidoDeHistorial(sesion.id);
      
      if (datosPedido.items.length > 0 && sesion.cliente_id) {
        let totalPedido = 0;
        await prisma.$transaction(async (tx) => {
          const nuevoPedido = await tx.pedido.create({ data: { cliente_id: sesion.cliente_id, estado: "pendiente", total: 0, tipo: tipoPedido } });
          for (const item of datosPedido.items) {
            const prod = await tx.producto.findFirst({ where: { nombre: { equals: item.nombre, mode: 'insensitive' } } });
            if (prod) {
              await tx.detallePedido.create({ data: { pedido_id: nuevoPedido.id, producto_id: prod.id, cantidad: item.cantidad, subtotal: prod.precio_base * item.cantidad } });
              totalPedido += prod.precio_base * item.cantidad;
            }
          }
          await tx.pedido.update({ where: { id: nuevoPedido.id }, data: { total: totalPedido } });
          await tx.pago.create({ data: { pedido_id: nuevoPedido.id, monto: totalPedido, metodo_pago: "efectivo" } });
        });
        respuestaFinal = respuestaFinal.replace("[PEDIDO_FINALIZADO]", `✅ ¡Pedido registrado! Total: $${totalPedido}. Tipo: ${tipoPedido === 'delivery' ? 'Delivery' : 'Consumir aquí'}. Pago: efectivo.`).trim();
      } else if (datosPedido.items.length > 0 && !sesion.cliente_id) {
        respuestaFinal = respuestaFinal.replace("[PEDIDO_FINALIZADO]", "Por favor dime tu nombre primero para registrar el pedido.").trim();
      } else {
        respuestaFinal = respuestaFinal.replace("[PEDIDO_FINALIZADO]", "").trim();
      }
    }

    await prisma.mensajeChat.createMany({ data: [{ sesion_id: sesion.id, emisor: 'usuario', contenido_mensaje: mensajeUsuario }, { sesion_id: sesion.id, emisor: 'bot', contenido_mensaje: respuestaFinal }] });

    return { respuesta: respuestaFinal };
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Fallo en el proceso.");
  }
};

module.exports = { responderPreguntaConHistorial };