const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export async function fetchCounties() {
  const r = await fetch(`${API_BASE}/api/counties`)
  return r.json()
}

export async function updateCounty(id, contact) {
  const r = await fetch(`${API_BASE}/api/counties/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact || {})
  })
  if (!r.ok) throw new Error('Failed to update')
  return r.json()
}

export async function importCSV(file) {
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch(`${API_BASE}/api/import`, { method: 'POST', body: fd })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export function exportCSVUrl() {
  return `${API_BASE}/api/export`
}
