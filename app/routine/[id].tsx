// Detalle de rutina: notas, programa por semanas (fase actual + selector de
// semana), lista de ejercicios con series objetivo y botón "Empezar rutina".
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { restLabel } from '../../src/components/EntryEditor'
import { useSupersetIndex } from '../../src/components/useEntryHelpers'
import { effectiveTargets, phaseForWeek } from '../../src/lib/program'
import { fmtSet } from '../../src/lib/stats'
import { useData } from '../../src/store/dataStore'
import { useSettings } from '../../src/store/settingsStore'
import { useWorkout } from '../../src/store/workoutStore'
import { useColors } from '../../src/theme'
import { ExerciseThumb } from '../../src/ui/ExerciseImage'
import { Button, Card, Header, HeaderButton, Icon, Screen } from '../../src/ui/primitives'
import { ConfirmDialog, OptionSheet } from '../../src/ui/sheets'

export default function RoutineDetail() {
  const c = useColors()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const settings = useSettings((s) => s.settings)
  const routine = useData((s) => s.routines.find((r) => r.id === id))
  const { getExercise, typeOf, setProgramWeek } = useData()
  // Solo si hay entreno en curso: suscribirse al entreno entero repintaba esta
  // pantalla (montada debajo) con cada serie marcada en el entreno activo.
  const active = useWorkout((s) => !!s.active)
  const startFromRoutine = useWorkout((s) => s.startFromRoutine)
  const [confirm, setConfirm] = useState(false)
  const [weekPicker, setWeekPicker] = useState(false)

  const targets = useMemo(
    () => (routine ? effectiveTargets(routine, Date.now(), settings.weekStartsMonday) : null),
    [routine, settings.weekStartsMonday],
  )
  const ssIndex = useSupersetIndex(targets?.entries ?? [])

  if (!routine || !targets) return <Screen><Header title="Rutina" left={<HeaderButton icon="chevron-back" onPress={() => router.back()} color={c.text} />} /></Screen>

  const program = routine.program

  const start = () => {
    // Al empezar el primer entreno, el plan arranca en la semana mostrada
    if (program && !targets.started) void setProgramWeek(routine.id, targets.week, settings.weekStartsMonday)
    startFromRoutine(routine, targets.entries)
    router.push('/workout/active')
  }

  return (
    <Screen>
      <Header
        title={routine.name}
        left={<HeaderButton icon="chevron-back" onPress={() => router.back()} color={c.text} />}
        right={<HeaderButton label="Editar" onPress={() => router.push({ pathname: '/routine/edit', params: { id: routine.id } })} />}
      />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: insets.bottom + 90 }}>
        {program ? (
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="calendar-outline" size={18} color={c.primary} />
              <Text style={{ flex: 1, color: c.text, fontWeight: '700', fontSize: 15 }}>
                {targets.started
                  ? targets.finished
                    ? `Plan completado (${program.totalWeeks} semanas) 🎉`
                    : `Semana ${targets.week} de ${program.totalWeeks}${targets.phase ? ` · ${targets.phase.label}` : ''}`
                  : `Plan de ${program.totalWeeks} semanas · sin empezar`}
              </Text>
              <Pressable onPress={() => setWeekPicker(true)} hitSlop={8}>
                <Text style={{ color: c.primary, fontWeight: '600' }}>Cambiar</Text>
              </Pressable>
            </View>
            {!targets.started ? (
              <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 18 }}>
                El plan empezará en la semana {targets.week} al iniciar el primer entreno. Los objetivos de abajo son los de esa semana.
              </Text>
            ) : null}
            {targets.phase?.note ? <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 18 }}>{targets.phase.note}</Text> : null}
            {targets.phase?.deload ? (
              <Text style={{ color: c.warning, fontSize: 13 }}>Semana de descarga: mitad de series con los mismos pesos.</Text>
            ) : null}
          </Card>
        ) : null}
        {routine.notes ? <Card><Text style={{ color: c.textMuted, lineHeight: 20 }}>{routine.notes}</Text></Card> : null}
        {targets.entries.map((e) => {
          const ex = getExercise(e.exerciseId)
          const t = typeOf(e.exerciseId)
          const ssI = e.supersetId ? ssIndex.get(e.supersetId) : undefined
          return (
            <Card key={e.id} style={{ gap: 6 }} onPress={() => router.push(`/exercises/${e.exerciseId}`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ExerciseThumb exercise={ex} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.primary, fontWeight: '700', fontSize: 16 }}>{ex?.nameEs ?? e.exerciseId}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>
                    {ssI != null ? `Superserie ${String.fromCharCode(65 + ssI)} · ` : ''}Descanso: {restLabel(e.restSeconds, settings.defaultRestSeconds)}{e.repRange ? ` · Rango ${e.repRange.min}-${e.repRange.max} reps` : ''}
                  </Text>
                </View>
              </View>
              {e.notes ? <Text style={{ color: c.textMuted, fontSize: 13 }}>{e.notes}</Text> : null}
              {e.sets.map((s, i) => (
                <View key={s.id} style={styles.setRow}>
                  <Text style={{ width: 40, color: s.type === 'warmup' ? c.warning : c.text, fontWeight: '700', textAlign: 'center' }}>{s.type === 'normal' ? i + 1 : s.type === 'warmup' ? 'W' : s.type === 'dropset' ? 'D' : 'F'}</Text>
                  <Text style={{ color: c.text }}>{fmtSet(s, t, settings)}</Text>
                </View>
              ))}
            </Card>
          )
        })}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: c.bg, borderTopColor: c.border }]}>
        <Button label="Empezar rutina" onPress={() => (active ? setConfirm(true) : start())} />
      </View>
      <ConfirmDialog visible={confirm} title="Ya hay un entreno en curso" message="Se descartará el entreno actual. ¿Empezar esta rutina?" confirmLabel="Descartar y empezar" destructive onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); start() }} />
      {program ? (
        <OptionSheet
          visible={weekPicker}
          onClose={() => setWeekPicker(false)}
          title="¿En qué semana del plan estás?"
          value={targets.week}
          options={Array.from({ length: program.totalWeeks }, (_, i) => {
            const w = i + 1
            const ph = phaseForWeek(program, w)
            return { value: w, label: `Semana ${w}`, sub: ph?.label }
          })}
          onSelect={(w) => void setProgramWeek(routine.id, w, settings.weekStartsMonday)}
        />
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
})
