export type RecurringFrequency =
  | 'WEEKLY'
  | 'FORTNIGHTLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'

export function monthlyEquivalentMultiplier(
  frequency: RecurringFrequency | string
): number {
  switch (frequency) {
    case 'WEEKLY':
      return 52 / 12
    case 'FORTNIGHTLY':
      return 26 / 12
    case 'MONTHLY':
      return 1
    case 'QUARTERLY':
      return 1 / 3
    case 'YEARLY':
      return 1 / 12
    default:
      return 0
  }
}

export function toMonthlyEquivalentCents(
  amountCents: number,
  frequency: RecurringFrequency | string
): number {
  const mult = monthlyEquivalentMultiplier(frequency)
  return Math.round(Math.max(0, amountCents) * mult)
}
