// Primitivas de UI reutilizables: pantalla, cabecera, tarjeta, botón, chip, buscador.
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps, ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, useColors } from '../theme'

export type IconName = ComponentProps<typeof Ionicons>['name']

export function Icon({ name, size = 22, color, style }: { name: IconName; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  const c = useColors()
  return <Ionicons name={name} size={size} color={color ?? c.text} style={style} />
}

export function Screen({ children, style, edges = ['top'] }: { children: ReactNode; style?: StyleProp<ViewStyle>; edges?: ('top' | 'bottom')[] }) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <View style={[{ flex: 1, backgroundColor: c.bg, paddingTop: edges.includes('top') ? insets.top : 0, paddingBottom: edges.includes('bottom') ? insets.bottom : 0 }, style]}>
      {children}
    </View>
  )
}

export function Header({ title, left, right, subtitle, center }: { title: string; subtitle?: string; left?: ReactNode; right?: ReactNode; center?: boolean }) {
  const c = useColors()
  return (
    <View style={[styles.header, { borderBottomColor: c.border }]}>
      <View style={styles.headerSide}>{left}</View>
      <View style={[styles.headerCenter, center && { alignItems: 'center' }]}>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: c.text }]}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={[styles.headerSub, { color: c.textMuted }]}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  )
}

export function HeaderButton({ icon, label, onPress, color, disabled, bold }: { icon?: IconName; label?: string; onPress: () => void; color?: string; disabled?: boolean; bold?: boolean }) {
  const c = useColors()
  const col = disabled ? c.textFaint : color ?? c.primary
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8} style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.5 }]}>
      {icon ? <Icon name={icon} size={24} color={col} /> : null}
      {label ? <Text style={{ color: col, fontSize: 16, fontWeight: bold ? '700' : '500' }}>{label}</Text> : null}
    </Pressable>
  )
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const c = useColors()
  const base = [styles.card, { backgroundColor: c.card, borderColor: c.border }, style]
  if (onPress) return <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}>{children}</Pressable>
  return <View style={base}>{children}</View>
}

export function Button({ label, onPress, variant = 'primary', icon, style, disabled, loading, small }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'; icon?: IconName; style?: StyleProp<ViewStyle>; disabled?: boolean; loading?: boolean; small?: boolean
}) {
  const c = useColors()
  const bg = variant === 'primary' ? c.primary : variant === 'secondary' ? c.cardAlt : variant === 'danger' ? c.dangerSoft : variant === 'success' ? c.success : 'transparent'
  const fg = variant === 'primary' || variant === 'success' ? '#fff' : variant === 'danger' ? c.danger : variant === 'ghost' ? c.primary : c.text
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.btn, small && styles.btnSmall, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon ? <Icon name={icon} size={small ? 16 : 18} color={fg} /> : null}
          <Text style={[styles.btnLabel, small && { fontSize: 14 }, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  )
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName }) {
  const c = useColors()
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, { backgroundColor: active ? c.chipActive : c.chip, opacity: pressed ? 0.8 : 1 }]}>
      {icon ? <Icon name={icon} size={14} color={active ? '#fff' : c.text} /> : null}
      <Text numberOfLines={1} style={{ color: active ? '#fff' : c.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
      {onPress ? <Icon name="chevron-down" size={14} color={active ? '#fff' : c.textMuted} /> : null}
    </Pressable>
  )
}

export function SearchBar({ value, onChange, placeholder = 'Buscar ejercicio', autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  const c = useColors()
  return (
    <View style={[styles.search, { backgroundColor: c.input }]}>
      <Icon name="search" size={18} color={c.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.textFaint}
        autoFocus={autoFocus}
        autoCorrect={false}
        style={[styles.searchInput, { color: c.text }]}
        returnKeyType="search"
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <Icon name="close-circle" size={18} color={c.textMuted} />
        </Pressable>
      ) : null}
    </View>
  )
}

export function SectionTitle({ children, right, style }: { children: ReactNode; right?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors()
  return (
    <View style={[styles.sectionRow, style]}>
      <Text style={[styles.sectionTitle, { color: c.text }]}>{children}</Text>
      {right}
    </View>
  )
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const c = useColors()
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }, style]} />
}

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: ReactNode }) {
  const c = useColors()
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: c.cardAlt }]}>
        <Icon name={icon} size={30} color={c.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{title}</Text>
      {text ? <Text style={[styles.emptyText, { color: c.textMuted }]}>{text}</Text> : null}
      {action}
    </View>
  )
}

export function Row({ children, style, gap = 8 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>
}

/** Fila de lista tipo iOS (icono, texto, valor, chevron). */
export function ListRow({ icon, label, value, onPress, destructive, right, iconColor }: { icon?: IconName; label: string; value?: string; onPress?: () => void; destructive?: boolean; right?: ReactNode; iconColor?: string }) {
  const c = useColors()
  const color = destructive ? c.danger : c.text
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: c.cardAlt }]}>
      {icon ? <Icon name={icon} size={22} color={iconColor ?? (destructive ? c.danger : c.primary)} /> : null}
      <Text style={[styles.listLabel, { color }]}>{label}</Text>
      {value ? <Text style={{ color: c.textMuted, fontSize: 15 }}>{value}</Text> : null}
      {right}
      {onPress && !right ? <Icon name="chevron-forward" size={18} color={c.textFaint} /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 52, borderBottomWidth: StyleSheet.hairlineWidth },
  headerSide: { minWidth: 64, flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerCenter: { flex: 1, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12 },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 6 },
  card: { borderRadius: radius.lg, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12 },
  btnLabel: { fontSize: 16, fontWeight: '700' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, maxWidth: 200 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 42, borderRadius: radius.md },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 32, gap: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  listLabel: { flex: 1, fontSize: 16 },
})
