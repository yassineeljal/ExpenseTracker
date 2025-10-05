export function formatCents(cents: number, currency = "CAD", locale = "fr-CA") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}
