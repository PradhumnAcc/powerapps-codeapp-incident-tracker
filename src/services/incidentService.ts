import type { AssignToValue, SharePointIncidentsRead, SharePointIncidentsWrite } from '../generated/models/SharePointIncidentsModel'
import { SharePointIncidentsService } from '../generated/services/SharePointIncidentsService'
import type { Incident, IncidentDraft, IncidentLookups, IncidentPerson } from '../models/Incident'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as UnknownRecord
    : undefined
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function mapDate(value: string | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function mapPerson(value: unknown): IncidentPerson | null {
  const person = asRecord(value)
  if (!person) return null

  const claims = asString(person.Claims)
  const displayName = asString(person.DisplayName)
  if (!claims || !displayName) return null

  return {
    claims,
    displayName,
    email: asString(person.Email),
    picture: asString(person.Picture),
    department: asString(person.Department),
    jobTitle: asString(person.JobTitle),
    odataType: asString(person['@odata.type']) || '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser',
  }
}

export function mapSharePointIncident(record: SharePointIncidentsRead): Incident {
  return {
    id: record.ID === undefined ? '' : String(record.ID),
    incidentNumber: record.Title?.trim() ?? '',
    reportedDate: mapDate(record.field_2),
    resolvedDate: mapDate(record.field_3),
    status: record.field_4?.Value?.trim() ?? '',
    category: record.field_5?.Value?.trim() ?? '',
    description: record.field_6?.trim() ?? '',
    assignedTo: mapPerson(record.AssignTo),
  }
}

function lookupValues(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  const record = asRecord(data)
  if (!record) return []
  const values = record.value ?? record.Value
  return Array.isArray(values) ? values : []
}

function mapChoiceValues(data: unknown): string[] {
  const values = lookupValues(data).flatMap((value) => {
    if (typeof value === 'string') return [value.trim()]
    const record = asRecord(value)
    const choice = asString(record?.Value).trim()
    return choice ? [choice] : []
  })
  return [...new Set(values)]
}

function mapAssignees(data: unknown): IncidentPerson[] {
  const people = lookupValues(data)
    .map(mapPerson)
    .filter((person): person is IncidentPerson => person !== null)
  return [...new Map(people.map((person) => [person.claims, person])).values()]
}

function throwOnError(error: unknown, fallback: string): void {
  if (error) {
    throw error instanceof Error ? error : new Error(fallback)
  }
}

function toSharePointPerson(person: IncidentPerson): AssignToValue {
  return {
    '@odata.type': person.odataType,
    Claims: person.claims,
    DisplayName: person.displayName,
    Email: person.email,
    Picture: person.picture,
    Department: person.department,
    JobTitle: person.jobTitle,
  }
}

function toWriteRecord(draft: IncidentDraft): Omit<SharePointIncidentsWrite, 'ID'> {
  return {
    Title: draft.incidentNumber.trim(),
    field_2: draft.reportedDate,
    field_3: draft.resolvedDate ?? '',
    field_4: draft.status,
    field_5: draft.category,
    field_6: draft.description.trim(),
    AssignTo: toSharePointPerson(draft.assignedTo),
  }
}

export async function getIncidents(): Promise<Incident[]> {
  const result = await SharePointIncidentsService.getAll({ orderBy: ['field_2 desc'] })
  throwOnError(result.error, 'Unable to load incidents from SharePoint.')
  return (result.data ?? []).map(mapSharePointIncident)
}

async function getReferenceValues(key: string): Promise<unknown> {
  const result = await SharePointIncidentsService.getReferencedEntity('', key)
  throwOnError(result.error, `Unable to load ${key} options from SharePoint.`)
  return result.data
}

export async function getIncidentLookups(): Promise<IncidentLookups> {
  const results = await Promise.allSettled([
    getReferenceValues('field_4'),
    getReferenceValues('field_5'),
    getReferenceValues('AssignTo'),
  ])

  return {
    statuses: results[0].status === 'fulfilled' ? mapChoiceValues(results[0].value) : [],
    categories: results[1].status === 'fulfilled' ? mapChoiceValues(results[1].value) : [],
    assignees: results[2].status === 'fulfilled' ? mapAssignees(results[2].value) : [],
  }
}

export async function createIncident(draft: IncidentDraft): Promise<void> {
  const duplicateResult = await SharePointIncidentsService.getAll({
    filter: `Title eq '${draft.incidentNumber.trim().replaceAll("'", "''")}'`,
    select: ['ID', 'Title'],
  })
  throwOnError(duplicateResult.error, 'Unable to check for duplicate incident numbers.')
  if ((duplicateResult.data ?? []).some((record) => record.Title?.trim().toLowerCase() === draft.incidentNumber.trim().toLowerCase())) {
    throw new Error('An incident with this number already exists.')
  }

  const result = await SharePointIncidentsService.create(toWriteRecord(draft))
  throwOnError(result.error, 'Unable to create the incident in SharePoint.')
}

export async function updateIncident(id: string, draft: IncidentDraft): Promise<void> {
  const record = toWriteRecord(draft)
  const result = await SharePointIncidentsService.update(id, {
    field_4: record.field_4,
    field_5: record.field_5,
    field_6: record.field_6,
    field_3: record.field_3,
    AssignTo: record.AssignTo,
  })
  throwOnError(result.error, 'Unable to update the incident in SharePoint.')
}