import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../layouts/AdminLayout'

const FUENTES = ['Inter', 'Playfair Display', 'Raleway', 'Montserrat', 'Poppins', 'Lato', 'Nunito', 'DM Sans', 'Space Grotesk', 'Sora']

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
  cuit: ''
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
  const logoRef = useRef()
  const heroRef = useRef()

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data } = await supabase.from('store_settings').select('*').single()
    if (data) {
      setSettings({ ...defaults, ...data })
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

        <div className="grid grid-cols-[1fr_320px] gap-6">
          {/* Formulario */}
          <div className="flex flex-col gap-5">

            {/* Identidad */}
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

            {/* Colores */}
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

            {/* Tipografía y layout */}
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

            {/* Hero */}
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

            {/* Contacto */}
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

          {/* Vista previa */}
          <div className="sticky top-8 h-fit">
            <p className="text-xs text-neutral-400 uppercase tracking-widest mb-3">Vista previa</p>
            <div className="border border-neutral-200 rounded-2xl overflow-hidden">
              {/* Navbar */}
              <div className="flex items-center justify-between px-3 py-2.5" style={{ background: settings.navbar_color }}>
                <div className="flex items-center gap-2">
                  {logoPreview
                    ? <img src={logoPreview} alt="logo" className="w-5 h-5 object-contain rounded" />
                    : <div className="w-5 h-5 rounded bg-white/20"></div>
                  }
                  <span className="text-xs font-medium text-white">{settings.store_name}</span>
                </div>
                <span className="text-white/50 text-xs">🛍</span>
              </div>
              {/* Hero */}
              <div className="relative min-h-[90px] flex items-center px-4 py-5" style={{ background: heroPreview ? 'transparent' : '#222' }}>
                {heroPreview && <img src={heroPreview} alt="hero" className="absolute inset-0 w-full h-full object-cover" />}
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }}></div>
                <div className="relative z-10">
                  <p className="text-white font-medium text-sm mb-1" style={{ fontFamily: settings.font_family }}>{settings.hero_title}</p>
                  <p className="text-white/60 text-xs mb-3">{settings.hero_subtitle}</p>
                  <button className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: settings.primary_color, color: '#fff' }}>{settings.hero_btn_text} →</button>
                </div>
              </div>
              {/* Productos */}
              <div className="p-3" style={{ background: settings.secondary_color }}>
                <p className="text-xs font-medium mb-2" style={{ fontFamily: settings.font_family, color: '#111' }}>Destacados</p>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(settings.product_columns, 3)}, 1fr)` }}>
                  {['Producto A', 'Producto B', 'Producto C'].slice(0, settings.product_columns).map(p => (
                    <div key={p} className="bg-white overflow-hidden" style={{ borderRadius: settings.card_radius, border: '0.5px solid #ebebeb' }}>
                      <div className="h-12 bg-neutral-100 flex items-center justify-center text-neutral-300 text-lg">📦</div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-neutral-900" style={{ fontFamily: settings.font_family }}>{p}</p>
                        <p className="text-xs font-medium mt-1" style={{ color: settings.price_color }}>$9.999</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}