// Columna "ANTERIOR" del entreno: qué serie de la última vez corresponde a
// cada serie de hoy.
import type { SetData } from '../types'

const kind = (s: SetData) => (s.type === 'warmup' ? 'warmup' : 'work')

/** Empareja cada serie de hoy con la de la última vez por TIPO y orden
 * dentro de ese tipo: el calentamiento n con el calentamiento n y la
 * efectiva n con la efectiva n (normal, dropset y fallo cuentan como
 * efectivas). `prev` trae TODAS las series de la última vez, también las no
 * completadas: así un calentamiento que se saltó sale en blanco en vez de
 * desplazar las efectivas hacia arriba (antes se filtraban las completadas y
 * se emparejaba por posición absoluta, y la 1ª efectiva acababa enfrente del
 * 2º calentamiento). Solo se devuelven series completadas. */
export function matchPreviousSets(current: SetData[], prev: SetData[] | undefined): (SetData | undefined)[] {
  if (!prev?.length) return current.map(() => undefined)
  const byKind = { warmup: prev.filter((s) => kind(s) === 'warmup'), work: prev.filter((s) => kind(s) === 'work') }
  const seen = { warmup: 0, work: 0 }
  return current.map((s) => {
    const k = kind(s)
    const p = byKind[k][seen[k]++]
    return p?.completed ? p : undefined
  })
}
