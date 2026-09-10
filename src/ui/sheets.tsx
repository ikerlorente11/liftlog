// Hojas modales: menú de acciones (bottom sheet), confirmación y prompt de texto.
import { useEffect, useState, type ReactNode } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, useColors } from '../theme'
import { Button, Icon, type IconName } from './primitives'

export interface SheetAction {
  label: string
  icon?: IconName
  onPress: () => void
  destructive?: boolean
  disabled?: boolean
}

export function ActionSheet({ visible, onClose, title, actions, children }: { visible: boolean; onClose: () => void; title?: string; actions?: SheetAction[]; children?: ReactNode }) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: c.overlay }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.card, paddingBottom: insets.bottom + 12 }]}>
        <View style={[styles.handle, { backgroundColor: c.border }]} />
        {title ? <Text style={[styles.sheetTitle, { color: c.textMuted }]}>{title}</Text> : null}
        <ScrollView bounces={false} style={{ maxHeight: 520 }}>
          {children}
          {actions?.map((a, i) => (
            <Pressable
              key={i}
              disabled={a.disabled}
              onPress={() => { onClose(); setTimeout(a.onPress, 50) }}
              style={({ pressed }) => [styles.action, pressed && { backgroundColor: c.cardAlt }, a.disabled && { opacity: 0.4 }]}
            >
              {a.icon ? <Icon name={a.icon} size={22} color={a.destructive ? c.danger : c.text} /> : null}
              <Text style={[styles.actionLabel, { color: a.destructive ? c.danger : c.text }]}>{a.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  )
}

export function ConfirmDialog({ visible, title, message, confirmLabel = 'Aceptar', cancelLabel = 'Cancelar', destructive, onConfirm, onCancel }: {
  visible: boolean; title: string; message?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; onConfirm: () => void; onCancel: () => void
}) {
  const c = useColors()
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={[styles.center, { backgroundColor: c.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: c.card }]}>
          <Text style={[styles.dialogTitle, { color: c.text }]}>{title}</Text>
          {message ? <Text style={[styles.dialogMsg, { color: c.textMuted }]}>{message}</Text> : null}
          <View style={styles.dialogBtns}>
            <Button label={cancelLabel} variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
            <Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

export function PromptDialog({ visible, title, message, placeholder, initialValue = '', confirmLabel = 'Guardar', onConfirm, onCancel, keyboardType, multiline }: {
  visible: boolean; title: string; message?: string; placeholder?: string; initialValue?: string; confirmLabel?: string; onConfirm: (value: string) => void; onCancel: () => void; keyboardType?: 'default' | 'numeric' | 'decimal-pad'; multiline?: boolean
}) {
  const c = useColors()
  const [value, setValue] = useState(initialValue)
  useEffect(() => { if (visible) setValue(initialValue) }, [visible, initialValue])
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.center, { backgroundColor: c.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: c.card }]}>
          <Text style={[styles.dialogTitle, { color: c.text }]}>{title}</Text>
          {message ? <Text style={[styles.dialogMsg, { color: c.textMuted }]}>{message}</Text> : null}
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={c.textFaint}
            autoFocus
            keyboardType={keyboardType}
            multiline={multiline}
            style={[styles.input, { backgroundColor: c.input, color: c.text }, multiline && { minHeight: 90, textAlignVertical: 'top' }]}
          />
          <View style={styles.dialogBtns}>
            <Button label="Cancelar" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
            <Button label={confirmLabel} onPress={() => onConfirm(value)} style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

/** Rango de repeticiones de un ejercicio de rutina (doble progresión). */
export function RepRangeDialog({ visible, value, onClose, onConfirm }: {
  visible: boolean; value: { min: number; max: number } | null; onClose: () => void; onConfirm: (range: { min: number; max: number } | null) => void
}) {
  const c = useColors()
  const [min, setMin] = useState(value ? String(value.min) : '')
  const [max, setMax] = useState(value ? String(value.max) : '')
  useEffect(() => { if (visible) { setMin(value ? String(value.min) : ''); setMax(value ? String(value.max) : '') } }, [visible, value])
  const a = parseInt(min, 10)
  const b = parseInt(max, 10)
  const valid = Number.isFinite(a) && Number.isFinite(b) && a >= 1 && b > a
  const presets: [number, number][] = [[3, 5], [5, 8], [6, 10], [8, 12], [10, 15], [12, 20]]
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.center, { backgroundColor: c.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: c.card }]}>
          <Text style={[styles.dialogTitle, { color: c.text }]}>Rango de repeticiones</Text>
          <Text style={[styles.dialogMsg, { color: c.textMuted }]}>Doble progresión: al acabar un entreno la app propone +1 rep hasta el máximo del rango y, cuando lo completas en todas las series, subir el peso volviendo al mínimo.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {presets.map(([x, y]) => {
              const on = a === x && b === y
              return (
                <Pressable key={`${x}-${y}`} onPress={() => { setMin(String(x)); setMax(String(y)) }} style={[styles.rangeChip, { backgroundColor: on ? c.primarySoft : c.input, borderColor: on ? c.primary : 'transparent' }]}>
                  <Text style={{ color: on ? c.primary : c.textMuted, fontWeight: '600' }}>{x}-{y}</Text>
                </Pressable>
              )
            })}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TextInput value={min} onChangeText={setMin} placeholder="mín" placeholderTextColor={c.textFaint} keyboardType="number-pad" selectTextOnFocus style={[styles.input, { flex: 1, backgroundColor: c.input, color: c.text, textAlign: 'center' }]} />
            <Text style={{ color: c.textMuted }}>a</Text>
            <TextInput value={max} onChangeText={setMax} placeholder="máx" placeholderTextColor={c.textFaint} keyboardType="number-pad" selectTextOnFocus style={[styles.input, { flex: 1, backgroundColor: c.input, color: c.text, textAlign: 'center' }]} />
            <Text style={{ color: c.textMuted }}>reps</Text>
          </View>
          <View style={styles.dialogBtns}>
            <Button label="Sin rango" variant="secondary" onPress={() => onConfirm(null)} style={{ flex: 1 }} />
            <Button label="Guardar" disabled={!valid} onPress={() => onConfirm({ min: a, max: b })} style={{ flex: 1 }} />
          </View>
          <Button label="Cancelar" variant="ghost" onPress={onClose} style={{ marginTop: 6 }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

/** Selector de opciones (radio) en hoja inferior. */
export function OptionSheet<T extends string | number>({ visible, onClose, title, options, value, onSelect }: {
  visible: boolean; onClose: () => void; title: string; options: { value: T; label: string; sub?: string }[]; value: T | null; onSelect: (v: T) => void
}) {
  const c = useColors()
  return (
    <ActionSheet visible={visible} onClose={onClose} title={title}>
      {options.map((o) => (
        <Pressable key={String(o.value)} onPress={() => { onSelect(o.value); onClose() }} style={({ pressed }) => [styles.action, pressed && { backgroundColor: c.cardAlt }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionLabel, { color: c.text }]}>{o.label}</Text>
            {o.sub ? <Text style={{ color: c.textMuted, fontSize: 13 }}>{o.sub}</Text> : null}
          </View>
          {o.value === value ? <Icon name="checkmark" size={22} color={c.primary} /> : null}
        </Pressable>
      ))}
    </ActionSheet>
  )
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 8 },
  sheetTitle: { fontSize: 13, fontWeight: '600', textAlign: 'center', paddingVertical: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 20 },
  actionLabel: { fontSize: 16, fontWeight: '500' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 360, borderRadius: radius.lg, padding: 20, gap: 12 },
  dialogTitle: { fontSize: 18, fontWeight: '700' },
  dialogMsg: { fontSize: 14, lineHeight: 20 },
  dialogBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  input: { borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  rangeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
})
