export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function getIncidentAge(
  reportedDate: string | null | undefined,
  resolvedDate: string | null | undefined,
  now = new Date(),
): string {
  if (!reportedDate) return '—'

  const start = new Date(reportedDate).getTime()
  const end = resolvedDate ? new Date(resolvedDate).getTime() : now.getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return '—'

  const hours = Math.max(0, Math.floor((end - start) / 3_600_000))
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  if (days === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  if (remainingHours === 0) return `${days} ${days === 1 ? 'day' : 'days'}`
  return `${days} ${days === 1 ? 'day' : 'days'} ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}`
}

export function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

export function fromDateTimeLocal(value: string): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}