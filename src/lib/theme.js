// Paleta y helpers de tipografía compartidos entre la tienda y el admin.
// Los valores acá son los defaults de fábrica; todo esto sigue siendo
// 100% editable por tienda desde Admin → Estética (store_settings).

export const COLORS = {
  cream: '#F6EEE1',
  card: '#FFFCF6',
  espresso: '#2B2119',
  espressoLight: '#3D3026',
  clay: '#B5652E',
  claySoft: '#F0DFC9',
  taupe: '#8A7864',
  line: '#E6D9C6',
}

export function googleFontsUrl(families) {
  const unique = [...new Set(families.filter(Boolean))]
  const params = unique
    .map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}

// Elige texto claro u oscuro según qué tan claro es el color de fondo
// (luminancia relativa), para que un navbar/header con un color custom
// mantenga contraste legible sin tener que declarar dos temas.
export function contrastText(hex) {
  if (!hex) return '#ffffff'
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return '#ffffff'
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? COLORS.espresso : '#ffffff'
}
