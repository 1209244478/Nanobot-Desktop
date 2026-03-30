import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import en from '../locales/en'
import zh from '../locales/zh'

type Language = 'en' | 'zh'
type Translations = typeof en

const translations: Record<Language, Translations> = { en, zh }

interface I18nState {
  language: Language
  t: Translations
  setLanguage: (lang: Language) => void
}

export const useI18n = create<I18nState>()(
  persist(
    (set) => ({
      language: 'en',
      t: en,
      setLanguage: (lang) => {
        set({ language: lang, t: translations[lang] })
        document.documentElement.lang = lang
      },
    }),
    {
      name: 'nanobot-language',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = translations[state.language]
          document.documentElement.lang = state.language
        }
      },
    }
  )
)

export type { Language, Translations }
