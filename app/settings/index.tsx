// Ajustes: perfil, unidades, tema, temporizador, copia de seguridad, borrar datos.
import * as DocumentPicker from 'expo-document-picker'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { fmtDuration } from '../../src/lib/format'
import { exportAll, type BackupData } from '../../src/db/database'
import { REST_OPTIONS } from '../../src/components/EntryEditor'
import { ExportDialog, type ExportParts } from '../../src/components/ExportDialog'
import { useData } from '../../src/store/dataStore'
import { useSettings } from '../../src/store/settingsStore'
import { useColors } from '../../src/theme'
import { Header, HeaderButton, ListRow, Screen } from '../../src/ui/primitives'
import { ConfirmDialog, OptionSheet, PromptDialog } from '../../src/ui/sheets'

export default function SettingsScreen() {
  const c = useColors()
  const router = useRouter()
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const { importBackup, wipeAll, workouts, routines, folders, measurements } = useData()
  const [sheet, setSheet] = useState<'theme' | 'weight' | 'distance' | 'rest' | null>(null)
  const [namePrompt, setNamePrompt] = useState(false)
  const [confirm, setConfirm] = useState<{ title: string; message: string; label: string; onOk: () => void | Promise<void> } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null)
  const [exportSheet, setExportSheet] = useState(false)

  const exportBackup = async (parts: ExportParts) => {
    try {
      const all = await exportAll()
      // Los ejercicios personalizados no son opcionales: si una rutina o un
      // entreno usa uno, la copia sería inservible sin él.
      const used = new Set<string>()
      const collect = (entries: { exerciseId: string }[]) => { for (const e of entries) used.add(e.exerciseId) }
      const wanted = parts.routineIds ? new Set(parts.routineIds) : null
      const routines = parts.routines ? all.routines.filter((r) => !wanted || wanted.has(r.id)) : []
      // Con rutinas concretas solo van sus carpetas (no el resto del plan).
      const folders = parts.routines ? all.folders.filter((f) => !wanted || routines.some((r) => r.folderId === f.id)) : []
      const workouts = parts.workouts ? all.workouts : []
      for (const r of routines) {
        collect(r.exercises)
        for (const ph of r.program?.phases ?? []) if (ph.exercises) collect(ph.exercises)
      }
      for (const w of workouts) collect(w.exercises)
      const data: BackupData = {
        version: 1,
        exportedAt: all.exportedAt,
        folders,
        routines,
        workouts,
        measurements: parts.measurements ? all.measurements : [],
        customExercises: all.customExercises.filter((e) => used.has(e.id)),
        settings: parts.settings ? all.settings : {},
      }
      const planOnly = parts.routines && !parts.workouts && !parts.measurements && !parts.settings
      const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
      const name = planOnly && wanted ? (routines.length === 1 ? `liftlog-rutina-${slug(routines[0].name)}` : 'liftlog-rutinas') : planOnly ? 'liftlog-plan' : 'liftlog-backup'
      const file = new File(Paths.cache, `${name}-${new Date().toISOString().slice(0, 10)}.json`)
      if (file.exists) file.delete()
      file.create()
      file.write(JSON.stringify(data))
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Exportar copia de seguridad' })
      else setMsg(`Copia guardada en ${file.uri}`)
    } catch (e) {
      setMsg(`Error al exportar: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const pickImport = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true })
      if (res.canceled || !res.assets[0]) return
      const file = new File(res.assets[0].uri)
      const text = await file.text()
      const data = JSON.parse(text) as BackupData
      if (!data || !Array.isArray(data.workouts)) { setMsg('El fichero no es una copia de LiftLog.'); return }
      setPendingImport(data)
    } catch (e) {
      setMsg(`Error al importar: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <Screen>
      <Header title="Ajustes" left={<HeaderButton icon="chevron-back" onPress={() => router.back()} color={c.text} />} />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 14, paddingBottom: 60 }}>
        <Group title="Perfil">
          <ListRow icon="person-outline" label="Nombre" value={settings.userName || '—'} onPress={() => setNamePrompt(true)} />
        </Group>
        <Group title="Unidades y aspecto">
          <ListRow icon="scale-outline" label="Unidad de peso" value={settings.weightUnit} onPress={() => setSheet('weight')} />
          <ListRow icon="navigate-outline" label="Unidad de distancia" value={settings.distanceUnit} onPress={() => setSheet('distance')} />
          <ListRow icon="moon-outline" label="Tema" value={settings.theme === 'system' ? 'Sistema' : settings.theme === 'dark' ? 'Oscuro' : 'Claro'} onPress={() => setSheet('theme')} />
          <ListRow icon="calendar-outline" label="La semana empieza en lunes" right={<Switch value={settings.weekStartsMonday} onValueChange={(v) => void update({ weekStartsMonday: v })} trackColor={{ true: c.primary }} />} />
        </Group>
        <Group title="Entrenamiento">
          <ListRow icon="timer-outline" label="Descanso por defecto" value={settings.defaultRestSeconds ? fmtDuration(settings.defaultRestSeconds) : 'Desactivado'} onPress={() => setSheet('rest')} />
          <ListRow icon="phone-portrait-outline" label="Vibrar al acabar el descanso" right={<Switch value={settings.restTimerVibrate} onValueChange={(v) => void update({ restTimerVibrate: v })} trackColor={{ true: c.primary }} />} />
        </Group>
        <Group title="Datos">
          <ListRow icon="cloud-upload-outline" label="Exportar copia de seguridad" value={`${workouts.length} entrenos · ${routines.length} rutinas`} onPress={() => setExportSheet(true)} />
          <ListRow icon="cloud-download-outline" label="Importar copia de seguridad" onPress={() => void pickImport()} />
          <ListRow icon="trash-outline" label="Borrar todos los datos" destructive onPress={() => setConfirm({ title: '¿Borrar todos los datos?', message: 'Se eliminarán entrenos, rutinas, carpetas, medidas y ejercicios personalizados. Esta acción no se puede deshacer.', label: 'Borrar todo', onOk: () => wipeAll() })} />
        </Group>
        <Text style={{ color: c.textFaint, fontSize: 12, textAlign: 'center' }}>LiftLog · datos 100 % locales · ejercicios de free-exercise-db (dominio público)</Text>
        {msg ? <Text style={{ color: c.textMuted, textAlign: 'center' }}>{msg}</Text> : null}
      </ScrollView>

      <OptionSheet visible={sheet === 'theme'} onClose={() => setSheet(null)} title="Tema" value={settings.theme} options={[{ value: 'system', label: 'Sistema' }, { value: 'dark', label: 'Oscuro' }, { value: 'light', label: 'Claro' }]} onSelect={(v) => void update({ theme: v })} />
      <OptionSheet visible={sheet === 'weight'} onClose={() => setSheet(null)} title="Unidad de peso" value={settings.weightUnit} options={[{ value: 'kg', label: 'Kilogramos (kg)' }, { value: 'lb', label: 'Libras (lb)' }]} onSelect={(v) => void update({ weightUnit: v })} />
      <OptionSheet visible={sheet === 'distance'} onClose={() => setSheet(null)} title="Unidad de distancia" value={settings.distanceUnit} options={[{ value: 'km', label: 'Kilómetros (km)' }, { value: 'mi', label: 'Millas (mi)' }]} onSelect={(v) => void update({ distanceUnit: v })} />
      <OptionSheet visible={sheet === 'rest'} onClose={() => setSheet(null)} title="Descanso por defecto" value={settings.defaultRestSeconds} options={REST_OPTIONS.map((s) => ({ value: s, label: s === 0 ? 'Desactivado' : fmtDuration(s) }))} onSelect={(v) => void update({ defaultRestSeconds: v })} />
      <PromptDialog visible={namePrompt} title="Tu nombre" initialValue={settings.userName} placeholder="Nombre" onCancel={() => setNamePrompt(false)} onConfirm={(v) => { void update({ userName: v.trim() }); setNamePrompt(false) }} />
      <ConfirmDialog visible={!!confirm} title={confirm?.title ?? ''} message={confirm?.message} confirmLabel={confirm?.label} destructive onCancel={() => setConfirm(null)} onConfirm={async () => { const fn = confirm?.onOk; setConfirm(null); await fn?.() }} />
      <ExportDialog
        visible={exportSheet}
        counts={{ routines: routines.length, workouts: workouts.length, measurements: measurements.length }}
        routines={routines}
        folders={folders}
        onCancel={() => setExportSheet(false)}
        onConfirm={(parts) => { setExportSheet(false); void exportBackup(parts) }}
      />
      <ConfirmDialog
        visible={!!pendingImport}
        title="Importar copia"
        message={`La copia contiene ${pendingImport?.workouts.length ?? 0} entrenos y ${pendingImport?.routines.length ?? 0} rutinas. ¿Cómo quieres importarla?`}
        confirmLabel="Reemplazar todo"
        cancelLabel="Fusionar"
        destructive
        onCancel={async () => { const d = pendingImport; setPendingImport(null); if (d) { const res = await importBackup(d, 'merge'); setMsg(res.keptNewer.length ? `Copia fusionada. Sin tocar (el móvil tenía una versión más reciente): ${res.keptNewer.join(', ')}.` : 'Copia fusionada.') } }}
        onConfirm={async () => { const d = pendingImport; setPendingImport(null); if (d) { await importBackup(d, 'replace'); setMsg('Datos reemplazados por la copia.') } }}
      />
    </Screen>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useColors()
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: '600', paddingHorizontal: 4 }}>{title.toUpperCase()}</Text>
      <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({ group: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' } })
