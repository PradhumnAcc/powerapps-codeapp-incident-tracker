import { useEffect, useState } from 'react'
import { Add20Regular, ArrowClockwise20Regular } from '@fluentui/react-icons'
import {
  Button,
  FluentProvider,
  Spinner,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  webLightTheme,
} from '@fluentui/react-components'
import { DashboardCards } from './components/DashboardCards'
import { IncidentDetails } from './components/IncidentDetails'
import { IncidentFilters } from './components/IncidentFilters'
import type { IncidentFilterValues } from './components/IncidentFilters'
import { IncidentForm } from './components/IncidentForm'
import { IncidentTable } from './components/IncidentTable'
import type { Incident, IncidentDraft, IncidentLookups } from './models/Incident'
import { createIncident, getIncidentLookups, getIncidents, updateIncident } from './services/incidentService'
import { sendIncidentReportEmail } from './services/outlookService'
import { exportIncidentsToExcel } from './utils/exportIncidents'
import './App.css'

const emptyLookups: IncidentLookups = { statuses: [], categories: [], assignees: [] }
const emptyFilters: IncidentFilterValues = { search: '', status: '', category: '', assignee: '' }

function sortedByReportedDate(incidents: Incident[]): Incident[] {
  return [...incidents].sort((left, right) => {
    const leftDate = left.reportedDate ? new Date(left.reportedDate).getTime() : 0
    const rightDate = right.reportedDate ? new Date(right.reportedDate).getTime() : 0
    return rightDate - leftDate
  })
}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('The SharePoint request timed out. Refresh to try again.')), timeoutMs)
    operation.then(resolve, reject).finally(() => clearTimeout(timer))
  })
}

