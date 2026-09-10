// Genera assets de la ficha de Play Console en assets/store:
//  - icon_playstore.png (512×512, sin transparencia)
//  - feature_graphic.png (1024×500)
//  - capturas JPG 1080×2400 a partir de PNG en un directorio de entrada
// Uso: SHARP_DIR=<dir con node_modules/sharp> node scripts/make-store-assets.js [dirCapturasPNG]
const path = require('path')
const fs = require('fs')
const sharpDir = process.env.SHARP_DIR
const sharp = require(sharpDir ? path.join(sharpDir, 'node_modules', 'sharp') : 'sharp')

const out = path.join(__dirname, '..', 'assets', 'store')
fs.mkdirSync(out, { recursive: true })
const iconPng = path.join(__dirname, '..', 'assets', 'icon.png')

const BLUE = '#3d8bff'
function featureSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#17181d"/><stop offset="1" stop-color="#0b0c10"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.28" cy="0.5" r="0.45">
      <stop offset="0" stop-color="${BLUE}" stop-opacity="0.45"/><stop offset="1" stop-color="${BLUE}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BLUE}"/><stop offset="1" stop-color="#1f5fd6"/></linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#cfd6e4"/></linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <rect width="1024" height="500" fill="url(#glow)"/>
  <!-- mancuerna -->
  <g transform="translate(60,250)">
    <rect x="0" y="-16" width="360" height="32" rx="16" fill="url(#bar)"/>
    <rect x="30" y="-105" width="52" height="210" rx="14" fill="url(#plate)"/>
    <rect x="278" y="-105" width="52" height="210" rx="14" fill="url(#plate)"/>
    <rect x="92" y="-78" width="36" height="156" rx="12" fill="url(#plate)"/>
    <rect x="232" y="-78" width="36" height="156" rx="12" fill="url(#plate)"/>
  </g>
  <text x="470" y="215" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="88" font-weight="800" fill="#ffffff">LiftLog</text>
  <text x="472" y="275" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="30" font-weight="500" fill="#c9cdd6">Registro de entrenamientos</text>
  <text x="472" y="322" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="24" fill="#8f95a3">Rutinas · Descansos · Récords · Gráficas · Offline</text>
</svg>`
}

async function main() {
  // Icono de la tienda: 512×512 sin alfa (fondo del propio icono, esquinas rectas)
  await sharp(iconPng).resize(512, 512).flatten({ background: '#15161a' }).png().toFile(path.join(out, 'icon_playstore.png'))
  await sharp(Buffer.from(featureSvg())).png().toFile(path.join(out, 'feature_graphic.png'))
  const inDir = process.argv[2]
  if (inDir && fs.existsSync(inDir)) {
    for (const f of fs.readdirSync(inDir).filter((x) => x.endsWith('.png')).sort()) {
      const name = f.replace(/^\d+_/, '').replace(/\.png$/, '.jpg')
      await sharp(path.join(inDir, f)).resize(1080, 2400, { fit: 'cover' }).jpeg({ quality: 88 }).toFile(path.join(out, name))
      console.log('captura', name)
    }
  }
  console.log('assets de tienda en', out)
}
main().catch((e) => { console.error(e); process.exit(1) })
