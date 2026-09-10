// Ajustes de usuario persistidos en AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { DEFAULT_SETTINGS, type Settings } from '../types'

const KEY = 'liftlog.settings.v1'

interface SettingsState {
  settings: Settings
  loaded: boolean
  load: () => Promise<void>
  update: (patch: Partial<Settings>) => Promise<void>
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY)
      if (raw) {
        const stored = JSON.parse(raw) as Partial<Settings> & { v?: number }
        // v2: el tema por defecto pasa a oscuro; si el usuario no lo cambió a mano, migramos
        if (!stored.v && stored.theme === 'system') stored.theme = 'dark'
        set({ settings: { ...DEFAULT_SETTINGS, ...stored } })
      }
    } catch {
      // ajustes por defecto
    }
    set({ loaded: true })
  },
  update: async (patch) => {
    const settings = { ...get().settings, ...patch }
    set({ settings })
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...settings, v: 2 }))
  },
}))
