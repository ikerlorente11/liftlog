// Selector de ejercicios (modal a pantalla completa): buscador,
// filtros, lista alfabética, selección múltiple con "Superserie" / "Añadir (n)".
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Modal, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '../theme'
import { Button, Header, HeaderButton } from '../ui/primitives'
import { ExerciseList } from './ExerciseList'

export interface ExercisePickerProps {
  visible: boolean
  onClose: () => void
  /** multi: devuelve lista (con flag superserie); single: devuelve uno */
  mode: 'multi' | 'single'
  onSelect: (ids: string[], asSuperset: boolean) => void
  title?: string
  usedIds?: string[]
}

export function ExercisePicker({ visible, onClose, mode, onSelect, title, usedIds = [] }: ExercisePickerProps) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])

  const reset = () => { setSelected([]); onClose() }
  const confirm = (superset: boolean) => { onSelect(selected, superset); reset() }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={reset} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
        <Header
          title={title ?? (mode === 'single' ? 'Reemplazar ejercicio' : 'Añadir ejercicio')}
          left={<HeaderButton icon="close" onPress={reset} color={c.text} />}
          right={<HeaderButton icon="add-circle-outline" onPress={() => { reset(); router.push('/exercises/new') }} />}
        />
        <ExerciseList
          selectedIds={selected}
          usedIds={usedIds}
          onPress={(ex) => {
            if (mode === 'single') { onSelect([ex.id], false); reset(); return }
            setSelected((s) => (s.includes(ex.id) ? s.filter((x) => x !== ex.id) : [...s, ex.id]))
          }}
          onInfo={(ex) => { reset(); router.push(`/exercises/${ex.id}`) }}
        />
        {mode === 'multi' && selected.length > 0 ? (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: c.bg, borderTopColor: c.border }]}>
            {selected.length > 1 ? <Button label="Superserie" variant="secondary" onPress={() => confirm(true)} style={{ flex: 1 }} /> : null}
            <Button label={`Añadir (${selected.length})`} onPress={() => confirm(false)} style={{ flex: 2 }} />
          </View>
        ) : null}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
})
