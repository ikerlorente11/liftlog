// Imagen de ejercicio: miniatura circular (lista) o grande animada (detalle),
// alternando las 2 fotos (inicio/fin) de free-exercise-db para simular el vídeo.
import { Image } from 'expo-image'
import { useEffect, useState } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { imageUri } from '../lib/exercises'
import { useColors } from '../theme'
import type { Exercise } from '../types'
import { Icon } from './primitives'

export function ExerciseThumb({ exercise, size = 44, style }: { exercise?: Exercise; size?: number; style?: StyleProp<ViewStyle> }) {
  const c = useColors()
  const uri = imageUri(exercise, 0)
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#fff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }, style]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" transition={150} cachePolicy="disk" />
      ) : (
        <Icon name="barbell-outline" size={size * 0.5} color="#8a8a92" />
      )}
    </View>
  )
}

export function ExerciseAnimatedImage({ exercise, height = 220, interval = 1200 }: { exercise?: Exercise; height?: number; interval?: number }) {
  const c = useColors()
  const [frame, setFrame] = useState(0)
  const frames = exercise?.images?.length ?? 0
  useEffect(() => {
    if (frames < 2) return
    const t = setInterval(() => setFrame((f) => (f + 1) % frames), interval)
    return () => clearInterval(t)
  }, [frames, interval])
  const uri = imageUri(exercise, frame)
  return (
    <View style={{ height, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      {uri ? (
        <>
          {/* Precarga de ambos fotogramas para que el cambio sea instantáneo */}
          {exercise?.images.map((_, i) => (
            <Image key={i} source={{ uri: imageUri(exercise, i)! }} style={[StyleSheet.absoluteFill, { opacity: i === frame ? 1 : 0 }]} contentFit="contain" cachePolicy="disk" />
          ))}
        </>
      ) : (
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Icon name="barbell-outline" size={56} color={c.textFaint} />
        </View>
      )}
    </View>
  )
}
