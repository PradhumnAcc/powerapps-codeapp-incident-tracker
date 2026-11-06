import type { Incident } from '../models/Incident'
import { formatDateTime } from './dateUtils'

export async function createIncidentsWorkbookBase64(incidents: Incident[]): Promise<string> {
  const XLSX = await import('xlsx')
  const rows = incidents.map((incident) => ({
    'Incident number': incident.incidentNumber,
    Status: incident.status,
    Category: incident.category,
    Description: incident.description,
    'Reported date': formatDateTime(incident.reportedDate),
    'Resolved date': formatDateTime(incident.resolvedDate),
    'Assigned to': incident.assignedTo?.displayName ?? '',
    'Assigned email': incident.assignedTo?.email ?? '',
  }))
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      'Incident number',
      'Status',
      'Category',
      'Description',
      'Reported date',
      'Resolved date',
      'Assigned to',
      'Assigned email',
    ],
  })
  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 50 },
    { wch: 22 },
    { wch: 22 },
    { wch: 28 },
    { wch: 32 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Incidents')
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })
}

export async function exportIncidentsToExcel(incidents: Incident[]): Promise<void> {
  const base64 = await createIncidentsWorkbookBase64(incidents)
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = `Incidents_${new Date().toISOString().slice(0, 10)}.xlsx`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 0)
}
