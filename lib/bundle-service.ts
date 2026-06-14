export const BUNDLE_PROVIDERS = [
  "Botswana Telecommunications Corporation (BTC)",
  "Mascom Wireless",
  "Orange Botswana",
] as const

export const BUNDLE_TYPES = [
  "Airtime",
  "Data bundle",
  "Voice and data bundle",
] as const

export const BUNDLE_TERMS = ["6", "12", "24", "36"] as const

export function normalizeBotswanaMobile(value: string) {
  const digits = value.replace(/\D/g, "")
  return digits.startsWith("267") ? digits.slice(3) : digits
}

export function isBotswanaMobile(value: string) {
  return /^7\d{7}$/.test(normalizeBotswanaMobile(value))
}
