export function isValidHttpUrl(value?: string) {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function percent(part: number, total: number) {
  return total ? Number(((part / total) * 100).toFixed(2)) : 0
}

export function average(values: Array<number | undefined>) {
  const clean = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  return clean.length ? Number((clean.reduce((sum, value) => sum + value, 0) / clean.length).toFixed(2)) : 0
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n")
}
