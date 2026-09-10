// Pestañas Inicio / Entreno / Perfil, con la barra de "entreno en curso"
// encima de la tab bar cuando hay un entrenamiento minimizado.
import { Tabs, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fmtClock } from '../../src/lib/format'
import { useWorkout } from '../../src/store/workoutStore'
import { useColors } from '../../src/theme'
import { Icon } from '../../src/ui/primitives'
import { useRestRemaining } from '../../src/components/RestTimerBar'
import { useSetTimerWithFinish } from '../../src/components/SetTimer'

function ActiveBanner() {
  const c = useColors()
  const router = useRouter()
  const active = useWorkout((s) => s.active)
  const rest = useRestRemaining()
  // Aunque el entreno esté minimizado la serie de tiempo tiene que cerrarse sola.
  const setTimer = useSetTimerWithFinish()
  const [, tick] = useState(0)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => tick((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [active])
  if (!active) return null
  const elapsed = Math.floor((Date.now() - active.startedAt) / 1000)
  return (
    <Pressable onPress={() => router.push('/workout/active')} style={[styles.banner, { backgroundColor: c.card, borderTopColor: c.border }]}>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: c.text, fontWeight: '700' }}>{active.title}</Text>
        <Text style={{ color: c.textMuted, fontSize: 12 }}>
          {fmtClock(elapsed)}
          {setTimer ? `  ·  serie ${fmtClock(setTimer.remaining ?? setTimer.elapsed)}` : rest ? `  ·  descanso ${fmtClock(rest.remaining)}` : ''}
        </Text>
      </View>
      <View style={[styles.resume, { backgroundColor: c.primary }]}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Reanudar</Text>
      </View>
    </Pressable>
  )
}

export default function TabsLayout() {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.primary,
          tabBarInactiveTintColor: c.textMuted,
          tabBarStyle: { backgroundColor: c.tabBar, borderTopColor: c.border, height: 56 + insets.bottom, paddingBottom: insets.bottom, paddingTop: 6 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          sceneStyle: { backgroundColor: c.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} /> }} />
        <Tabs.Screen name="workout" options={{ title: 'Entreno', tabBarIcon: ({ color, size }) => <Icon name="add-circle" size={size + 4} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} /> }} />
      </Tabs>
      <View style={[styles.bannerWrap, { bottom: 56 + insets.bottom }]} pointerEvents="box-none">
        <ActiveBanner />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bannerWrap: { position: 'absolute', left: 0, right: 0 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  resume: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
})
