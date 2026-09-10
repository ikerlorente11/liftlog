// Diálogo para registrar una medida: valor, origen (báscula de casa o
// nutricionista) y fecha. La fecha es editable para poder meter históricos.
import DateTimePicker from '@react-native-community/datetimepicker'
import { useEffect, useMemo, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import type { MeasurementSourceDef } from '../lib/measurementConfig'
import { useColors } from '../theme'
import type { MeasurementSource } from '../types'
import { Button, Icon } from '../ui/primitives'

const DAY = 86400000

/** Mediodía del día indicado: evita saltos de fecha por zona horaria. */
function noon(ts: number): number {
  const d = new Date(ts)
  d.setHours(12, 0, 0, 0)
  return d.getTime()
}
const pad = (n: number) => String(n).padStart(2, '0')
function toText(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}
/** Parsea "dd/mm/aaaa" (también con guiones). Devuelve null si no es una fecha real. */
function parseText(t: string): number | null {
  const m = t.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (!m) return null
  const day = +m[1], month = +m[2], year = +m[3]
  const d = new Date(year, month - 1, day, 12, 0, 0, 0)
  if (d.getDate() !== day || d.getMonth() !== month - 1 || d.getFullYear() !== year) return null
  return d.getTime()
}

export function MeasurementDialog({ visible, label, unit, unitOptions, sources, defaultSource, onCancel, onConfirm }: {
  visible: boolean
  label: string
  unit: string
  /** Unidades alternativas para teclear el valor (p. ej. la grasa en % o en kg); la primera es la que se ofrece por defecto. */
  unitOptions?: string[]
  /** Orígenes visibles (configurables por el usuario). */
  sources: MeasurementSourceDef[]
  defaultSource?: MeasurementSource
  onCancel: () => void
  onConfirm: (value: number, source: MeasurementSource, date: number, unitUsed: string) => void
}) {
  const c = useColors()
  const [value, setValue] = useState('')
  const [unitUsed, setUnitUsed] = useState(unitOptions?.[0] ?? unit)
  const [source, setSource] = useState<MeasurementSource>(defaultSource ?? sources[0]?.id ?? 'home')
  const [date, setDate] = useState(() => noon(Date.now()))
  const [dateText, setDateText] = useState(() => toText(Date.now()))
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    if (!visible) return
    setValue('')
    setSource(defaultSource ?? sources[0]?.id ?? 'home')
    setUnitUsed(unitOptions?.[0] ?? unit)
    const today = noon(Date.now())
    setDate(today)
    setDateText(toText(today))
    setShowCalendar(false)
  }, [visible, defaultSource, unit, unitOptions, sources])

  const today = noon(Date.now())
  const dateValid = parseText(dateText) !== null
  const num = Number(value.replace(',', '.'))
  const valueValid = value.trim() !== '' && !Number.isNaN(num) && num > 0
  const isFuture = dateValid && (parseText(dateText) as number) > today

  const shift = (days: number) => {
    const base = parseText(dateText) ?? date
    const next = noon(base + days * DAY)
    if (next > today) return
    setDate(next)
    setDateText(toText(next))
  }
  const commitText = (t: string) => {
    setDateText(t)
    const parsed = parseText(t)
    if (parsed !== null) setDate(parsed)
  }

  const relative = useMemo(() => {
    const d = parseText(dateText)
    if (d === null) return null
    const diff = Math.round((today - noon(d)) / DAY)
    if (diff === 0) return 'Hoy'
    if (diff === 1) return 'Ayer'
    if (diff > 1) return `Hace ${diff} días`
    return null
  }, [dateText, today])

  const canSave = valueValid && dateValid && !isFuture

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.center, { backgroundColor: c.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: c.card }]}>
          <Text style={[styles.title, { color: c.text }]}>{label}</Text>

          <View style={styles.row}>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder={`Valor en ${unitUsed}`}
              placeholderTextColor={c.textFaint}
              autoFocus
              keyboardType="decimal-pad"
              style={[styles.input, { backgroundColor: c.input, color: c.text, flex: 1 }]}
            />
            {unitOptions && unitOptions.length > 1 ? unitOptions.map((u) => (
              <Pressable key={u} onPress={() => setUnitUsed(u)} style={[styles.chip, { backgroundColor: unitUsed === u ? c.primarySoft : c.input, borderColor: unitUsed === u ? c.primary : 'transparent' }]}>
                <Text style={{ color: unitUsed === u ? c.text : c.textMuted, fontWeight: '600', fontSize: 13 }}>{u}</Text>
              </Pressable>
            )) : null}
          </View>

          <Text style={[styles.section, { color: c.textMuted }]}>Origen</Text>
          {/* Con más de dos orígenes los chips saltan de línea. */}
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            {sources.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setSource(s.id)}
                style={[styles.chip, { minWidth: '45%', backgroundColor: source === s.id ? c.primarySoft : c.input, borderColor: source === s.id ? s.color : 'transparent' }]}
              >
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color, opacity: source === s.id ? 1 : 0.5 }} />
                <Text style={{ color: source === s.id ? c.text : c.textMuted, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{s.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.section, { color: c.textMuted }]}>Fecha</Text>
          <View style={styles.row}>
            <Pressable onPress={() => shift(-1)} hitSlop={6} style={[styles.arrow, { backgroundColor: c.input }]}>
              <Icon name="chevron-back" size={18} color={c.text} />
            </Pressable>
            <TextInput
              value={dateText}
              onChangeText={commitText}
              placeholder="dd/mm/aaaa"
              placeholderTextColor={c.textFaint}
              keyboardType="numbers-and-punctuation"
              style={[styles.dateInput, { backgroundColor: c.input, color: dateValid ? c.text : c.danger }]}
            />
            <Pressable
              onPress={() => shift(1)}
              hitSlop={6}
              disabled={dateValid && noon(parseText(dateText) as number) >= today}
              style={[styles.arrow, { backgroundColor: c.input, opacity: dateValid && noon(parseText(dateText) as number) >= today ? 0.4 : 1 }]}
            >
              <Icon name="chevron-forward" size={18} color={c.text} />
            </Pressable>
            <Pressable onPress={() => setShowCalendar(true)} hitSlop={6} style={[styles.arrow, { backgroundColor: c.input }]}>
              <Icon name="calendar-outline" size={18} color={c.text} />
            </Pressable>
          </View>
          {/* Calendario del sistema: se abre como diálogo propio, así este modal
              no cambia de tamaño. */}
          {showCalendar ? (
            <DateTimePicker
              value={new Date(parseText(dateText) ?? date)}
              mode="date"
              display="default"
              maximumDate={new Date(today)}
              onChange={(event, selected) => {
                setShowCalendar(false)
                if (event.type !== 'set' || !selected) return
                const ts = noon(selected.getTime())
                setDate(ts)
                setDateText(toText(ts))
              }}
            />
          ) : null}
          <Text style={{ color: !dateValid || isFuture ? c.danger : c.textFaint, fontSize: 12, marginTop: 4 }}>
            {!dateValid ? 'Formato de fecha no válido (dd/mm/aaaa)' : isFuture ? 'La fecha no puede ser futura' : relative ?? ''}
          </Text>

          <View style={styles.btns}>
            <Button label="Cancelar" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
            <Button
              label="Añadir"
              disabled={!canSave}
              onPress={() => { if (canSave) onConfirm(num, source, parseText(dateText) as number, unitUsed) }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 420, borderRadius: 16, padding: 16, gap: 4 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  section: { fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  arrow: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dateInput: { flex: 1, textAlign: 'center', borderRadius: 10, paddingVertical: 10, fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  btns: { flexDirection: 'row', gap: 10, marginTop: 16 },
})
