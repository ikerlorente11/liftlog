// Ajustes → Acerca de: versión instalada, actualización OTA en uso y botón
// para buscar una nueva sin tener que reabrir la app dos veces. Solo usa
// módulos que ya van en la build (expo-constants, expo-updates), así que
// llega por OTA sin recompilar.
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import { useState } from 'react'
import { Linking } from 'react-native'
import { fmtDateShort, fmtTime } from '../lib/format'
import { ListRow } from '../ui/primitives'

const REPO_URL = 'https://github.com/ikerlorente11/liftlog'

/** "1.3.0 (5)": versión y build nativas; si no están (web/dev), las de app.json. */
function versionLabel(): string {
  const cfg = Constants.expoConfig
  const v = Constants.nativeAppVersion ?? cfg?.version ?? '?'
  const build = Constants.nativeBuildVersion ?? cfg?.android?.versionCode ?? cfg?.ios?.buildNumber
  return build ? `${v} (${build})` : v
}

/** Identificador corto de la OTA en uso: el del GRUPO (el que sale en el
 * panel de EAS y en el CHANGELOG) si el manifiesto lo trae; si no, el de la
 * actualización de esta plataforma. */
function updateShortId(): string | null {
  const meta = (Updates.manifest as { metadata?: { updateGroup?: string } } | undefined)?.metadata
  const id = meta?.updateGroup ?? Updates.updateId
  return id ? id.slice(0, 8) : null
}

function updateLabel(): string {
  if (!Updates.isEnabled) return 'Desarrollo (sin OTA)'
  if (Updates.isEmbeddedLaunch || !Updates.createdAt) return 'La de la instalación'
  const t = Updates.createdAt.getTime()
  return `${fmtDateShort(t)}, ${fmtTime(t)}`
}

type CheckState = 'idle' | 'checking' | 'none' | 'downloading' | 'ready' | 'error'
const CHECK_LABEL: Record<CheckState, string> = {
  idle: '',
  checking: 'Buscando…',
  none: 'Estás al día',
  downloading: 'Descargando…',
  ready: 'Toca para reiniciar',
  error: 'Sin conexión',
}

export function AboutSection() {
  const [check, setCheck] = useState<CheckState>('idle')
  const shortId = updateShortId()

  const onCheck = async () => {
    if (check === 'ready') { await Updates.reloadAsync(); return }
    if (check === 'checking' || check === 'downloading') return
    try {
      setCheck('checking')
      const r = await Updates.checkForUpdateAsync()
      if (!r.isAvailable) { setCheck('none'); return }
      setCheck('downloading')
      await Updates.fetchUpdateAsync()
      setCheck('ready')
    } catch {
      setCheck('error')
    }
  }

  return (
    <>
      <ListRow icon="information-circle-outline" label="Versión" value={versionLabel()} />
      <ListRow icon="cloud-done-outline" label="Actualización" value={updateLabel()} />
      {shortId ? <ListRow icon="pricetag-outline" label="Identificador" value={shortId} /> : null}
      {Updates.isEnabled ? (
        <>
          <ListRow icon="git-branch-outline" label="Canal" value={`${Updates.channel ?? '—'} · runtime ${Updates.runtimeVersion ?? '?'}`} />
          <ListRow icon="refresh-outline" label="Buscar actualizaciones" value={CHECK_LABEL[check] || undefined} onPress={() => void onCheck()} />
        </>
      ) : null}
      <ListRow icon="logo-github" label="Código fuente" onPress={() => void Linking.openURL(REPO_URL)} />
    </>
  )
}
