export const defaultLocale = 'en'
export const locales = ['en', 'zh'] as const
export type Locale = (typeof locales)[number] 