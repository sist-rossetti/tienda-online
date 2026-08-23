import jsPDF from 'jspdf'

async function cargarLogo(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const { width, height } = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = reject
      img.src = dataUrl
    })
    const format = /^data:image\/(png|jpe?g|webp)/i.exec(dataUrl)?.[1]?.toUpperCase().replace('JPG', 'JPEG') || 'PNG'
    return { dataUrl, width, height, format }
  } catch {
    return null
  }
}

export async function generarTicket(venta, settings) {
  const ancho = 80
  const margen = 6
  let y = 10

  const doc = new jsPDF({ unit: 'mm', format: [ancho, 297], orientation: 'portrait' })

  function linea(texto, fontSize = 8, bold = false, align = 'left') {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const x = align === 'center' ? ancho / 2 : align === 'right' ? ancho - margen : margen
    doc.text(String(texto), x, y, { align })
    y += fontSize * 0.45 + 2
  }

  function fila(label, valor) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(String(label), margen, y)
    doc.text(String(valor), ancho - margen, y, { align: 'right' })
    y += 5
  }

  function separador(dash = false) {
    doc.setDrawColor(200)
    doc.setLineDashPattern(dash ? [1, 1] : [], 0)
    doc.line(margen, y, ancho - margen, y)
    y += 4
  }

  function resolverCampo(field) {
    if (field.type !== 'dynamic') return field.value
    const map = {
      '{order_number}': venta.order_number,
      '{fecha}': new Date(venta.created_at).toLocaleString('es-AR'),
      '{customer_name}': venta.customer_name,
      '{customer_email}': venta.customer_email || '',
      '{customer_doc}': venta.customer_doc || '',
      '{payment_method}': venta.payment_method,
      '{total}': `$${Number(venta.total).toLocaleString('es-AR')}`,
      '{employee}': venta.employees?.name || '',
    }
    return map[field.value] || field.value
  }

  // Logo (si hay uno cargado en Estética)
  const logo = settings.logo_url ? await cargarLogo(settings.logo_url) : null

  // Encabezado con color
  const headerColor = settings.ticket_header_color || '#111111'
  const r = parseInt(headerColor.slice(1, 3), 16)
  const g = parseInt(headerColor.slice(3, 5), 16)
  const b = parseInt(headerColor.slice(5, 7), 16)
  const headerH = logo ? 36 : 26
  doc.setFillColor(r, g, b)
  doc.rect(0, 0, ancho, headerH, 'F')

  if (logo) {
    const maxW = 34, maxH = 14
    const escala = Math.min(maxW / logo.width, maxH / logo.height, 1)
    const w = logo.width * escala
    const h = logo.height * escala
    doc.addImage(logo.dataUrl, logo.format, (ancho - w) / 2, 4, w, h)
    y = 4 + h + 4
  }

  doc.setTextColor(255, 255, 255)
  linea(settings.store_name || 'Mi Tienda', 12, true, 'center')
  if (settings.address) linea(settings.address, 7, false, 'center')
  if (settings.phone) linea(settings.phone, 7, false, 'center')
  if (settings.cuit) linea(`CUIT: ${settings.cuit}`, 7, false, 'center')

  doc.setTextColor(0, 0, 0)
  y = Math.max(y, headerH + 4)
  separador()

  // Datos de la orden
  fila('Orden:', venta.order_number)
  fila('Fecha:', new Date(venta.created_at).toLocaleString('es-AR'))
  if (settings.ticket_show_employee !== false && venta.employees?.name) fila('Vendedor:', venta.employees.name)
  fila('Cliente:', venta.customer_name)
  if (settings.ticket_show_doc !== false && venta.customer_doc) fila('DNI/CUIT:', venta.customer_doc)
  if (settings.ticket_show_email !== false && venta.customer_email) fila('Email:', venta.customer_email)
  fila('Pago:', venta.payment_method)

  // Campos adicionales
  const camposExtra = settings.ticket_custom_fields || []
  camposExtra.forEach(field => {
    if (field.label) fila(`${field.label}:`, resolverCampo(field))
  })

  y += 2
  separador(true)

  // Cabecera de items
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('Producto', margen, y)
  doc.text('Cant.', 52, y, { align: 'center' })
  doc.text('Subtotal', ancho - margen, y, { align: 'right' })
  y += 5

  doc.setFont('helvetica', 'normal')
  venta.sale_items?.forEach(item => {
    const nombre = item.product_name.length > 24 ? item.product_name.slice(0, 24) + '…' : item.product_name
    doc.setFontSize(7)
    doc.text(nombre, margen, y)
    doc.text(`x${item.quantity}`, 52, y, { align: 'center' })
    doc.text(`$${Number(item.subtotal).toLocaleString('es-AR')}`, ancho - margen, y, { align: 'right' })
    y += 5
  })

  y += 2
  separador(true)

  // Totales
  if (settings.ticket_show_discount !== false && venta.discount > 0) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Subtotal:', margen, y)
    doc.text(`$${(Number(venta.total) + Number(venta.discount)).toLocaleString('es-AR')}`, ancho - margen, y, { align: 'right' })
    y += 5
    doc.text('Descuento:', margen, y)
    doc.text(`-$${Number(venta.discount).toLocaleString('es-AR')}`, ancho - margen, y, { align: 'right' })
    y += 5
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', margen, y)
  doc.text(`$${Number(venta.total).toLocaleString('es-AR')}`, ancho - margen, y, { align: 'right' })
  y += 8

  separador()

  // Nota
  if (settings.ticket_show_note !== false && venta.note) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    const lines = doc.splitTextToSize(`Nota: ${venta.note}`, ancho - margen * 2)
    lines.forEach(line => { doc.text(line, margen, y); y += 4 })
    y += 2
  }

  // Pie
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(settings.ticket_footer || '¡Gracias por su compra!', ancho / 2, y, { align: 'center' })
  y += 5
  doc.text(venta.order_number, ancho / 2, y, { align: 'center' })

  doc.save(`ticket-${venta.order_number}.pdf`)
}