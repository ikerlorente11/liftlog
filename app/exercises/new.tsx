// Crear / editar ejercicio personalizado.
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { EQUIPMENTS, EQUIPMENT_LABEL, EXERCISE_TYPES, EXERCISE_TYPE_LABEL, MUSCLE_GROUPS, MUSCLE_LABEL } from '../../src/lib/labels'
import { uid } from '../../src/lib/format'
import { useData } from '../../src/store/dataStore'
import { useColors } from '../../src/theme'
import type { Equipment, Exercise, ExerciseType, MuscleGroup } from '../../src/types'
import { Button, Header, HeaderButton, ListRow, Screen } from '../../src/ui/primitives'
import { OptionSheet } from '../../src/ui/sheets'

export default function NewExerciseScreen() {
  const c = useColors()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const existing = useData((s) => (id ? s.exerciseMap.get(id) : undefined))
  const saveCustomExercise = useData((s) => s.saveCustomExercise)

  const [name, setName] = useState(existing?.nameEs ?? '')
  const [muscle, setMuscle] = useState<MuscleGroup>(existing?.muscle ?? 'chest')
  const [secondary, setSecondary] = useState<MuscleGroup | null>(existing?.secondary[0] ?? null)
  const [equipment, setEquipment] = useState<Equipment>(existing?.equipment ?? 'none')
  const [type, setType] = useState<ExerciseType>(existing?.type ?? 'weight_reps')
  const [instructions, setInstructions] = useState(existing?.instructions.join('\n') ?? '')
  const [sheet, setSheet] = useState<'muscle' | 'secondary' | 'equipment' | 'type' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!name.trim()) { setError('El nombre es obligatorio.'); return }
    const ex: Exercise = {
      id: existing?.isCustom ? existing.id : `custom_${uid()}`,
      name: name.trim(), nameEs: name.trim(), muscle, secondary: secondary ? [secondary] : [], equipment, type,
      instructions: instructions.split('\n').map((s) => s.trim()).filter(Boolean), images: existing?.isCustom ? existing.images : [], isCustom: true,
    }
    await saveCustomExercise(ex)
    router.back()
  }

  return (
    <Screen>
      <Header title={existing?.isCustom ? 'Editar ejercicio' : 'Crear ejercicio'} left={<HeaderButton icon="close" onPress={() => router.back()} color={c.text} />} right={<Button label="Guardar" small onPress={() => void save()} />} />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }} keyboardShouldPersistTaps="handled">
        <TextInput value={name} onChangeText={(t) => { setName(t); setError(null) }} placeholder="Nombre del ejercicio" placeholderTextColor={c.textFaint} style={[styles.input, { backgroundColor: c.input, color: c.text }]} autoFocus={!existing} />
        {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
        <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
          <ListRow icon="body-outline" label="Grupo muscular" value={MUSCLE_LABEL[muscle]} onPress={() => setSheet('muscle')} />
          <ListRow icon="body-outline" label="Músculo secundario" value={secondary ? MUSCLE_LABEL[secondary] : 'Ninguno'} onPress={() => setSheet('secondary')} />
          <ListRow icon="barbell-outline" label="Equipamiento" value={EQUIPMENT_LABEL[equipment]} onPress={() => setSheet('equipment')} />
          <ListRow icon="options-outline" label="Tipo de ejercicio" value={EXERCISE_TYPE_LABEL[type]} onPress={() => setSheet('type')} />
        </View>
        <Text style={{ color: c.textMuted, fontSize: 13 }}>Instrucciones (una por línea, opcional)</Text>
        <TextInput value={instructions} onChangeText={setInstructions} multiline placeholder="1. Posición inicial...&#10;2. Ejecución..." placeholderTextColor={c.textFaint} style={[styles.input, { backgroundColor: c.input, color: c.text, minHeight: 120, textAlignVertical: 'top' }]} />
      </ScrollView>
      <OptionSheet visible={sheet === 'muscle'} onClose={() => setSheet(null)} title="Grupo muscular" value={muscle} options={MUSCLE_GROUPS.map((m) => ({ value: m, label: MUSCLE_LABEL[m] }))} onSelect={setMuscle} />
      <OptionSheet visible={sheet === 'secondary'} onClose={() => setSheet(null)} title="Músculo secundario" value={secondary ?? ('' as MuscleGroup)} options={[{ value: '' as MuscleGroup, label: 'Ninguno' }, ...MUSCLE_GROUPS.map((m) => ({ value: m, label: MUSCLE_LABEL[m] }))]} onSelect={(v) => setSecondary(v ? v : null)} />
      <OptionSheet visible={sheet === 'equipment'} onClose={() => setSheet(null)} title="Equipamiento" value={equipment} options={EQUIPMENTS.map((e) => ({ value: e, label: EQUIPMENT_LABEL[e] }))} onSelect={setEquipment} />
      <OptionSheet visible={sheet === 'type'} onClose={() => setSheet(null)} title="Tipo de ejercicio" value={type} options={EXERCISE_TYPES.map((t) => ({ value: t, label: EXERCISE_TYPE_LABEL[t] }))} onSelect={setType} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  group: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
})
