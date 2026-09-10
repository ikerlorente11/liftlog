// Paleta visual: fondo casi negro / gris claro, tarjetas, azul de
// acción (#2c7bf6), verde para series completadas. `useColors` resuelve el tema
// activo (sistema/oscuro/claro) según ajustes.

import { useColorScheme } from 'react-native'
import { useSettings } from './store/settingsStore'

export interface Palette {
  bg: string
  card: string
  cardAlt: string
  border: string
  text: string
  textMuted: string
  textFaint: string
  primary: string
  primarySoft: string
  success: string
  successSoft: string
  warning: string
  danger: string
  /** Acento de los perímetros en Medidas (la composición usa primary). */
  accent: string
  accentSoft: string
  dangerSoft: string
  input: string
  inputFocus: string
  tabBar: string
  overlay: string
  chip: string
  chipActive: string
  prGold: string
  isDark: boolean
}

export const dark: Palette = {
  bg: '#101012',
  card: '#1c1c1f',
  cardAlt: '#26262a',
  border: '#2c2c31',
  text: '#f5f5f7',
  textMuted: '#9a9aa3',
  textFaint: '#66666f',
  primary: '#3d8bff',
  primarySoft: 'rgba(61,139,255,0.16)',
  success: '#2ecc71',
  successSoft: 'rgba(46,204,113,0.18)',
  warning: '#f5a623',
  danger: '#ff5a5f',
  accent: '#b86bff',
  accentSoft: 'rgba(184,107,255,0.18)',
  dangerSoft: 'rgba(255,90,95,0.16)',
  input: '#26262a',
  inputFocus: '#303036',
  tabBar: '#161618',
  overlay: 'rgba(0,0,0,0.6)',
  chip: '#26262a',
  chipActive: '#3d8bff',
  prGold: '#f5c542',
  isDark: true,
}

export const light: Palette = {
  bg: '#f2f2f7',
  card: '#ffffff',
  cardAlt: '#f4f4f8',
  border: '#e3e3ea',
  text: '#111114',
  textMuted: '#6b6b75',
  textFaint: '#a0a0aa',
  primary: '#2c7bf6',
  primarySoft: 'rgba(44,123,246,0.12)',
  success: '#22b35b',
  successSoft: 'rgba(34,179,91,0.15)',
  warning: '#e8961b',
  danger: '#e0393e',
  accent: '#9b4dff',
  accentSoft: 'rgba(184,107,255,0.14)',
  dangerSoft: 'rgba(224,57,62,0.12)',
  input: '#f0f0f5',
  inputFocus: '#e6e6ee',
  tabBar: '#ffffff',
  overlay: 'rgba(0,0,0,0.4)',
  chip: '#e9e9f0',
  chipActive: '#2c7bf6',
  prGold: '#d9a400',
  isDark: false,
}

export function useColors(): Palette {
  const theme = useSettings((s) => s.settings.theme)
  const system = useColorScheme()
  const resolved = theme === 'system' ? (system === 'light' ? 'light' : 'dark') : theme
  return resolved === 'light' ? light : dark
}

export const radius = { sm: 8, md: 12, lg: 16, xl: 22 }
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }
