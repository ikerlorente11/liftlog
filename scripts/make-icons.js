// Genera los iconos de la app (icon, adaptive-icon, splash, favicon) a partir de
// un SVG: fondo oscuro con brillo azul y mancuerna con barra/discos.
// Uso: node scripts/make-icons.js  (requiere `sharp`; se resuelve desde SHARP_DIR o node_modules)
const path = require('path')
const fs = require('fs')
const sharpDir = process.env.SHARP_DIR
const sharp = require(sharpDir ? path.join(sharpDir, 'node_modules', 'sharp') : 'sharp')

const BLUE = '#3d8bff', BLUE_DARK = '#1f5fd6', BG1 = '#17181d', BG2 = '#0e0f12'

// Mancuerna centrada en un lienzo 1024×1024 (unidades del viewBox)
function dumbbell(scale = 1, cx = 512, cy = 512) {
  const s = scale
  const w = 700 * s, barH = 46 * s
  const plateW = 74 * s, plateH = 300 * s, plate2W = 50 * s, plate2H = 220 * s
  const r = 20 * s
  const x0 = cx - w / 2
  return `
  <defs>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfd6e4"/>
    </linearGradient>
    <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BLUE}"/><stop offset="1" stop-color="${BLUE_DARK}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="${14 * s}" stdDeviation="${16 * s}" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- barra -->
    <rect x="${x0}" y="${cy - barH / 2}" width="${w}" height="${barH}" rx="${barH / 2}" fill="url(#bar)"/>
    <!-- discos exteriores -->
    <rect x="${x0 + 60 * s}" y="${cy - plateH / 2}" width="${plateW}" height="${plateH}" rx="${r}" fill="url(#plate)"/>
    <rect x="${x0 + w - 60 * s - plateW}" y="${cy - plateH / 2}" width="${plateW}" height="${plateH}" rx="${r}" fill="url(#plate)"/>
    <!-- discos interiores -->
    <rect x="${x0 + 60 * s + plateW + 14 * s}" y="${cy - plate2H / 2}" width="${plate2W}" height="${plate2H}" rx="${r * 0.8}" fill="url(#plate)"/>
    <rect x="${x0 + w - 60 * s - plateW - 14 * s - plate2W}" y="${cy - plate2H / 2}" width="${plate2W}" height="${plate2H}" rx="${r * 0.8}" fill="url(#plate)"/>
    <!-- brillo en discos -->
    <rect x="${x0 + 60 * s + 12 * s}" y="${cy - plateH / 2 + 18 * s}" width="${14 * s}" height="${plateH - 36 * s}" rx="${7 * s}" fill="#ffffff" opacity="0.28"/>
    <rect x="${x0 + w - 60 * s - plateW + 12 * s}" y="${cy - plateH / 2 + 18 * s}" width="${14 * s}" height="${plateH - 36 * s}" rx="${7 * s}" fill="#ffffff" opacity="0.28"/>
  </g>`
}

function background(rounded) {
  return `
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stop-color="${BLUE}" stop-opacity="0.35"/>
      <stop offset="0.55" stop-color="${BLUE}" stop-opacity="0.08"/>
      <stop offset="1" stop-color="${BLUE}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BG1}"/><stop offset="1" stop-color="${BG2}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="${rounded ? 220 : 0}" fill="url(#bg)"/>
  <rect width="1024" height="1024" rx="${rounded ? 220 : 0}" fill="url(#glow)"/>`
}

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${inner}</svg>`

async function main() {
  const out = path.join(__dirname, '..', 'assets')
  fs.mkdirSync(out, { recursive: true })
  // Icono principal (cuadrado; iOS/Android lo redondean)
  await sharp(Buffer.from(svg(background(false) + dumbbell(1)))).png().toFile(path.join(out, 'icon.png'))
  // Adaptive icon: solo primer plano, dentro de la zona segura (≈66 % central)
  await sharp(Buffer.from(svg(dumbbell(0.74)))).png().toFile(path.join(out, 'adaptive-icon.png'))
  // Splash: mancuerna sobre transparente (el fondo lo pone app.json)
  await sharp(Buffer.from(svg(dumbbell(0.75)))).png().toFile(path.join(out, 'splash-icon.png'))
  // Favicon
  await sharp(Buffer.from(svg(background(true) + dumbbell(1)))).resize(64, 64).png().toFile(path.join(out, 'favicon.png'))
  // Vista previa redondeada (para el README / revisar)
  await sharp(Buffer.from(svg(background(true) + dumbbell(1)))).resize(256, 256).png().toFile(path.join(out, 'icon-preview.png'))
  console.log('iconos generados en', out)
}
main().catch((e) => { console.error(e); process.exit(1) })
