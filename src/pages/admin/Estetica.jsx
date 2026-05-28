import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../layouts/AdminLayout'
import { IconPlus, IconTrash, IconGripVertical } from '@tabler/icons-react'

const FUENTES = ['Inter', 'Playfair Display', 'Raleway', 'Montserrat', 'Poppins', 'Lato', 'Nunito', 'DM Sans', 'Space Grotesk', 'Sora']

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
  primary_color: '#111111',
  secondary_color: '#f7f7f7',
  navbar_color: '#111111',
  price_color: '#111111',
  font_family: 'Inter',
  hero_title: 'Todo lo que necesitás',
  hero_subtitle: 'Los mejores productos al mejor precio',
  hero_btn_text: 'Ver catálogo',
  hero_image_url: '',
  logo_url: '',
  card_radius: 16,
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
  ticket_header_color: '#111111',
  ticket_custom_fields: []
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
    if (!file) return oldUrl
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    await supabase.storage.from(bucket).upload(fileName, file)
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleSave() {
    setSaving(true)
    const logoUrl = await uploadFile(logoFile, 'store-assets', settings.logo_url)
    const heroUrl = await uploadFile(heroFile, 'store-assets', settings.hero_image_url)
    const payload = { ...settings, logo_url: logoUrl, hero_image_url: heroUrl }
    if (settingsId) {
      await supabase.from('store_settings').update(payload).eq('id', settingsId)
    } else {
      await supabase.from('store_settings').insert(payload)
    }
    setSaving(false)
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

  function Toggle({ label, keyName }) {
    return (
      <label className="flex items-center justify-between cursor-pointer py-2.5 border-b border-neutral-50">
        <span className="text-sm text-neutral-600">{label}</span>
        <div onClick={() => setSettings({...settings, [keyName]: !settings[keyName]})} className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${settings[keyName] ? 'bg-neutral-900' : 'bg-neutral-200'}`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[keyName] ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
        </div>
      </label>
    )
  }

  if (loading) return <AdminLayout><div className="p-8 text-sm text-neutral-400">Cargando...</div></AdminLayout>

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-neutral-900 tracking-tight">Estética</h1>
            <p className="text-sm text-neutral-400 mt-0.5">Personalizá la apariencia de tu tienda</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-neutral-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-700 transition disabled:opacity-50">
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>

        <div className="flex gap-1 bg-neutral-100 rounded-full p-1 w-fit mb-6">
          {['tienda', 'ticket'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-1.5 rounded-full text-xs font-medium transition ${tab === t ? 'bg-white text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}>
              {t === 'tienda' ? 'Tienda' : 'Ticket PDF'}
            </button>
          ))}
        </div>

        {tab === 'tienda' && (
          <div className="grid grid-cols-[1fr_320px] gap-6">
            <div className="flex flex-col gap-5">
              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-neutral-900 mb-4">Identidad</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Nombre del negocio</label>
                    <input value={settings.store_name} onChange={e => setSettings({...settings, store_name: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition" />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Logo</label>
                    <div className="flex items-center gap-3">
                      <div onClick={() => logoRef.current.click()} className="w-14 h-14 border border-dashed border-neutral-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-neutral-400 transition overflow-hidden flex-shrink-0">
                        {logoPreview ? <img src={logoPreview} alt="logo" className="w-full h-full object-contain" /> : <span className="text-neutral-300 text-xl">🏪</span>}
                      </div>
                      <div>
                        <button onClick={() => logoRef.current.click()} className="text-sm text-neutral-600 border border-neutral-200 rounded-full px-4 py-1.5 hover:bg-neutral-50 transition">Subir logo</button>
                        {logoPreview && <button onClick={() => { setLogoFile(null); setLogoPreview(null); setSettings({...settings, logo_url: ''}) }} className="text-xs text-neutral-400 hover:text-red-500 ml-3 transition">Quitar</button>}
                      </div>
                      <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-neutral-900 mb-4">Colores</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'primary_color', label: 'Color primario' },
                    { key: 'secondary_color', label: 'Fondo' },
                    { key: 'navbar_color', label: 'Navbar' },
                    { key: 'price_color', label: 'Precios' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl border border-neutral-200 overflow-hidden cursor-pointer" style={{ background: settings[key] }}>
                          <input type="color" value={settings[key]} onChange={e => setSettings({...settings, [key]: e.target.value})} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-400 mb-0.5">{label}</p>
                        <p className="text-xs font-mono text-neutral-600">{settings[key]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-neutral-900 mb-4">Tipografía y layout</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Fuente</label>
                    <select value={settings.font_family} onChange={e => setSettings({...settings, font_family: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition bg-white">
                      {FUENTES.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-widest mb-2 block">Redondez de tarjetas — {settings.card_radius}px</label>
                    <input type="range" min="0" max="32" step="2" value={settings.card_radius} onChange={e => setSettings({...settings, card_radius: Number(e.target.value)})} className="w-full accent-neutral-900" />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-widest mb-2 block">Columnas de productos</label>
                    <div className="flex gap-2">
                      {[2, 3, 4].map(n => (
                        <button key={n} onClick={() => setSettings({...settings, product_columns: n})} className={`flex-1 py-2 rounded-2xl text-sm font-medium border transition ${settings.product_columns === n ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-neutral-900 mb-4">Hero</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Imagen de portada</label>
                    <div onClick={() => heroRef.current.click()} className="w-full h-32 border border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-neutral-400 transition overflow-hidden">
                      {heroPreview ? <img src={heroPreview} alt="hero" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-2 text-neutral-300"><span className="text-3xl">🖼</span><span className="text-xs">Cargar imagen</span></div>}
                    </div>
                    <input ref={heroRef} type="file" accept="image/*" onChange={handleHeroChange} className="hidden" />
                    {heroPreview && <button onClick={() => { setHeroFile(null); setHeroPreview(null); setSettings({...settings, hero_image_url: ''}) }} className="text-xs text-neutral-400 hover:text-red-500 mt-1.5 transition">Quitar imagen</button>}
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Título</label>
                    <input value={settings.hero_title} onChange={e => setSettings({...settings, hero_title: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition" />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Subtítulo</label>
                    <input value={settings.hero_subtitle} onChange={e => setSettings({...settings, hero_subtitle: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition" />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Texto del botón</label>
                    <input value={settings.hero_btn_text} onChange={e => setSettings({...settings, hero_btn_text: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-neutral-900 mb-4">Contacto y datos fiscales</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Dirección</label>
                    <input value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition" placeholder="San Martín 123" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Teléfono</label>
                      <input value={settings.phone || ''} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition" placeholder="(297) 555-0001" />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">CUIT</label>
                      <input value={settings.cuit || ''} onChange={e => setSettings({...settings, cuit: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition" placeholder="30-12345678-9" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vista previa tienda */}
            <div className="sticky top-8 h-fit">
              <p className="text-xs text-neutral-400 uppercase tracking-widest mb-3">Vista previa</p>
              <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2.5" style={{ background: settings.navbar_color }}>
                  <div className="flex items-center gap-2">
                    {logoPreview ? <img src={logoPreview} alt="logo" className="w-5 h-5 object-contain rounded" /> : <div className="w-5 h-5 rounded bg-white/20"></div>}
                    <span className="text-xs font-medium text-white">{settings.store_name}</span>
                  </div>
                  <span className="text-white/50 text-xs">🛍</span>
                </div>
                <div className="relative min-h-[90px] flex items-center px-4 py-5" style={{ background: heroPreview ? 'transparent' : '#222' }}>
                  {heroPreview && <img src={heroPreview} alt="hero" className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }}></div>
                  <div className="relative z-10">
                    <p className="text-white font-medium text-sm mb-1" style={{ fontFamily: settings.font_family }}>{settings.hero_title}</p>
                    <p className="text-white/60 text-xs mb-3">{settings.hero_subtitle}</p>
                    <button className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: settings.primary_color, color: '#fff' }}>{settings.hero_btn_text} →</button>
                  </div>
                </div>
                <div className="p-3" style={{ background: settings.secondary_color }}>
                  <p className="text-xs font-medium mb-2" style={{ fontFamily: settings.font_family, color: '#111' }}>Destacados</p>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(settings.product_columns, 3)}, 1fr)` }}>
                    {['A', 'B', 'C'].slice(0, settings.product_columns).map(p => (
                      <div key={p} className="bg-white overflow-hidden" style={{ borderRadius: settings.card_radius, border: '0.5px solid #ebebeb' }}>
                        <div className="h-10 bg-neutral-100"></div>
                        <div className="p-2">
                          <p className="text-xs font-medium text-neutral-900" style={{ fontFamily: settings.font_family }}>Producto {p}</p>
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
          <div className="grid grid-cols-[1fr_200px] gap-6">
            <div className="flex flex-col gap-5">

              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-neutral-900 mb-4">Diseño</h2>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl border border-neutral-200 overflow-hidden cursor-pointer" style={{ background: settings.ticket_header_color }}>
                        <input type="color" value={settings.ticket_header_color} onChange={e => setSettings({...settings, ticket_header_color: e.target.value})} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400 mb-0.5">Color del encabezado</p>
                      <p className="text-xs font-mono text-neutral-600">{settings.ticket_header_color}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-widest mb-1.5 block">Mensaje de pie</label>
                    <input value={settings.ticket_footer || ''} onChange={e => setSettings({...settings, ticket_footer: e.target.value})} className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-neutral-400 transition" placeholder="¡Gracias por su compra!" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-neutral-900 mb-2">Campos visibles</h2>
                <Toggle label="Email del cliente" keyName="ticket_show_email" />
                <Toggle label="DNI / CUIT" keyName="ticket_show_doc" />
                <Toggle label="Nombre del vendedor" keyName="ticket_show_employee" />
                <Toggle label="Descuento aplicado" keyName="ticket_show_discount" />
                <Toggle label="Nota del pedido" keyName="ticket_show_note" />
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-neutral-900">Campos adicionales</h2>
                  <button onClick={addCustomField} className="flex items-center gap-1.5 text-xs text-neutral-600 border border-neutral-200 rounded-full px-3 py-1.5 hover:bg-neutral-50 transition">
                    <IconPlus size={12} /> Agregar campo
                  </button>
                </div>

                {settings.ticket_custom_fields.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-4">No hay campos adicionales. Hacé click en "Agregar campo" para empezar.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {settings.ticket_custom_fields.map((field, i) => (
                      <div key={i} className="border border-neutral-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex gap-2">
                            <button onClick={() => updateCustomField(i, 'type', 'text')} className={`text-xs px-3 py-1 rounded-full font-medium border transition ${field.type === 'text' ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-500'}`}>Texto fijo</button>
                            <button onClick={() => updateCustomField(i, 'type', 'dynamic')} className={`text-xs px-3 py-1 rounded-full font-medium border transition ${field.type === 'dynamic' ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-500'}`}>Valor dinámico</button>
                          </div>
                          <button onClick={() => removeCustomField(i)} className="text-neutral-300 hover:text-red-400 transition">
                            <IconTrash size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-neutral-400 mb-1 block">Etiqueta</label>
                            <input value={field.label} onChange={e => updateCustomField(i, 'label', e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm outline-none focus:border-neutral-400 transition" placeholder="Condición IVA" />
                          </div>
                          <div>
                            <label className="text-xs text-neutral-400 mb-1 block">Valor</label>
                            {field.type === 'dynamic' ? (
                              <select value={field.value} onChange={e => updateCustomField(i, 'value', e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm outline-none focus:border-neutral-400 transition bg-white">
                                <option value="">Seleccionar...</option>
                                {VARIABLES_DINAMICAS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                              </select>
                            ) : (
                              <input value={field.value} onChange={e => updateCustomField(i, 'value', e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm outline-none focus:border-neutral-400 transition" placeholder="Resp. Inscripto" />
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
              <p className="text-xs text-neutral-400 uppercase tracking-widest mb-3">Vista previa</p>
              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white" style={{ fontFamily: 'monospace', width: '200px' }}>
                <div className="px-3 py-2 text-center text-white" style={{ background: settings.ticket_header_color }}>
                  <p className="font-bold text-xs">{settings.store_name}</p>
                  {settings.address && <p className="opacity-80 text-xs mt-0.5">{settings.address}</p>}
                  {settings.cuit && <p className="opacity-80 text-xs">CUIT: {settings.cuit}</p>}
                </div>
                <div className="p-3">
                  <div className="border-b border-dashed border-neutral-200 pb-2 mb-2 flex flex-col gap-0.5">
                    <div className="flex justify-between text-xs"><span className="text-neutral-400">Orden:</span><span>#000001</span></div>
                    <div className="flex justify-between text-xs"><span className="text-neutral-400">Cliente:</span><span>Juan P.</span></div>
                    {settings.ticket_show_doc !== false && <div className="flex justify-between text-xs"><span className="text-neutral-400">DNI:</span><span>12.345.678</span></div>}
                    {settings.ticket_show_employee !== false && <div className="flex justify-between text-xs"><span className="text-neutral-400">Vendedor:</span><span>Jennifer R.</span></div>}
                    {settings.ticket_show_email !== false && <div className="flex justify-between text-xs"><span className="text-neutral-400">Email:</span><span>j@mail.com</span></div>}
                    {settings.ticket_custom_fields.filter(f => f.label).map((f, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-neutral-400">{f.label}:</span>
                        <span>{resolveField(f)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-b border-dashed border-neutral-200 pb-2 mb-2">
                    <div className="flex justify-between text-xs mb-1"><span>Remera x1</span><span>$4.500</span></div>
                    <div className="flex justify-between text-xs"><span>Auriculares x1</span><span>$18.900</span></div>
                  </div>
                  {settings.ticket_show_discount !== false && <div className="flex justify-between text-xs mb-1 text-green-600"><span>Descuento:</span><span>-$2.340</span></div>}
                  <div className="flex justify-between font-bold text-xs mb-2"><span>TOTAL:</span><span>$21.060</span></div>
                  {settings.ticket_show_note !== false && <div className="text-xs text-neutral-400 italic mb-2">Nota: En puerta</div>}
                  <div className="border-t border-neutral-200 pt-2 text-center text-neutral-400 text-xs">{settings.ticket_footer || '¡Gracias!'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}