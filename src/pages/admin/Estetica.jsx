import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../layouts/AdminLayout'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { COLORS, contrastText } from '../../lib/theme'

const FUENTES = ['Manrope', 'Karla', 'Inter', 'Raleway', 'Montserrat', 'Poppins', 'Lato', 'Nunito', 'DM Sans', 'Space Grotesk', 'Sora']
const FUENTES_TITULO = ['Bricolage Grotesque', 'Fraunces', 'Space Grotesk', 'Playfair Display', 'DM Sans', 'Inter', 'Montserrat']

const VARIABLES_DINAMICAS = [
  { label: 'Número de orden', value: '{order_number}' },
  { label: 'Fecha', value: '{fecha}' },
  { label: 'Cliente', value: '{customer_name}' },
  { label: 'Email', value: '{customer_email}' },
  { label: 'DNI/CUIT', value: '{customer_doc}' },
  { label: 'Medio de pago', value: '{payment_method}' },
  { label: 'Total', value: '{total}' },
  { label: 'Vendedor', value: '{employee}' },
]

const defaults = {
  store_name: 'Mi Tienda',
  primary_color: COLORS.clay,
  secondary_color: COLORS.cream,
  navbar_color: COLORS.espresso,
  price_color: COLORS.espresso,
  font_family: 'Manrope',
  heading_font_family: 'Bricolage Grotesque',
  hero_title: 'Todo lo que necesitás',
  hero_subtitle: 'Los mejores productos al mejor precio',
  hero_btn_text: 'Ver catálogo',
  hero_image_url: '',
  logo_url: '',
  card_radius: 4,
  product_columns: 3,
  address: '',
  phone: '',
  cuit: '',
  ticket_show_email: true,
  ticket_show_doc: true,
  ticket_show_employee: true,
  ticket_show_note: true,
  ticket_show_discount: true,
  ticket_footer: '¡Gracias por su compra!',
  ticket_header_color: COLORS.espresso,
  ticket_custom_fields: []
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-2.5 border-b border-stone-50">
      <span className="text-sm text-stone-600">{label}</span>
      <div onClick={() => onChange(!checked)} className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-stone-900' : 'bg-stone-200'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
      </div>
    </label>
  )
}

