// Configuración de Medidas: qué orígenes existen (nombre y color) y qué campos
// se miden en cada grupo (composición corporal y perímetros). Todo se puede
// añadir, renombrar, ordenar y quitar. Quitar algo que ya tiene medidas solo lo
// oculta y conserva los datos (sección "Ocultos", con Recuperar); sin medidas se
// elimina del todo.
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, InteractionManager, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  GROUP_INFO, LOCKED_FIELD_KEYS, SOURCE_PALETTE, UNIT_OPTIONS, type FieldGroup, type FieldUnit, type MeasurementField, type MeasurementSourceDef,
  addField, addSource, countForField, countForSource, hiddenFields, hiddenSources, moveField, moveSource, nextSourceColor,
  removeField, removeSource, renameField, restoreField, restoreSource, updateSource, visibleFields, visibleSources,
} from '../../src/lib/measurementConfig'
import { useData } from '../../src/store/dataStore'
import { useColors } from '../../src/theme'
import { Button, Card, Header, HeaderButton, Icon, IconName, Screen } from '../../src/ui/primitives'
import { ConfirmDialog } from '../../src/ui/sheets'

type Editor =
  | { kind: 'source'; id?: string; label: string; color: string }
  | { kind: 'field'; key?: string; label: string; group: FieldGroup; unit: FieldUnit }

