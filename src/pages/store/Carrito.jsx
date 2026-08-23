import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconX, IconPlus, IconMinus, IconCheck, IconTag } from '@tabler/icons-react'
import { supabase } from '../../lib/supabase'
import { useStoreSettings } from '../../hooks/useStoreSettings'
import StoreLayout from './Layout'

const PAGOS = ['Efectivo', 'Tarjeta', 'Transferencia']

export default function Carrito({ cart, setCart }) {
  const { settings } = useStoreSettings()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', doc: '', payment: 'Efectivo', coupon: '', note: '' })
  const [couponData, setCouponData] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [checkingCoupon, setCheckingCoupon] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  function updateQty(id, qty) {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id))
    else setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  const subtotal = cart.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0)
  const descuento = couponData ? Math.round(subtotal * couponData.discount_percent / 100) : 0
  const total = subtotal - descuento

  async function checkCoupon() {
    if (!form.coupon.trim()) return
    setCheckingCoupon(true)
    setCouponError('')
    setCouponData(null)
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', form.coupon.toUpperCase().trim())
      .eq('active', true)
      .single()
    if (!data) { setCouponError('Cupón no válido'); setCheckingCoupon(false); return }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setCouponError('Cupón vencido'); setCheckingCoupon(false); return }
    if (data.max_uses && data.uses >= data.max_uses) { setCouponError('Cupón agotado'); setCheckingCoupon(false); return }
    setCouponData(data)
    setCheckingCoupon(false)
  }

  async function handleSubmit() {
    if (!form.name || cart.length === 0) return
    setSubmitting(true)
    setSubmitError('')

    // El total, el descuento y el número de orden se calculan del lado del
    // servidor (RPC checkout_order): acá solo mandamos qué se quiere comprar,
    // no cuánto cuesta ni cuánto vale el descuento.
    const { data, error } = await supabase.rpc('checkout_order', {
      p_customer_name: form.name,
      p_customer_email: form.email || null,
      p_customer_doc: form.doc || null,
      p_payment_method: form.payment,
      p_note: form.note || null,
      p_coupon_code: form.coupon || null,
      p_items: cart.map(i => ({ product_id: i.id, quantity: i.quantity }))
    })

    if (error) {
      setSubmitError(error.message || 'No pudimos procesar tu pedido. Probá de nuevo.')
      setSubmitting(false)
      return
    }

    const result = Array.isArray(data) ? data[0] : data
    setOrderNumber(result.order_number)
    setCart([])
    setSubmitting(false)
    setSuccess(true)
  }

  if (!settings) return null

  if (success) return (
    <StoreLayout cart={[]}>
      <div className="max-w-md mx-auto px-5 sm:px-6 py-20 sm:py-24 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: settings.primary_color }}>
          <IconCheck size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-medium text-stone-900 mb-2" style={{ fontFamily: settings.heading_font_family }}>¡Pedido recibido!</h1>
        <p className="text-stone-400 mb-2">Tu orden <strong>{orderNumber}</strong> fue registrada correctamente.</p>
        <p className="text-sm text-stone-400 mb-8">Nos pondremos en contacto pronto para coordinar la entrega.</p>
        <button onClick={() => navigate('/')} className="text-sm font-medium px-6 py-3 rounded-full text-white transition hover:opacity-90" style={{ background: settings.primary_color }}>
          Volver al inicio
        </button>
      </div>
    </StoreLayout>
  )

  return (
    <StoreLayout cart={cart}>
      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-8 sm:py-10">
        <h1 className="text-2xl font-medium text-stone-900 mb-6 sm:mb-8 tracking-tight" style={{ fontFamily: settings.heading_font_family }}>Tu carrito</h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 sm:py-24">
            <p className="text-stone-400 mb-6">Tu carrito está vacío</p>
            <button
              onClick={() => navigate('/catalogo')}
              className="text-xs font-medium uppercase tracking-widest px-6 py-3 transition hover:text-white"
              style={{ border: `1.5px solid ${settings.primary_color}`, color: settings.primary_color, borderRadius: Math.min(settings.card_radius, 6) }}
              onMouseEnter={e => { e.currentTarget.style.background = settings.primary_color }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Ver catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
            {/* Items */}
            <div className="flex flex-col gap-3">
              {cart.map(item => (
                <div key={item.id} className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-wrap sm:flex-nowrap gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl bg-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      : <IconTag size={24} className="text-stone-300" />
                    }
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-sm font-medium text-stone-900 truncate" style={{ fontFamily: settings.heading_font_family }}>{item.name}</p>
                    <p className="text-sm text-stone-400 mt-0.5">${Number(item.price).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="flex items-center gap-2 order-3 sm:order-none">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-7 h-7 border border-stone-200 rounded-lg flex items-center justify-center text-stone-500 hover:border-stone-400 transition">
                      <IconMinus size={12} />
                    </button>
                    <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-7 h-7 border border-stone-200 rounded-lg flex items-center justify-center text-stone-500 hover:border-stone-400 transition">
                      <IconPlus size={12} />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-stone-900 w-20 sm:w-24 text-right order-4 sm:order-none">${(Number(item.price) * item.quantity).toLocaleString('es-AR')}</p>
                  <button onClick={() => updateQty(item.id, 0)} className="text-stone-300 hover:text-red-400 transition order-5 sm:order-none" aria-label="Quitar del carrito">
                    <IconX size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Formulario + resumen */}
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-stone-200 rounded-2xl p-5">
                <h2 className="text-sm font-medium text-stone-900 mb-4">Tus datos</h2>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Nombre *</label>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition" placeholder="Juan Pérez" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition" placeholder="juan@email.com" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">DNI / CUIT</label>
                    <input value={form.doc} onChange={e => setForm({...form, doc: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition" placeholder="12.345.678" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-2 block">Medio de pago</label>
                    <div className="flex gap-2">
                      {PAGOS.map(p => (
                        <button
                          key={p}
                          onClick={() => setForm({...form, payment: p})}
                          className="flex-1 text-xs py-2 rounded-full font-medium border transition"
                          style={form.payment === p
                            ? { background: settings.primary_color, color: '#fff', borderColor: settings.primary_color }
                            : { borderColor: '#e7e5e4', color: '#78716c' }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Nota (opcional)</label>
                    <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition resize-none" placeholder="Aclaraciones sobre tu pedido..." />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-5">
                <h2 className="text-sm font-medium text-stone-900 mb-3">Cupón de descuento</h2>
                <div className="flex gap-2">
                  <input
                    value={form.coupon}
                    onChange={e => { setForm({...form, coupon: e.target.value.toUpperCase()}); setCouponData(null); setCouponError('') }}
                    className="flex-1 min-w-0 px-4 py-2.5 border border-stone-200 rounded-2xl text-sm font-mono outline-none focus:border-stone-400 transition"
                    placeholder="VERANO10"
                  />
                  <button onClick={checkCoupon} disabled={checkingCoupon} className="px-4 py-2.5 border border-stone-200 rounded-2xl text-sm text-stone-600 hover:border-stone-400 transition disabled:opacity-50 flex-shrink-0">
                    {checkingCoupon ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponData && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><IconCheck size={12} /> {couponData.discount_percent}% de descuento aplicado</p>}
                {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-5">
                <h2 className="text-sm font-medium text-stone-900 mb-4">Resumen</h2>
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-stone-400">Subtotal</span><span>${subtotal.toLocaleString('es-AR')}</span></div>
                  {descuento > 0 && <div className="flex justify-between text-sm"><span className="text-green-600">Descuento ({couponData.discount_percent}%)</span><span className="text-green-600">−${descuento.toLocaleString('es-AR')}</span></div>}
                  <div className="flex justify-between text-base font-medium border-t border-stone-100 pt-2 mt-1"><span>Total</span><span style={{ color: settings.price_color }}>${total.toLocaleString('es-AR')}</span></div>
                </div>
                <button onClick={handleSubmit} disabled={submitting || !form.name} className="w-full text-sm font-medium py-3 rounded-full text-white transition hover:opacity-90 disabled:opacity-50" style={{ background: settings.primary_color }}>
                  {submitting ? 'Procesando...' : 'Confirmar pedido →'}
                </button>
                {submitError && <p className="text-xs text-red-500 mt-2 text-center">{submitError}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  )
}
