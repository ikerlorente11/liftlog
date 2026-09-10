// Biblioteca de ejercicios (buscar, filtrar, abrir detalle, crear personalizado).
import { useRouter } from 'expo-router'
import { ExerciseList } from '../../src/components/ExerciseList'
import { useColors } from '../../src/theme'
import { Header, HeaderButton, Screen } from '../../src/ui/primitives'

export default function ExercisesScreen() {
  const c = useColors()
  const router = useRouter()
  return (
    <Screen>
      <Header
        title="Ejercicios"
        left={<HeaderButton icon="chevron-back" onPress={() => router.back()} color={c.text} />}
        right={<HeaderButton icon="add-circle-outline" onPress={() => router.push('/exercises/new')} />}
      />
      <ExerciseList onPress={(ex) => router.push(`/exercises/${ex.id}`)} showCount footerSpace={40} />
    </Screen>
  )
}