const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`

export default function MeasurementConfigScreen() {
  const c = useColors()
  const router = useRouter()
  const cfg = useData((s) => s.measurementConfig)
  const measurements = useData((s) => s.measurements)
  const save = useData((s) => s.setMeasurementConfig)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [removing, setRemoving] = useState<{ kind: 'source'; item: MeasurementSourceDef } | { kind: 'field'; item: MeasurementField } | null>(null)
  // Son ~30 filas con cuatro botones cada una: se montan al acabar la animación de entrada.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true))
    return () => task.cancel()
  }, [])

  const sources = visibleSources(cfg)
  const nField = (key: string) => countForField(measurements, key)
  const nSource = (id: string) => countForSource(measurements, id)

  // ---- quitar / ocultar ----
  const removingCount = removing ? (removing.kind === 'source' ? nSource(removing.item.id) : nField(removing.item.key)) : 0
  const removingName = removing ? removing.item.label : ''
  const confirmRemove = () => {
    if (!removing) return
    const r = removing.kind === 'source' ? removeSource(cfg, removing.item.id, measurements) : removeField(cfg, removing.item.key, measurements)
    setRemoving(null)
    if (r.error) { Alert.alert('No se puede quitar', r.error); return }
    void save(r.cfg)
  }

  // ---- guardar el editor ----
  const commitEditor = () => {
    if (!editor) return
    if (editor.kind === 'source') {
      if (editor.id) { void save(updateSource(cfg, editor.id, { label: editor.label, color: editor.color })); setEditor(null); return }
      const r = addSource(cfg, { label: editor.label, color: editor.color })
      if (r.error) { Alert.alert('No se puede añadir', r.error); return }
      void save(r.cfg)
    } else {
      if (editor.key) { void save(renameField(cfg, editor.key, editor.label)); setEditor(null); return }
      const r = addField(cfg, { label: editor.label, group: editor.group, unit: editor.unit })
      if (r.error) { Alert.alert('No se puede añadir', r.error); return }
      void save(r.cfg)
    }
    setEditor(null)
  }

  const RowActions = ({ first, last, onUp, onDown, onRemove, removeIcon, locked }: { first: boolean; last: boolean; onUp: () => void; onDown: () => void; onRemove: () => void; removeIcon: IconName; locked?: boolean }) => (
    <>
      <Pressable onPress={onUp} disabled={first} hitSlop={6} style={{ padding: 4, opacity: first ? 0.25 : 1 }}>
        <Icon name="chevron-up" size={18} color={c.textMuted} />
      </Pressable>
      <Pressable onPress={onDown} disabled={last} hitSlop={6} style={{ padding: 4, opacity: last ? 0.25 : 1 }}>
        <Icon name="chevron-down" size={18} color={c.textMuted} />
      </Pressable>
      {locked ? (
        <View style={{ padding: 4, marginLeft: 4 }}><Icon name="lock-closed-outline" size={18} color={c.textFaint} /></View>
      ) : (
        <Pressable onPress={onRemove} hitSlop={6} style={{ padding: 4, marginLeft: 4 }}>
          <Icon name={removeIcon} size={18} color={c.danger} />
        </Pressable>
      )}
    </>
  )

  const SectionHead = ({ icon, tint, label, hint }: { icon: IconName; tint: string; label: string; hint: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2, marginTop: 6 }}>
      <Icon name={icon} size={14} color={tint} />
      <Text style={{ color: tint, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: c.textFaint, fontSize: 11 }}>· {hint}</Text>
    </View>
  )

  const hiddenF = hiddenFields(cfg)
  const hiddenS = hiddenSources(cfg)

  return (
    <Screen>
      <Header title="Configurar medidas" left={<HeaderButton icon="chevron-back" onPress={() => router.back()} color={c.text} />} />
      {ready ? <ScrollView contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 60 }}>
        <Text style={{ color: c.textMuted, fontSize: 12 }}>
          Toca un elemento para renombrarlo (o cambiarle el color). Si quitas algo que ya tiene medidas se oculta, pero sus datos se conservan y podrás recuperarlo más abajo.
        </Text>

        {/* ---- Orígenes ---- */}
        <SectionHead icon="people-outline" tint={c.success} label="Orígenes" hint="Quién toma la medida; cada uno con su color" />
        <Card style={{ gap: 0, paddingVertical: 4 }}>
          {sources.map((s, i) => {
            const count = nSource(s.id)
            return (
              <View key={s.id} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                <Pressable onPress={() => setEditor({ kind: 'source', id: s.id, label: s.label, color: s.color })} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }} hitSlop={6}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: s.color }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: c.text, fontWeight: '600' }}>{s.label}</Text>
                    <Text style={{ color: c.textFaint, fontSize: 11 }}>{count ? plural(count, 'medida', 'medidas') : 'Sin medidas'}</Text>
                  </View>
                </Pressable>
                <RowActions first={i === 0} last={i === sources.length - 1} onUp={() => void save(moveSource(cfg, s.id, -1))} onDown={() => void save(moveSource(cfg, s.id, 1))} onRemove={() => setRemoving({ kind: 'source', item: s })} removeIcon={count ? 'eye-off-outline' : 'trash-outline'} />
              </View>
            )
          })}
        </Card>
        <Button label="Añadir origen" icon="add" variant="secondary" small onPress={() => setEditor({ kind: 'source', label: '', color: nextSourceColor(cfg) })} />

        {/* ---- Campos por grupo ---- */}
        {(['composition', 'perimeter'] as FieldGroup[]).map((g) => {
          const tint = g === 'composition' ? c.primary : c.accent
          const fields = visibleFields(cfg, g)
          return (
            <View key={g} style={{ gap: 12 }}>
              <SectionHead icon={g === 'composition' ? 'scale-outline' : 'resize-outline'} tint={tint} label={GROUP_INFO[g].label} hint={GROUP_INFO[g].hint} />
              <Card style={{ gap: 0, paddingVertical: 4 }}>
                {fields.length ? fields.map((f, i) => {
                  const count = nField(f.key)
                  const locked = LOCKED_FIELD_KEYS.has(f.key)
                  return (
                    <View key={f.key} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                      <Pressable onPress={() => setEditor({ kind: 'field', key: f.key, label: f.label, group: f.group, unit: f.unit })} style={{ flex: 1, gap: 2 }} hitSlop={6}>
                        <Text style={{ color: c.text, fontWeight: '600' }}>{f.label}</Text>
                        <Text style={{ color: c.textFaint, fontSize: 11 }}>
                          {f.unit === 'kg' ? 'kg / lb' : f.unit} · {count ? plural(count, 'medida', 'medidas') : 'sin medidas'}{locked ? ' · base de los porcentajes' : ''}
                        </Text>
                      </Pressable>
                      <RowActions first={i === 0} last={i === fields.length - 1} onUp={() => void save(moveField(cfg, f.key, -1))} onDown={() => void save(moveField(cfg, f.key, 1))} onRemove={() => setRemoving({ kind: 'field', item: f })} removeIcon={count ? 'eye-off-outline' : 'trash-outline'} locked={locked} />
                    </View>
                  )
                }) : <Text style={{ color: c.textFaint, padding: 10 }}>Sin campos en este grupo.</Text>}
              </Card>
              <Button label={g === 'composition' ? 'Añadir campo de composición' : 'Añadir perímetro'} icon="add" variant="secondary" small onPress={() => setEditor({ kind: 'field', label: '', group: g, unit: g === 'perimeter' ? 'cm' : 'kg' })} />
            </View>
          )
        })}

        {/* ---- Ocultos con datos ---- */}
        {hiddenS.length || hiddenF.length ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.4, paddingHorizontal: 2, marginTop: 6 }}>OCULTOS · con datos guardados</Text>
            <Card style={{ gap: 0, paddingVertical: 4 }}>
              {[...hiddenS.map((s) => ({ id: `s:${s.id}`, label: s.label, sub: `Origen · ${plural(nSource(s.id), 'medida conservada', 'medidas conservadas')}`, color: s.color as string | null, restore: () => save(restoreSource(cfg, s.id)) })),
                ...hiddenF.map((f) => ({ id: `f:${f.key}`, label: f.label, sub: `${GROUP_INFO[f.group].label} · ${plural(nField(f.key), 'medida conservada', 'medidas conservadas')}`, color: null as string | null, restore: () => save(restoreField(cfg, f.key)) }))]
                .map((h, i) => (
                  <View key={h.id} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                    {h.color ? <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: h.color, opacity: 0.5, marginRight: 10 }} /> : null}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ color: c.textMuted, fontWeight: '600' }}>{h.label}</Text>
                      <Text style={{ color: c.textFaint, fontSize: 11 }}>{h.sub}</Text>
                    </View>
                    <Pressable onPress={() => void h.restore()} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}>
                      <Icon name="refresh-outline" size={16} color={c.primary} />
                      <Text style={{ color: c.primary, fontWeight: '600', fontSize: 13 }}>Recuperar</Text>
                    </Pressable>
                  </View>
                ))}
            </Card>
          </View>
        ) : null}
      </ScrollView> : null}

      <EditorDialog editor={editor} onChange={setEditor} onCancel={() => setEditor(null)} onConfirm={commitEditor} />

      <ConfirmDialog
        visible={!!removing}
        title={removingCount ? `Ocultar «${removingName}»` : `Eliminar «${removingName}»`}
        message={removingCount
          ? `Tiene ${plural(removingCount, 'medida', 'medidas')}. Se ocultará de Medidas y Evolución, pero los datos se conservan y podrás recuperarlo cuando quieras.`
          : 'No tiene medidas, así que se eliminará de la lista. Podrás volver a añadirlo con el mismo nombre.'}
        confirmLabel={removingCount ? 'Ocultar' : 'Eliminar'}
        destructive
        onCancel={() => setRemoving(null)}
        onConfirm={confirmRemove}
      />
    </Screen>
  )
}

/** Diálogo de alta / edición: nombre; color para orígenes; unidad al crear un campo. */
function EditorDialog({ editor, onChange, onCancel, onConfirm }: { editor: Editor | null; onChange: (e: Editor) => void; onCancel: () => void; onConfirm: () => void }) {
  const c = useColors()
  const [draft, setDraft] = useState<Editor | null>(editor)
  useEffect(() => { setDraft(editor) }, [editor])
  if (!draft) return null
  const isNew = draft.kind === 'source' ? !draft.id : !draft.key
  const title = draft.kind === 'source' ? (isNew ? 'Nuevo origen' : 'Editar origen') : isNew ? (draft.group === 'perimeter' ? 'Nuevo perímetro' : 'Nuevo campo de composición') : 'Renombrar campo'
  const set = (patch: Partial<Editor>) => { const next = { ...draft, ...patch } as Editor; setDraft(next); onChange(next) }
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.center, { backgroundColor: c.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: c.card }]}>
          <Text style={[styles.dialogTitle, { color: c.text }]}>{title}</Text>
          <TextInput
            value={draft.label}
            onChangeText={(label) => set({ label })}
            placeholder={draft.kind === 'source' ? 'p. ej. Gimnasio (InBody)' : draft.group === 'perimeter' ? 'p. ej. Muñeca izquierda' : 'p. ej. Masa ósea'}
            placeholderTextColor={c.textFaint}
            autoFocus
            style={[styles.input, { backgroundColor: c.input, color: c.text }]}
          />
          {draft.kind === 'source' ? (
            <View style={{ gap: 6 }}>
              <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600' }}>Color de referencia</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {SOURCE_PALETTE.map((col) => {
                  const active = draft.color.toLowerCase() === col.toLowerCase()
                  return (
                    <Pressable key={col} onPress={() => set({ color: col })} hitSlop={4} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: col, alignItems: 'center', justifyContent: 'center', borderWidth: active ? 3 : 0, borderColor: c.text }}>
                      {active ? <Icon name="checkmark" size={16} color="#fff" /> : null}
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ) : isNew ? (
            <View style={{ gap: 6 }}>
              <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600' }}>Unidad</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {UNIT_OPTIONS.map((u) => {
                  const active = draft.unit === u.value
                  return (
                    <Pressable key={u.value} onPress={() => set({ unit: u.value })} style={[styles.chip, { backgroundColor: active ? c.primarySoft : c.input, borderColor: active ? c.primary : 'transparent' }]}>
                      <Text style={{ color: active ? c.text : c.textMuted, fontWeight: '600', fontSize: 13 }}>{u.label}</Text>
                    </Pressable>
                  )
                })}
              </View>
              <Text style={{ color: c.textFaint, fontSize: 11 }}>{UNIT_OPTIONS.find((u) => u.value === draft.unit)?.sub ?? ''}</Text>
            </View>
          ) : (
            <Text style={{ color: c.textFaint, fontSize: 11 }}>La unidad ({draft.unit === 'kg' ? 'kg / lb' : draft.unit}) no se puede cambiar: las medidas ya guardadas dependen de ella.</Text>
          )}
          <View style={styles.dialogBtns}>
            <Button label="Cancelar" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
            <Button label={isNew ? 'Añadir' : 'Guardar'} onPress={onConfirm} disabled={!draft.label.trim()} style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 380, borderRadius: 16, padding: 20, gap: 12 },
  dialogTitle: { fontSize: 18, fontWeight: '700' },
  dialogBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
})
