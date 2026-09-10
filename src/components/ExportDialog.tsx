// Elegir qué incluye la copia antes de exportarla: así se puede compartir el
// plan (rutinas) sin el historial ni las medidas corporales, o solo algunas
// rutinas concretas (p. ej. pasarle a alguien la de piscina).
import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { useColors } from '../theme'
import { Button, Icon } from '../ui/primitives'
import type { Folder, Routine } from '../types'

export interface ExportParts {
  routines: boolean
  workouts: boolean
  measurements: boolean
  settings: boolean
  /** Solo estas rutinas (ids); null = todas */
  routineIds?: string[] | null
}

export const FULL_EXPORT: ExportParts = { routines: true, workouts: true, measurements: true, settings: true }
/** Para compartir con otra persona: solo el plan, sin nada personal. */
export const PLAN_ONLY: ExportParts = { routines: true, workouts: false, measurements: false, settings: false }

type PartKey = 'routines' | 'workouts' | 'measurements' | 'settings'
const ROWS: { key: PartKey; label: string; sub: string; icon: 'list-outline' | 'barbell-outline' | 'body-outline' | 'settings-outline' }[] = [
  { key: 'routines', label: 'Rutinas y carpetas', sub: 'Tu plan de entrenamiento', icon: 'list-outline' },
  { key: 'workouts', label: 'Entrenos', sub: 'Historial de sesiones y récords', icon: 'barbell-outline' },
  { key: 'measurements', label: 'Medidas corporales', sub: 'Peso, composición corporal y perímetros', icon: 'body-outline' },
  { key: 'settings', label: 'Ajustes y perfil', sub: 'Nombre, unidades y preferencias', icon: 'settings-outline' },
]

export function ExportDialog({ visible, counts, routines, folders, onCancel, onConfirm }: {
  visible: boolean
  counts: { routines: number; workouts: number; measurements: number }
  routines: Routine[]
  folders: Folder[]
  onCancel: () => void
  onConfirm: (parts: ExportParts) => void
}) {
  const c = useColors()
  const [parts, setParts] = useState<ExportParts>(FULL_EXPORT)
  // Selección de rutinas concretas: null = todas; abierta = se muestra la lista
  const [picked, setPicked] = useState<Set<string> | null>(null)
  useEffect(() => { if (visible) { setParts(FULL_EXPORT); setPicked(null) } }, [visible])

  const toggle = (k: 'routines' | 'workouts' | 'measurements' | 'settings') => setParts((p) => ({ ...p, [k]: !p[k] }))
  const nothing = !parts.routines && !parts.workouts && !parts.measurements && !parts.settings
  const isPlanOnly = parts.routines && !parts.workouts && !parts.measurements && !parts.settings
  const isFull = parts.routines && parts.workouts && parts.measurements && parts.settings && picked == null
  const countOf = (k: PartKey) =>
    k === 'routines' ? (picked ? picked.size : counts.routines) : k === 'workouts' ? counts.workouts : k === 'measurements' ? counts.measurements : null
  const togglePick = (id: string) => setPicked((s) => { const n = new Set(s ?? []); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const groups: { label: string; items: Routine[] }[] = [
    ...folders.map((f) => ({ label: f.name, items: routines.filter((r) => r.folderId === f.id) })),
    { label: 'Sin carpeta', items: routines.filter((r) => !r.folderId || !folders.some((f) => f.id === r.folderId)) },
  ].filter((g) => g.items.length)
  const confirm = () => onConfirm({ ...parts, routineIds: parts.routines && picked ? [...picked] : null })
  const noRoutinePicked = parts.routines && picked != null && picked.size === 0

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={[styles.center, { backgroundColor: c.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: c.card }]}>
          <Text style={[styles.title, { color: c.text }]}>¿Qué quieres exportar?</Text>

          <View style={styles.presets}>
            <Pressable onPress={() => { setParts(FULL_EXPORT); setPicked(null) }} style={[styles.preset, { backgroundColor: isFull ? c.primarySoft : c.input, borderColor: isFull ? c.primary : 'transparent' }]}>
              <Text style={{ color: isFull ? c.primary : c.textMuted, fontWeight: '600', fontSize: 13 }}>Copia completa</Text>
            </Pressable>
            <Pressable onPress={() => setParts(PLAN_ONLY)} style={[styles.preset, { backgroundColor: isPlanOnly ? c.primarySoft : c.input, borderColor: isPlanOnly ? c.primary : 'transparent' }]}>
              <Text style={{ color: isPlanOnly ? c.primary : c.textMuted, fontWeight: '600', fontSize: 13 }}>Solo el plan</Text>
            </Pressable>
          </View>

          {ROWS.map((r) => {
            const n = countOf(r.key)
            return (
              <View key={r.key}>
                <Pressable onPress={() => toggle(r.key)} style={styles.row}>
                  <Icon name={r.icon} size={18} color={parts[r.key] ? c.primary : c.textFaint} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontWeight: '600' }}>{r.label}{n !== null ? ` (${n})` : ''}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 12 }}>{r.key === 'routines' && picked ? 'Solo las rutinas marcadas' : r.sub}</Text>
                  </View>
                  <Switch value={parts[r.key]} onValueChange={() => toggle(r.key)} trackColor={{ true: c.primary }} />
                </Pressable>
                {r.key === 'routines' && parts.routines ? (
                  <View style={{ paddingLeft: 30 }}>
                    <Pressable onPress={() => setPicked(picked ? null : new Set())} hitSlop={6}>
                      <Text style={{ color: c.primary, fontSize: 13, fontWeight: '600' }}>{picked ? 'Todas las rutinas' : 'Elegir rutinas concretas…'}</Text>
                    </Pressable>
                    {picked ? (
                      <ScrollView style={[styles.pickList, { backgroundColor: c.input }]} nestedScrollEnabled>
                        {groups.map((g) => (
                          <View key={g.label}>
                            <Text style={{ color: c.textFaint, fontSize: 11, fontWeight: '700', marginTop: 8, marginBottom: 2 }}>{g.label.toUpperCase()}</Text>
                            {g.items.map((rt) => {
                              const on = picked.has(rt.id)
                              return (
                                <Pressable key={rt.id} onPress={() => togglePick(rt.id)} style={styles.pickRow}>
                                  <Icon name={on ? 'checkbox' : 'square-outline'} size={20} color={on ? c.primary : c.textFaint} />
                                  <Text numberOfLines={1} style={{ color: c.text, flex: 1, fontSize: 14 }}>{rt.name}</Text>
                                </Pressable>
                              )
                            })}
                          </View>
                        ))}
                      </ScrollView>
                    ) : null}
                  </View>
                ) : null}
              </View>
            )
          })}

          <Text style={{ color: c.textFaint, fontSize: 12, marginTop: 6 }}>
            {isPlanOnly
              ? (picked ? 'Listo para compartir: solo esas rutinas, sus carpetas y sus ejercicios personalizados.' : 'Listo para compartir: no incluye entrenos, medidas ni datos personales.')
              : 'Los ejercicios personalizados que usen las rutinas o los entrenos se incluyen siempre.'}
          </Text>

          <View style={styles.btns}>
            <Button label="Cancelar" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
            <Button label="Exportar" disabled={nothing || noRoutinePicked} onPress={confirm} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 440, borderRadius: 16, padding: 16 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  presets: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  preset: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  pickList: { maxHeight: 220, borderRadius: 10, paddingHorizontal: 10, paddingBottom: 8, marginTop: 6 },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  btns: { flexDirection: 'row', gap: 10, marginTop: 14 },
})
