// Pestaña Entreno: inicio rápido, rutinas por carpetas, menús de rutina/carpeta.
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { RoutineCard } from '../../src/components/RoutineCard'
import { effectiveTargets } from '../../src/lib/program'
import { useData } from '../../src/store/dataStore'
import { useSettings } from '../../src/store/settingsStore'
import { useWorkout } from '../../src/store/workoutStore'
import { useColors } from '../../src/theme'
import type { Folder, Routine } from '../../src/types'
import { Button, Header, HeaderButton, Icon, Screen, SectionTitle } from '../../src/ui/primitives'
import { ActionSheet, ConfirmDialog, OptionSheet, PromptDialog } from '../../src/ui/sheets'

export default function WorkoutTab() {
  const c = useColors()
  const router = useRouter()
  const routines = useData((s) => s.routines)
  const folders = useData((s) => s.folders)
  const getExercise = useData((s) => s.getExercise)
  const { deleteRoutine, duplicateRoutine, moveRoutine, createFolder, renameFolder, deleteFolder, setProgramWeek } = useData()
  const mondayFirst = useSettings((s) => s.settings.weekStartsMonday)
  // Solo si hay entreno en curso: suscribirse al entreno entero repintaba esta
  // pantalla (montada debajo) con cada serie marcada en el entreno activo.
  const active = useWorkout((s) => !!s.active)
  const startEmpty = useWorkout((s) => s.startEmpty)
  const startFromRoutine = useWorkout((s) => s.startFromRoutine)

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [routineMenu, setRoutineMenu] = useState<Routine | null>(null)
  const [folderMenu, setFolderMenu] = useState<Folder | null>(null)
  const [moveFor, setMoveFor] = useState<Routine | null>(null)
  const [confirm, setConfirm] = useState<{ title: string; message: string; label: string; onOk: () => void } | null>(null)
  const [prompt, setPrompt] = useState<{ title: string; initial: string; onOk: (v: string) => void } | null>(null)

  const grouped = useMemo(() => {
    const noFolder = routines.filter((r) => !r.folderId).sort((a, b) => a.position - b.position)
    const byFolder = folders.map((f) => ({ folder: f, routines: routines.filter((r) => r.folderId === f.id).sort((a, b) => a.position - b.position) }))
    return { noFolder, byFolder }
  }, [routines, folders])

  const startRoutine = (r: Routine) => {
    const go = () => {
      const targets = effectiveTargets(r, Date.now(), mondayFirst)
      // Al primer entreno de un plan sin empezar, arranca en la semana mostrada
      if (r.program && !targets.started) void setProgramWeek(r.id, targets.week, mondayFirst)
      startFromRoutine(r, targets.entries)
      router.push('/workout/active')
    }
    if (active) {
      setConfirm({ title: 'Ya hay un entreno en curso', message: 'Si empiezas esta rutina se descartará el entreno actual. ¿Continuar?', label: 'Descartar y empezar', onOk: go })
    } else go()
  }
  const startEmptyWorkout = () => {
    if (active) { router.push('/workout/active'); return }
    startEmpty(); router.push('/workout/active')
  }

  const shareRoutine = async (r: Routine) => {
    const lines = [r.name, '', ...r.exercises.map((e) => `• ${getExercise(e.exerciseId)?.nameEs ?? e.exerciseId} — ${e.sets.length} series`)]
    await Share.share({ message: lines.join('\n') })
  }

  const renderRoutines = (list: Routine[]) => list.map((r) => (
    <RoutineCard key={r.id} routine={r} onStart={() => startRoutine(r)} onMenu={() => setRoutineMenu(r)} />
  ))

  return (
    <Screen>
      <Header title="Entrenamiento" right={<HeaderButton icon="folder-outline" color={c.text} onPress={() => setPrompt({ title: 'Nueva carpeta', initial: '', onOk: (v) => { if (v.trim()) void createFolder(v.trim()) } })} />} />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 140 }}>
        <SectionTitle>Inicio rápido</SectionTitle>
        <Button label={active ? 'Reanudar entrenamiento' : 'Empezar un entrenamiento vacío'} icon="add" onPress={startEmptyWorkout} />

        <SectionTitle style={{ marginTop: 8 }} right={
          <Pressable onPress={() => router.push('/exercises')} hitSlop={8}><Text style={{ color: c.primary, fontWeight: '600' }}>Ejercicios</Text></Pressable>
        }>Rutinas</SectionTitle>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="Nueva rutina" icon="document-text-outline" variant="secondary" onPress={() => router.push('/routine/edit')} style={{ flex: 1 }} />
          <Button label="Explorar" icon="search-outline" variant="secondary" onPress={() => router.push('/exercises')} style={{ flex: 1 }} />
        </View>

        {grouped.noFolder.length > 0 ? (
          <View style={{ gap: 10 }}>
            <FolderHeader name={`Mis rutinas (${grouped.noFolder.length})`} collapsed={!!collapsed['_none']} onToggle={() => setCollapsed((s) => ({ ...s, _none: !s._none }))} />
            {!collapsed['_none'] ? renderRoutines(grouped.noFolder) : null}
          </View>
        ) : null}

        {grouped.byFolder.map(({ folder, routines: list }) => (
          <View key={folder.id} style={{ gap: 10 }}>
            <FolderHeader
              name={`${folder.name} (${list.length})`}
              collapsed={!!collapsed[folder.id]}
              onToggle={() => setCollapsed((s) => ({ ...s, [folder.id]: !s[folder.id] }))}
              onMenu={() => setFolderMenu(folder)}
            />
            {!collapsed[folder.id] ? (list.length ? renderRoutines(list) : <Text style={{ color: c.textFaint, paddingHorizontal: 8 }}>Carpeta vacía</Text>) : null}
          </View>
        ))}

        {routines.length === 0 ? (
          <View style={{ alignItems: 'center', gap: 10, padding: 24 }}>
            <Icon name="albums-outline" size={40} color={c.textFaint} />
            <Text style={{ color: c.textMuted, textAlign: 'center' }}>Todavía no tienes rutinas. Crea una nueva o importa una copia de seguridad desde Ajustes.</Text>
            <Button label="Crear mi primera rutina" variant="secondary" onPress={() => router.push('/routine/edit')} />
          </View>
        ) : null}
      </ScrollView>

      <ActionSheet
        visible={!!routineMenu}
        onClose={() => setRoutineMenu(null)}
        title={routineMenu?.name}
        actions={[
          { label: 'Empezar rutina', icon: 'play-outline', onPress: () => routineMenu && startRoutine(routineMenu) },
          { label: 'Editar rutina', icon: 'create-outline', onPress: () => routineMenu && router.push({ pathname: '/routine/edit', params: { id: routineMenu.id } }) },
          { label: 'Duplicar rutina', icon: 'copy-outline', onPress: () => routineMenu && void duplicateRoutine(routineMenu.id) },
          { label: 'Mover a carpeta', icon: 'folder-open-outline', onPress: () => routineMenu && setMoveFor(routineMenu) },
          { label: 'Compartir', icon: 'share-social-outline', onPress: () => routineMenu && void shareRoutine(routineMenu) },
          { label: 'Eliminar rutina', icon: 'trash-outline', destructive: true, onPress: () => routineMenu && setConfirm({ title: '¿Eliminar rutina?', message: `Se eliminará "${routineMenu.name}".`, label: 'Eliminar', onOk: () => void deleteRoutine(routineMenu.id) }) },
        ]}
      />
      <ActionSheet
        visible={!!folderMenu}
        onClose={() => setFolderMenu(null)}
        title={folderMenu?.name}
        actions={[
          { label: 'Añadir rutina a la carpeta', icon: 'add-outline', onPress: () => folderMenu && router.push({ pathname: '/routine/edit', params: { folderId: folderMenu.id } }) },
          { label: 'Renombrar carpeta', icon: 'pencil-outline', onPress: () => folderMenu && setPrompt({ title: 'Renombrar carpeta', initial: folderMenu.name, onOk: (v) => { if (v.trim()) void renameFolder(folderMenu.id, v.trim()) } }) },
          { label: 'Eliminar carpeta (mantener rutinas)', icon: 'folder-outline', onPress: () => folderMenu && void deleteFolder(folderMenu.id, false) },
          { label: 'Eliminar carpeta y rutinas', icon: 'trash-outline', destructive: true, onPress: () => folderMenu && setConfirm({ title: '¿Eliminar carpeta y sus rutinas?', message: 'Se eliminarán todas las rutinas de la carpeta.', label: 'Eliminar todo', onOk: () => void deleteFolder(folderMenu.id, true) }) },
        ]}
      />
      <OptionSheet
        visible={!!moveFor}
        onClose={() => setMoveFor(null)}
        title="Mover a carpeta"
        value={moveFor?.folderId ?? ''}
        options={[{ value: '', label: 'Sin carpeta' }, ...folders.map((f) => ({ value: f.id, label: f.name }))]}
        onSelect={(v) => { if (moveFor) void moveRoutine(moveFor.id, v || null) }}
      />
      <ConfirmDialog
        visible={!!confirm}
        title={confirm?.title ?? ''}
        message={confirm?.message}
        confirmLabel={confirm?.label}
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={() => { confirm?.onOk(); setConfirm(null) }}
      />
      <PromptDialog
        visible={!!prompt}
        title={prompt?.title ?? ''}
        initialValue={prompt?.initial}
        placeholder="Nombre de la carpeta"
        onCancel={() => setPrompt(null)}
        onConfirm={(v) => { prompt?.onOk(v); setPrompt(null) }}
      />
    </Screen>
  )
}

function FolderHeader({ name, collapsed, onToggle, onMenu }: { name: string; collapsed: boolean; onToggle: () => void; onMenu?: () => void }) {
  const c = useColors()
  return (
    <View style={styles.folderRow}>
      <Pressable onPress={onToggle} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={collapsed ? 'chevron-forward' : 'chevron-down'} size={18} color={c.textMuted} />
        <Text numberOfLines={1} style={{ color: c.text, fontWeight: '700', fontSize: 15, flex: 1 }}>{name}</Text>
      </Pressable>
      {onMenu ? <Pressable onPress={onMenu} hitSlop={10}><Icon name="ellipsis-horizontal" size={20} color={c.textMuted} /></Pressable> : null}
    </View>
  )
}

const styles = StyleSheet.create({ folderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, marginTop: 6 } })