function App() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [lookups, setLookups] = useState<IncidentLookups>(emptyLookups)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [filters, setFilters] = useState<IncidentFilterValues>(emptyFilters)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const { dispatchToast } = useToastController('incident-toaster')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      setError(null)
      void withTimeout(getIncidents(), 30_000)
        .then((result) => { if (active) setIncidents(sortedByReportedDate(result)) })
        .catch((loadError: unknown) => {
          if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load incidents from SharePoint.')
        })
        .finally(() => { if (active) setLoading(false) })
      void withTimeout(getIncidentLookups(), 30_000)
        .then((result) => { if (active) setLookups(result) })
        .catch(() => { if (active) setLookups(emptyLookups) })
    }

    void loadDashboard()
    return () => {
      active = false
    }
  }, [refreshKey])

  const statuses = [...new Set([...lookups.statuses, ...incidents.map((incident) => incident.status).filter(Boolean)])].sort()
  const categories = [...new Set([...lookups.categories, ...incidents.map((incident) => incident.category).filter(Boolean)])].sort()
  const assignees = [...new Map(
    [...lookups.assignees, ...incidents.flatMap((incident) => incident.assignedTo ? [incident.assignedTo] : [])]
      .map((person) => [person.claims, person]),
  ).values()]
  const searchTerm = filters.search.trim().toLowerCase()
  const visibleIncidents = incidents.filter((incident) => {
    const matchesSearch = !searchTerm
      || incident.incidentNumber.toLowerCase().includes(searchTerm)
      || incident.description.toLowerCase().includes(searchTerm)
    const matchesStatus = !filters.status || incident.status.toLowerCase() === filters.status.toLowerCase()
    const matchesCategory = !filters.category || incident.category.toLowerCase() === filters.category.toLowerCase()
    const matchesAssignee = !filters.assignee || incident.assignedTo?.claims === filters.assignee
    return matchesSearch && matchesStatus && matchesCategory && matchesAssignee
  })

  async function handleSave(draft: IncidentDraft) {
    setSaving(true)
    try {
      const nextDraft = {
        ...draft,
        resolvedDate: draft.status.toLowerCase() === 'resolved' && !draft.resolvedDate
          ? new Date().toISOString()
          : draft.resolvedDate,
      }

      if (editingIncident?.id) await updateIncident(editingIncident.id, nextDraft)
      else await createIncident(nextDraft)

      setFormOpen(false)
      setEditingIncident(null)
      setRefreshKey((key) => key + 1)
      dispatchToast(
        <Toast><ToastTitle>{editingIncident ? 'Incident updated successfully' : 'Incident created successfully'}</ToastTitle></Toast>,
        { intent: 'success', timeout: 3500 },
      )
    } finally {
      setSaving(false)
    }
  }

  function openCreateForm() {
    setEditingIncident(null)
    setFormOpen(true)
  }

  function openEditForm(incident: Incident) {
    setSelectedIncident(null)
    setEditingIncident(incident)
    setFormOpen(true)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportIncidentsToExcel(visibleIncidents)
    } catch (exportError) {
      dispatchToast(
        <Toast><ToastTitle>{exportError instanceof Error ? exportError.message : 'Unable to export incidents to Excel.'}</ToastTitle></Toast>,
        { intent: 'error', timeout: 5000 },
      )
    } finally {
      setExporting(false)
    }
  }

  async function handleSendEmail() {
    setSendingEmail(true)
    try {
      const hasFilters = Boolean(
        filters.search.trim() || filters.status || filters.category || filters.assignee,
      )
      await sendIncidentReportEmail(visibleIncidents, hasFilters)
      dispatchToast(
        <Toast><ToastTitle>Incident report email sent to pradhumn.pathak@accenture.com.</ToastTitle></Toast>,
        { intent: 'success', timeout: 5000 },
      )
    } catch (draftError) {
      dispatchToast(
        <Toast><ToastTitle>{draftError instanceof Error ? draftError.message : 'Unable to send the incident report email.'}</ToastTitle></Toast>,
        { intent: 'error', timeout: 5000 },
      )
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <FluentProvider theme={webLightTheme}>
      <div className="incident-app">
        <Toaster toasterId="incident-toaster" position="top-end" />
        <header className="app-header">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">IT</span>
            <div className="brand-copy">
              <p className="header-eyebrow">SUPPORT OPERATIONS</p>
              <h1>Incident Tracker</h1>
              <p className="header-subtitle">Monitor and manage IT support incidents</p>
            </div>
          </div>
          <div className="header-actions">
            <Button
              appearance="secondary"
              icon={<ArrowClockwise20Regular />}
              disabled={loading || saving}
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              Refresh
            </Button>
            <Button appearance="primary" icon={<Add20Regular />} onClick={openCreateForm}>
              New incident
            </Button>
          </div>
        </header>

        <main className="dashboard-main">
          <DashboardCards incidents={incidents} />
          <section className="incident-section" aria-labelledby="incident-list-heading">
            <div className="list-heading">
              <div>
                <h2 id="incident-list-heading">All incidents</h2>
                <p>{visibleIncidents.length} of {incidents.length} incidents</p>
              </div>
              {loading && <Spinner size="tiny" label="Loading incidents" />}
            </div>

            <IncidentFilters
              filters={filters}
              statuses={statuses}
              categories={categories}
              assignees={assignees}
              onChange={setFilters}
              onClear={() => setFilters(emptyFilters)}
              onExport={handleExport}
              onSendEmail={handleSendEmail}
              exportDisabled={loading || exporting || sendingEmail || visibleIncidents.length === 0}
              sendEmailDisabled={loading || exporting || sendingEmail || visibleIncidents.length === 0}
            />

            {error && (
              <div className="error-panel" role="alert">
                <div><strong>Incidents could not be loaded</strong><p>{error}</p></div>
                <Button appearance="secondary" onClick={() => setRefreshKey((key) => key + 1)}>Try again</Button>
              </div>
            )}

            {loading && incidents.length === 0 ? (
              <div className="loading-state"><Spinner label="Loading incidents from SharePoint" /></div>
            ) : visibleIncidents.length > 0 ? (
              <IncidentTable incidents={visibleIncidents} onOpenDetails={setSelectedIncident} onEdit={openEditForm} />
            ) : (
              <div className="empty-state">
                <span className="empty-mark" aria-hidden="true">0</span>
                <h3>{incidents.length === 0 ? 'No incidents yet' : 'No matching incidents'}</h3>
                <p>{incidents.length === 0
                  ? 'Incidents from your connected SharePoint list will appear here.'
                  : 'Try a different search or clear the selected filters.'}</p>
                {incidents.length === 0
                  ? <Button appearance="primary" icon={<Add20Regular />} onClick={openCreateForm}>New incident</Button>
                  : <Button appearance="secondary" onClick={() => setFilters(emptyFilters)}>Clear filters</Button>}
              </div>
            )}
          </section>
        </main>

        <IncidentDetails incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
        {formOpen && (
          <IncidentForm
            key={editingIncident?.id ?? 'new-incident'}
            incident={editingIncident}
            lookups={{
              ...lookups,
              assignees: [...new Map([
                ...lookups.assignees,
                ...(editingIncident?.assignedTo ? [editingIncident.assignedTo] : []),
              ].map((person) => [person.claims, person])).values()],
            }}
            open={formOpen}
            saving={saving}
            onClose={() => { if (!saving) { setFormOpen(false); setEditingIncident(null) } }}
            onSave={handleSave}
          />
        )}
      </div>
    </FluentProvider>
  )
}

export default App
