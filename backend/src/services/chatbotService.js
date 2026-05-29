const { Groq } = require('groq-sdk');
const prisma = require('../config/db');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Función interna para extraer productos de forma estructurada
async function extraerPedidoDeHistorial(sesionId) {
  const historial = await prisma.mensajeChat.findMany({
    where: { sesion_id: sesionId },
    orderBy: { fecha_hora: 'asc' }
  });

  const textoHistorial = historial.map(m => `${m.emisor}: ${m.contenido_mensaje}`).join('\n');

  const promptExtraccion = `
    Analiza el siguiente historial de chat y extrae los productos solicitados. 
    Responde ÚNICAMENTE en formato JSON: {"items": [{"nombre": "NombreProducto", "cantidad": 1}]}.
    Si no hay productos, devuelve {"items": []}.
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

const responderPreguntaConHistorial = async (identificador, mensajeUsuario) => {
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

    const categorias = await prisma.categoria.findMany({ include: { productos: { where: { disponible: true } } } });
    const menuTexto = categorias.map(c => `### ${c.nombre}:\n${c.productos.map(p => `- ${p.nombre}: $${p.precio_base}`).join('\n')}`).join('\n\n');

    const systemPrompt = `Eres "GourmetBot". Menú:\n${menuTexto}\nReglas: Si el usuario finaliza su pedido, responde con [PEDIDO_FINALIZADO]. Usa [NOMBRE: X] para capturar nombres.`;

    const historialMensajes = await prisma.mensajeChat.findMany({ where: { sesion_id: sesion.id }, orderBy: { fecha_hora: 'asc' }, take: 10 });
    const mensajesParaIA = [{ role: 'system', content: systemPrompt }, ...historialMensajes.map(m => ({ role: m.emisor === 'bot' ? 'assistant' : 'user', content: m.contenido_mensaje })), { role: 'user', content: mensajeUsuario }];

    const chatCompletion = await groq.chat.completions.create({ messages: mensajesParaIA, model: 'llama-3.3-70b-versatile', temperature: 0.6 });
    let respuestaFinal = chatCompletion.choices[0].message.content;

    // Lógica de Nombre
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

    // Lógica de Pedido Finalizado y Persistencia
    if (respuestaFinal.includes("[PEDIDO_FINALIZADO]")) {
      const datosPedido = await extraerPedidoDeHistorial(sesion.id);
      
      if (datosPedido.items.length > 0 && sesion.cliente_id) {
        await prisma.$transaction(async (tx) => {
          let totalPedido = 0;
          const nuevoPedido = await tx.pedido.create({ data: { cliente_id: sesion.cliente_id, estado: "pendiente", total: 0 } });
          
          for (const item of datosPedido.items) {
            const prod = await tx.producto.findFirst({ where: { nombre: { contains: item.nombre, mode: 'insensitive' } } });
            if (prod) {
              await tx.detallePedido.create({ data: { pedido_id: nuevoPedido.id, producto_id: prod.id, cantidad: item.cantidad, subtotal: prod.precio_base * item.cantidad } });
              totalPedido += (prod.precio_base * item.cantidad);
            }
          }
          await tx.pedido.update({ where: { id: nuevoPedido.id }, data: { total: totalPedido } });
        });
        respuestaFinal = respuestaFinal.replace("[PEDIDO_FINALIZADO]", "✅ ¡Pedido registrado correctamente!").trim();
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