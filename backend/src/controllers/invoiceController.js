const PDFDocument = require('pdfkit');
const prisma = require('../config/db');

const generarFactura = async (req, res) => {
  const { id } = req.params;
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        detalles: { include: { producto: true } },
        pagos: true
      }
    });

    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=factura_${pedido.id}.pdf`);
    doc.pipe(res);

    // Colores
    const emerald = '#059669';
    const stone = '#444';

    // Header
    doc.font('Helvetica-Bold').fontSize(22).fillColor(emerald).text('NuConexion', { align: 'center' });
    doc.fontSize(9).fillColor(stone).text('Pastelería Saludable & Pet-Friendly', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(8).fillColor('#999').text('Av. Las Americas 128 - Hunter, Arequipa', { align: 'center' });
    doc.text('contacto@nuconexion.pe | +51 999 999 999', { align: 'center' });

    // Línea divisoria
    doc.moveDown(0.5);
    doc.strokeColor(emerald).lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Título factura
    doc.font('Helvetica-Bold').fontSize(16).fillColor(stone).text('FACTURA', { align: 'center' });
    doc.moveDown(0.3);

    // Datos del pedido
    doc.font('Helvetica').fontSize(10).fillColor(stone);
    const fecha = pedido.fecha_creacion ? new Date(pedido.fecha_creacion).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    doc.text(`N° Pedido: ${pedido.id}`);
    doc.text(`Fecha: ${fecha}`);
    doc.text(`Cliente: ${pedido.cliente?.nombre || '—'}`);
    doc.text(`Teléfono: ${pedido.cliente?.telefono || '—'}`);
    doc.text(`Tipo: ${pedido.tipo === 'delivery' ? 'Delivery' : 'Consumir aquí'}`);
    doc.moveDown(0.5);

    // Tabla de productos
    const tableTop = doc.y;
    const colX = [40, 200, 350, 430, 500];

    // Encabezados de tabla
    doc.font('Helvetica-Bold').fontSize(9).fillColor('white');
    const headerY = doc.y;
    doc.roundedRect(40, headerY, 515, 18, 3).fill(emerald);
    doc.fillColor('white');
    doc.text('Producto', colX[0] + 5, headerY + 4);
    doc.text('Cant.', colX[1], headerY + 4, { width: 80, align: 'center' });
    doc.text('Precio', colX[2], headerY + 4, { width: 70, align: 'center' });
    doc.text('Subtotal', colX[3], headerY + 4, { width: 70, align: 'center' });
    doc.moveDown(2);

    // Filas
    doc.font('Helvetica').fontSize(9).fillColor(stone);
    let y = doc.y;
    for (const d of pedido.detalles) {
      doc.text(d.producto.nombre, colX[0] + 5, y, { width: 150 });
      doc.text(d.cantidad.toString(), colX[1], y, { width: 80, align: 'center' });
      doc.text(`S/.${d.producto.precio_base.toFixed(2)}`, colX[2], y, { width: 70, align: 'center' });
      doc.text(`S/.${d.subtotal.toFixed(2)}`, colX[3], y, { width: 70, align: 'center' });
      y += 18;
    }

    // Línea antes del total
    doc.moveTo(350, y).lineTo(555, y).strokeColor('#ccc').stroke();
    y += 8;

    // Total
    doc.font('Helvetica-Bold').fontSize(12).fillColor(emerald);
    doc.text(`Total: S/.${pedido.total.toFixed(2)}`, 350, y, { width: 200, align: 'right' });
    y += 20;

    // Método de pago
    doc.font('Helvetica').fontSize(10).fillColor(stone);
    const pago = pedido.pagos[0];
    if (pago) {
      const metodoLabel = { efectivo: 'Efectivo', yape: 'Yape', transferencia: 'Transferencia' }[pago.metodo_pago] || pago.metodo_pago;
      doc.text(`Método de pago: ${metodoLabel}`, 40, y);
      y += 16;
    }
    doc.text(`Estado: ${pedido.estado}`, 40, y);

    // Footer
    const bottom = doc.page.height - 60;
    doc.strokeColor(emerald).lineWidth(1).moveTo(40, bottom).lineTo(550, bottom).stroke();
    doc.fontSize(8).fillColor('#aaa').text('Gracias por tu preferencia — NuConexion', 40, bottom + 8, { align: 'center', width: 510 });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { generarFactura };