export default function Estetica() {
  const [settings, setSettings] = useState(defaults)
  const [settingsId, setSettingsId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [heroFile, setHeroFile] = useState(null)
  const [heroPreview, setHeroPreview] = useState(null)
  const [tab, setTab] = useState('tienda')
  const [error, setError] = useState('')
  const logoRef = useRef()
  const heroRef = useRef()

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data } = await supabase.from('store_settings').select('*').single()
    if (data) {
      setSettings({ ...defaults, ...data, ticket_custom_fields: data.ticket_custom_fields || [] })
      setSettingsId(data.id)
      setLogoPreview(data.logo_url || null)
      setHeroPreview(data.hero_image_url || null)
    }
    setLoading(false)
  }

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleHeroChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setHeroFile(file)
    setHeroPreview(URL.createObjectURL(file))
  }

  async function uploadFile(file, bucket, oldUrl) {
    if (!file) return { url: oldUrl, error: null }
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(fileName, file)
    if (error) return { url: oldUrl, error: error.message }
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return { url: data.publicUrl, error: null }
  }

  async function handleSave() {
    setError('')
    setSaving(true)
    const [logo, hero] = await Promise.all([
      uploadFile(logoFile, 'store-assets', settings.logo_url),
      uploadFile(heroFile, 'store-assets', settings.hero_image_url)
    ])
    if (logo.error || hero.error) {
      setError('No se pudo subir la imagen: ' + (logo.error || hero.error))
      setSaving(false)
      return
    }
    const payload = { ...settings, logo_url: logo.url, hero_image_url: hero.url }
    const { error: saveError } = settingsId
      ? await supabase.from('store_settings').update(payload).eq('id', settingsId)
      : await supabase.from('store_settings').insert(payload)
    setSaving(false)
    if (saveError) { setError(saveError.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    fetchSettings()
  }

  function addCustomField() {
    setSettings({
      ...settings,
      ticket_custom_fields: [...settings.ticket_custom_fields, { label: '', value: '', type: 'text' }]
    })
  }

  function updateCustomField(index, key, val) {
    const fields = [...settings.ticket_custom_fields]
    fields[index] = { ...fields[index], [key]: val }
    setSettings({ ...settings, ticket_custom_fields: fields })
  }

  function removeCustomField(index) {
    const fields = settings.ticket_custom_fields.filter((_, i) => i !== index)
    setSettings({ ...settings, ticket_custom_fields: fields })
  }

  function resolveField(field) {
    const ejemplos = {
      '{order_number}': '#000001',
      '{fecha}': '01/01/2026',
      '{customer_name}': 'Juan Pérez',
      '{customer_email}': 'juan@mail.com',
      '{customer_doc}': '12.345.678',
      '{payment_method}': 'Efectivo',
      '{total}': '$21.060',
      '{employee}': 'Jennifer R.',
    }
    return field.type === 'dynamic' ? (ejemplos[field.value] || field.value) : field.value
  }

  if (loading) return <AdminLayout><div className="p-8 text-sm text-stone-400">Cargando...</div></AdminLayout>

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-stone-900 tracking-tight" style={{ fontFamily: 'Bricolage Grotesque' }}>Estética</h1>
            <p className="text-sm text-stone-400 mt-0.5">Personalizá la apariencia de tu tienda</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-stone-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-stone-700 transition disabled:opacity-50 w-fit">
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

        <div className="flex gap-1 bg-stone-100 rounded-full p-1 w-fit mb-6">
          {['tienda', 'ticket'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-1.5 rounded-full text-xs font-medium transition ${tab === t ? 'bg-white text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>
              {t === 'tienda' ? 'Tienda' : 'Ticket PDF'}
            </button>
          ))}
        </div>

        {tab === 'tienda' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="flex flex-col gap-5">
              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-stone-900 mb-4">Identidad</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Nombre del negocio</label>
                    <input value={settings.store_name} onChange={e => setSettings({...settings, store_name: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Logo</label>
                    <div className="flex items-center gap-3">
                      <div onClick={() => logoRef.current.click()} className="w-14 h-14 border border-dashed border-stone-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-stone-400 transition overflow-hidden flex-shrink-0">
                        {logoPreview ? <img src={logoPreview} alt="logo" className="w-full h-full object-contain" /> : <span className="text-stone-300 text-xl">🏪</span>}
                      </div>
                      <div>
                        <button onClick={() => logoRef.current.click()} className="text-sm text-stone-600 border border-stone-200 rounded-full px-4 py-1.5 hover:bg-stone-50 transition">Subir logo</button>
                        {logoPreview && <button onClick={() => { setLogoFile(null); setLogoPreview(null); setSettings({...settings, logo_url: ''}) }} className="text-xs text-stone-400 hover:text-red-500 ml-3 transition">Quitar</button>}
                      </div>
                      <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-stone-900 mb-4">Colores</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'primary_color', label: 'Color primario' },
                    { key: 'secondary_color', label: 'Fondo' },
                    { key: 'navbar_color', label: 'Navbar' },
                    { key: 'price_color', label: 'Precios' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl border border-stone-200 overflow-hidden cursor-pointer" style={{ background: settings[key] }}>
                          <input type="color" value={settings[key]} onChange={e => setSettings({...settings, [key]: e.target.value})} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 mb-0.5">{label}</p>
                        <p className="text-xs font-mono text-stone-600">{settings[key]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-stone-900 mb-4">Tipografía y layout</h2>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Fuente de títulos</label>
                      <select value={settings.heading_font_family} onChange={e => setSettings({...settings, heading_font_family: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition bg-white">
                        {FUENTES_TITULO.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Fuente de texto</label>
                      <select value={settings.font_family} onChange={e => setSettings({...settings, font_family: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition bg-white">
                        {FUENTES.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-2 block">Redondez de tarjetas — {settings.card_radius}px</label>
                    <input type="range" min="0" max="32" step="2" value={settings.card_radius} onChange={e => setSettings({...settings, card_radius: Number(e.target.value)})} className="w-full accent-stone-900" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-2 block">Columnas de productos</label>
                    <div className="flex gap-2">
                      {[2, 3, 4].map(n => (
                        <button key={n} onClick={() => setSettings({...settings, product_columns: n})} className={`flex-1 py-2 rounded-2xl text-sm font-medium border transition ${settings.product_columns === n ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-stone-900 mb-4">Hero</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Imagen de portada</label>
                    <div onClick={() => heroRef.current.click()} className="w-full h-32 border border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-stone-400 transition overflow-hidden">
                      {heroPreview ? <img src={heroPreview} alt="hero" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-2 text-stone-300"><span className="text-3xl">🖼</span><span className="text-xs">Cargar imagen</span></div>}
                    </div>
                    <input ref={heroRef} type="file" accept="image/*" onChange={handleHeroChange} className="hidden" />
                    {heroPreview && <button onClick={() => { setHeroFile(null); setHeroPreview(null); setSettings({...settings, hero_image_url: ''}) }} className="text-xs text-stone-400 hover:text-red-500 mt-1.5 transition">Quitar imagen</button>}
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Título</label>
                    <input value={settings.hero_title} onChange={e => setSettings({...settings, hero_title: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Subtítulo</label>
                    <input value={settings.hero_subtitle} onChange={e => setSettings({...settings, hero_subtitle: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Texto del botón</label>
                    <input value={settings.hero_btn_text} onChange={e => setSettings({...settings, hero_btn_text: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-stone-900 mb-4">Contacto y datos fiscales</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Dirección</label>
                    <input value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition" placeholder="San Martín 123" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Teléfono</label>
                      <input value={settings.phone || ''} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition" placeholder="(297) 555-0001" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">CUIT</label>
                      <input value={settings.cuit || ''} onChange={e => setSettings({...settings, cuit: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition" placeholder="30-12345678-9" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vista previa tienda */}
            <div className="sticky top-8 h-fit">
              <p className="text-xs text-stone-400 uppercase tracking-widest mb-3">Vista previa</p>
              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2.5" style={{ background: settings.navbar_color }}>
                  <div className="flex items-center gap-2">
                    {logoPreview ? <img src={logoPreview} alt="logo" className="w-5 h-5 object-contain rounded" /> : <div className="w-5 h-5 rounded" style={{ background: `${contrastText(settings.navbar_color)}33` }}></div>}
                    <span className="text-xs font-medium" style={{ color: contrastText(settings.navbar_color), fontFamily: settings.heading_font_family }}>{settings.store_name}</span>
                  </div>
                  <span className="text-xs" style={{ color: contrastText(settings.navbar_color), opacity: 0.5 }}>🛍</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3" style={{ background: settings.secondary_color }}>
                  <div className="rounded overflow-hidden bg-stone-200" style={{ borderRadius: settings.card_radius }}>
                    {heroPreview
                      ? <img src={heroPreview} alt="hero" className="w-full h-full object-cover" style={{ aspectRatio: '1' }} />
                      : <div className="w-full" style={{ aspectRatio: '1', background: COLORS.claySoft }} />
                    }
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-xs font-medium mb-1 leading-tight" style={{ fontFamily: settings.heading_font_family, color: COLORS.espresso }}>{settings.hero_title}</p>
                    <p className="text-xs mb-2" style={{ color: settings.price_color, opacity: 0.6, fontSize: '9px' }}>{settings.hero_subtitle}</p>
                    <button className="text-xs px-2 py-1 w-fit" style={{ border: `1px solid ${settings.primary_color}`, color: settings.primary_color, borderRadius: Math.min(settings.card_radius, 6), fontSize: '9px' }}>{settings.hero_btn_text}</button>
                  </div>
                </div>
                <div className="p-3" style={{ background: settings.secondary_color }}>
                  <p className="text-xs font-medium mb-2" style={{ fontFamily: settings.heading_font_family, color: COLORS.espresso }}>Destacados</p>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(settings.product_columns, 3)}, 1fr)` }}>
                    {['A', 'B', 'C'].slice(0, settings.product_columns).map(p => (
                      <div key={p} className="bg-white overflow-hidden" style={{ borderRadius: settings.card_radius, border: '0.5px solid #ebebeb' }}>
                        <div className="h-10 bg-stone-100"></div>
                        <div className="p-2">
                          <p className="text-xs font-medium text-stone-900" style={{ fontFamily: settings.font_family }}>Producto {p}</p>
                          <p className="text-xs font-medium mt-1" style={{ color: settings.price_color }}>$9.999</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'ticket' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6">
            <div className="flex flex-col gap-5">

              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-stone-900 mb-4">Diseño</h2>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl border border-stone-200 overflow-hidden cursor-pointer" style={{ background: settings.ticket_header_color }}>
                        <input type="color" value={settings.ticket_header_color} onChange={e => setSettings({...settings, ticket_header_color: e.target.value})} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 mb-0.5">Color del encabezado</p>
                      <p className="text-xs font-mono text-stone-600">{settings.ticket_header_color}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Mensaje de pie</label>
                    <input value={settings.ticket_footer || ''} onChange={e => setSettings({...settings, ticket_footer: e.target.value})} className="w-full px-4 py-2.5 border border-stone-200 rounded-2xl text-sm outline-none focus:border-stone-400 transition" placeholder="¡Gracias por su compra!" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-stone-900 mb-2">Campos visibles</h2>
                <Toggle label="Email del cliente" checked={settings.ticket_show_email} onChange={v => setSettings({...settings, ticket_show_email: v})} />
                <Toggle label="DNI / CUIT" checked={settings.ticket_show_doc} onChange={v => setSettings({...settings, ticket_show_doc: v})} />
                <Toggle label="Nombre del vendedor" checked={settings.ticket_show_employee} onChange={v => setSettings({...settings, ticket_show_employee: v})} />
                <Toggle label="Descuento aplicado" checked={settings.ticket_show_discount} onChange={v => setSettings({...settings, ticket_show_discount: v})} />
                <Toggle label="Nota del pedido" checked={settings.ticket_show_note} onChange={v => setSettings({...settings, ticket_show_note: v})} />
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-stone-900">Campos adicionales</h2>
                  <button onClick={addCustomField} className="flex items-center gap-1.5 text-xs text-stone-600 border border-stone-200 rounded-full px-3 py-1.5 hover:bg-stone-50 transition">
                    <IconPlus size={12} /> Agregar campo
                  </button>
                </div>

                {settings.ticket_custom_fields.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-4">No hay campos adicionales. Hacé click en "Agregar campo" para empezar.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {settings.ticket_custom_fields.map((field, i) => (
                      <div key={i} className="border border-stone-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex gap-2">
                            <button onClick={() => updateCustomField(i, 'type', 'text')} className={`text-xs px-3 py-1 rounded-full font-medium border transition ${field.type === 'text' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500'}`}>Texto fijo</button>
                            <button onClick={() => updateCustomField(i, 'type', 'dynamic')} className={`text-xs px-3 py-1 rounded-full font-medium border transition ${field.type === 'dynamic' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500'}`}>Valor dinámico</button>
                          </div>
                          <button onClick={() => removeCustomField(i)} className="text-stone-300 hover:text-red-400 transition">
                            <IconTrash size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-stone-400 mb-1 block">Etiqueta</label>
                            <input value={field.label} onChange={e => updateCustomField(i, 'label', e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-400 transition" placeholder="Condición IVA" />
                          </div>
                          <div>
                            <label className="text-xs text-stone-400 mb-1 block">Valor</label>
                            {field.type === 'dynamic' ? (
                              <select value={field.value} onChange={e => updateCustomField(i, 'value', e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-400 transition bg-white">
                                <option value="">Seleccionar...</option>
                                {VARIABLES_DINAMICAS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                              </select>
                            ) : (
                              <input value={field.value} onChange={e => updateCustomField(i, 'value', e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm outline-none focus:border-stone-400 transition" placeholder="Resp. Inscripto" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Vista previa ticket */}
            <div className="sticky top-8 h-fit">
              <p className="text-xs text-stone-400 uppercase tracking-widest mb-3">Vista previa</p>
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white" style={{ fontFamily: 'monospace', width: '200px' }}>
                <div className="px-3 py-2 text-center text-white" style={{ background: settings.ticket_header_color }}>
                  {logoPreview && <img src={logoPreview} alt="logo" className="h-6 w-auto object-contain mx-auto mb-1" />}
                  <p className="font-bold text-xs">{settings.store_name}</p>
                  {settings.address && <p className="opacity-80 text-xs mt-0.5">{settings.address}</p>}
                  {settings.cuit && <p className="opacity-80 text-xs">CUIT: {settings.cuit}</p>}
                </div>
                <div className="p-3">
                  <div className="border-b border-dashed border-stone-200 pb-2 mb-2 flex flex-col gap-0.5">
                    <div className="flex justify-between text-xs"><span className="text-stone-400">Orden:</span><span>#000001</span></div>
                    <div className="flex justify-between text-xs"><span className="text-stone-400">Cliente:</span><span>Juan P.</span></div>
                    {settings.ticket_show_doc !== false && <div className="flex justify-between text-xs"><span className="text-stone-400">DNI:</span><span>12.345.678</span></div>}
                    {settings.ticket_show_employee !== false && <div className="flex justify-between text-xs"><span className="text-stone-400">Vendedor:</span><span>Jennifer R.</span></div>}
                    {settings.ticket_show_email !== false && <div className="flex justify-between text-xs"><span className="text-stone-400">Email:</span><span>j@mail.com</span></div>}
                    {settings.ticket_custom_fields.filter(f => f.label).map((f, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-stone-400">{f.label}:</span>
                        <span>{resolveField(f)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-b border-dashed border-stone-200 pb-2 mb-2">
                    <div className="flex justify-between text-xs mb-1"><span>Remera x1</span><span>$4.500</span></div>
                    <div className="flex justify-between text-xs"><span>Auriculares x1</span><span>$18.900</span></div>
                  </div>
                  {settings.ticket_show_discount !== false && <div className="flex justify-between text-xs mb-1 text-green-600"><span>Descuento:</span><span>-$2.340</span></div>}
                  <div className="flex justify-between font-bold text-xs mb-2"><span>TOTAL:</span><span>$21.060</span></div>
                  {settings.ticket_show_note !== false && <div className="text-xs text-stone-400 italic mb-2">Nota: En puerta</div>}
                  <div className="border-t border-stone-200 pt-2 text-center text-stone-400 text-xs">{settings.ticket_footer || '¡Gracias!'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}