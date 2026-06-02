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
        datosContexto += `Tu perfil: ${empleado.nombre} (${empleado.cargo})\n`;
        datosContexto += `Asistencia hoy: ${asisHoy ? (asisHoy.hora_salida ? 'Completa (entrada y salida)' : 'Solo entrada registrada') : 'No has marcado entrada aún'}\n`;
      }
      datosContexto += `Total pedidos pendientes/PREPARANDO: ${pedidosPendientes}\n`;

      const pedidosDetalle = await prisma.pedido.findMany({
        where: { estado: { in: ['pendiente', 'PREPARANDO', 'LISTO'] } },
        include: { cliente: true, detalles: { include: { producto: true } }, pagos: true },
        orderBy: { id: 'desc' },
        take: 20
      });
      if (pedidosDetalle.length > 0) {
        datosContexto += `\n **PEDIDOS DETALLADOS (pendientes/PREPARANDO/LISTO):**\n`;
        for (const p of pedidosDetalle) {
          const cliente = p.cliente?.nombre || 'Cliente ocasional';
          const items = p.detalles.map(d => `${d.cantidad}x ${d.producto.nombre} (S/.${d.subtotal})`).join(', ');
          datosContexto += `  • #${p.id} | ${cliente} | ${p.tipo} | S/.${p.total} | ${p.estado} | ${items}\n`;
        }
      }
    }

    if (rol === 'Cliente' || !rol) {
      if (sesion.cliente_id) {
        const cliente = await prisma.cliente.findUnique({ where: { id: sesion.cliente_id }, include: { pedidos: { take: 3, orderBy: { id: 'desc' } } } });
        if (cliente) {
          datosContexto += ` Cliente: ${cliente.nombre}\n`;
          datosContexto += `Tus últimos pedidos: ${cliente.pedidos.map(p => `#${p.id} (${p.estado} - S/.${p.total})`).join(', ') || 'Ninguno aún'}\n`;
        }
      }
    }

    const categorias = await prisma.categoria.findMany({ include: { productos: { where: { disponible: true } } } });
    const categoriasLista = categorias.map(c => c.nombre).join(', ');
    const menuPorCategoria = categorias.map(c =>
      `### ${c.nombre}:\n${c.productos.map(p => `- ${p.nombre}: S/.${p.precio_base}`).join('\n')}`
    ).join('\n\n');

    const systemPrompt = `Eres "GourmetBot", el asistente virtual exclusivo de la Pastelería Saludable. Responde SOLO preguntas sobre el sistema de la pastelería (productos, pedidos, promos, menú, roles, asistencia, etc.).

**⚠️ REGLA #1 — MONEDA: SIEMPRE usa "S/." (NUNCA uses "$")**
Todos los precios en la pastelería están en Soles Peruanos (S/.). Ejemplos correctos: "S/.8", "S/.13", "S/.21", "S/.50". NUNCA uses "$", "USD", "dólares", ni ningún otro símbolo de moneda. Siempre es "S/." antes del número.

**REGLAS ESTRICTAS:**
- Si te preguntan algo que NO esté relacionado con la pastelería (matemáticas, física, historia, cultura general, programación, etc.), responde: "Solo puedo ayudarte con información sobre nuestros productos, pedidos y servicios de la pastelería. ¿En qué más puedo ayudarte?"
- NO respondas preguntas de conocimiento general, NO des fórmulas, NO expliques conceptos ajenos a la pastelería.
- Mantén todas las respuestas enfocadas ÚNICAMENTE en el sistema de la pastelería.

## DATOS EN TIEMPO REAL
${datosContexto}

## SISTEMA DE LA PASTELERÍA

### Roles del sistema
- Administrador: acceso total (pedidos, productos, pagos, ganancias, inventario, asistencia, stock, chat).
- Empleado (Pastelero, Barista, Limpieza, etc.): marca asistencia, ve y actualiza pedidos, usa el chat.
- Cliente: ve productos, promos y puede pedir por chat.

### MENÚ - REGLAS DE NAVEGACIÓN:
Cuando un cliente pregunte por el menú o qué productos hay disponibles:
1. **PRIMERO muestra SOLO las categorías disponibles**: ${categoriasLista}. Pregunta al cliente qué categoría le gustaría ver.
2. **DESPUÉS**, cuando el cliente elija una categoría, muestra los productos de ESA categoría con sus precios.
3. **NUNCA muestres todos los productos del menú completo en un solo mensaje.** Siempre navega por categorías.

### PRODUCTOS POR CATEGORÍA (solo referencia interna):
${menuPorCategoria}

**REGLAS ESTRICTAS SOBRE EL MENÚ:**
1. Todos los productos listados arriba están disponibles. NUNCA digas que no hay stock de un producto listado.
2. Si un cliente pregunta por un producto que SÍ está en el menú, confirma que está disponible.
3. Si un cliente pregunta por algo que NO está en el menú, dile amablemente que no lo tenemos y sugiérele productos del menú.
4. NO menciones stock ni cantidades. Solo precios.
5. Cuando el cliente pida un producto específico, pregúntale si desea algo más o si desea finalizar el pedido.
6. **SIEMPRE usa S/. (Sol Peruano) para precios. NUNCA uses $.**

### Pedidos
- Estados: Pendiente → Preparando → Listo → Entregado (también: Cancelado).
- Tipos: "aqui" (consumir en local) o "delivery" (para llevar).
- Al crear un pedido, se genera automáticamente un pago.
- Los empleados pueden cambiar el estado de los pedidos (Preparando, Listo, Entregado).
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
    respuestaFinal = respuestaFinal.replace(/\$(\d+(\.\d+)?)/g, 'S/.$1');

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
        respuestaFinal = respuestaFinal.replace("[PEDIDO_FINALIZADO]", ` ¡Pedido registrado! Total: S/.${totalPedido}. Tipo: ${tipoPedido === 'delivery' ? 'Delivery' : 'Consumir aquí'}. Pago: efectivo.`).trim();
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