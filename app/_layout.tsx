// Layout raíz: carga ajustes, BD y entreno en curso; monta el Stack.
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Stack } from 'expo-router'
import { useData } from '../src/store/dataStore'
import { useSettings } from '../src/store/settingsStore'
import { useWorkout } from '../src/store/workoutStore'
import { useColors } from '../src/theme'
import { setupNotifications } from '../src/lib/notifications'
import { Button } from '../src/ui/primitives'

export default function RootLayout() {
  const c = useColors()
  const settingsLoaded = useSettings((s) => s.loaded)
  const loadSettings = useSettings((s) => s.load)
  const ready = useData((s) => s.ready)
  const error = useData((s) => s.error)
  const bootstrap = useData((s) => s.bootstrap)
  const hydrated = useWorkout((s) => s.hydrated)
  const hydrate = useWorkout((s) => s.hydrate)

  useEffect(() => {
    void loadSettings()
    void bootstrap()
    void hydrate()
    void setupNotifications()
  }, [loadSettings, bootstrap, hydrate])

  const loading = !settingsLoaded || !ready || !hydrated

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <StatusBar style={c.isDark ? 'light' : 'dark'} />
        <View style={[styles.fill, { backgroundColor: c.bg }]}>
          {loading ? (
            <View style={styles.center}><ActivityIndicator color={c.primary} size="large" /></View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>No se pudo cargar la base de datos</Text>
              <Text style={{ color: c.textMuted, textAlign: 'center' }}>{error}</Text>
              <Button label="Reintentar" onPress={() => void bootstrap()} />
            </View>
          ) : (
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="workout/active" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
              <Stack.Screen name="workout/finish" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
              <Stack.Screen name="routine/edit" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="exercises/new" options={{ presentation: 'modal' }} />
            </Stack>
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
})
