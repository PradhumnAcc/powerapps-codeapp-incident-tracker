export interface IncidentPerson {
  claims: string
  displayName: string
  email: string
  picture: string
  department: string
  jobTitle: string
  odataType: string
}

export interface Incident {
  id: string
  incidentNumber: string
  reportedDate: string | null
  resolvedDate: string | null
  status: string
  category: string
  description: string
  assignedTo: IncidentPerson | null
}

export interface IncidentLookups {
  statuses: string[]
  categories: string[]
  assignees: IncidentPerson[]
}

export interface IncidentDraft {
  incidentNumber: string
  reportedDate: string
  status: string
  category: string
  description: string
  assignedTo: IncidentPerson
  resolvedDate?: string
}