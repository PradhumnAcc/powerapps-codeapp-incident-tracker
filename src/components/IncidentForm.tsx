import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Field,
  Input,
  OverlayDrawer,
  Select,
  Spinner,
  Textarea,
} from '@fluentui/react-components'
import type { Incident, IncidentDraft, IncidentLookups } from '../models/Incident'
import { fromDateTimeLocal, toDateTimeLocal } from '../utils/dateUtils'

interface IncidentFormProps {
  incident: Incident | null
  lookups: IncidentLookups
  open: boolean
  saving: boolean
  onClose: () => void
  onSave: (draft: IncidentDraft) => Promise<void>
}

function defaultStatus(statuses: string[]): string {
  return statuses.find((status) => status.toLowerCase() === 'new') ?? 'New'
}

export function IncidentForm({ incident, lookups, open, saving, onClose, onSave }: IncidentFormProps) {
  const [incidentNumber, setIncidentNumber] = useState(incident?.incidentNumber ?? '')
  const [reportedDate, setReportedDate] = useState(() => toDateTimeLocal(incident?.reportedDate ?? new Date().toISOString()))
  const [resolvedDate, setResolvedDate] = useState(() => toDateTimeLocal(incident?.resolvedDate))
  const [status, setStatus] = useState(incident?.status ?? defaultStatus(lookups.statuses))
  const [category, setCategory] = useState(incident?.category ?? '')
  const [description, setDescription] = useState(incident?.description ?? '')
  const [assigneeClaims, setAssigneeClaims] = useState(incident?.assignedTo?.claims ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [draft, setDraft] = useState<IncidentDraft | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const selectedAssignee = lookups.assignees.find((person) => person.claims === assigneeClaims)

  function prepareSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    if (!selectedAssignee) {
      setFormError('Choose an assigned person from the connected SharePoint directory.')
      return
    }

    const reportIso = fromDateTimeLocal(reportedDate)
    if (!incidentNumber.trim() || !reportIso || !status || !category || !description.trim()) {
      setFormError('Complete all required fields before saving.')
      return
    }

    setDraft({
      incidentNumber: incident?.incidentNumber ?? incidentNumber,
      reportedDate: incident?.reportedDate ?? reportIso,
      resolvedDate: fromDateTimeLocal(resolvedDate),
      status,
      category,
      description,
      assignedTo: selectedAssignee,
    })
    setConfirmOpen(true)
  }

  async function confirmSave() {
    if (!draft) return
    try {
      await onSave(draft)
      setConfirmOpen(false)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'The incident could not be saved.')
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <OverlayDrawer
        open={open}
        position="end"
        size="medium"
        onOpenChange={(_, data) => { if (!data.open && !saving) onClose() }}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={<Button appearance="subtle" aria-label="Close incident form" disabled={saving} onClick={onClose}>Close</Button>}
          >
            {incident ? `Edit ${incident.incidentNumber}` : 'New incident'}
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <form className="incident-form" onSubmit={prepareSave}>
            {incident ? (
              <div className="form-readonly">
                <span>Incident number</span>
                <strong>{incident.incidentNumber}</strong>
              </div>
            ) : (
              <Field label="Incident number" required>
                <Input
                  autoComplete="off"
                  maxLength={255}
                  placeholder="e.g. INC000504"
                  required
                  value={incidentNumber}
                  onChange={(_, data) => setIncidentNumber(data.value)}
                />
              </Field>
            )}
            <Field label="Reported date" required>
              <Input
                type="datetime-local"
                required
                readOnly={Boolean(incident)}
                value={reportedDate}
                onChange={(event) => setReportedDate(event.target.value)}
              />
            </Field>
            <Field label="Status" required>
              <Select required value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="" disabled>Select status</option>
                {lookups.statuses.map((value) => <option key={value} value={value}>{value}</option>)}
              </Select>
            </Field>
            <Field label="Category" required>
              <Select required value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="" disabled>Select category</option>
                {lookups.categories.map((value) => <option key={value} value={value}>{value}</option>)}
              </Select>
            </Field>
            <Field label="Description" required>
              <Textarea
                maxLength={255}
                required
                resize="vertical"
                rows={4}
                value={description}
                onChange={(_, data) => setDescription(data.value)}
              />
            </Field>
            <Field label="Assigned to" required>
              <Select
                required
                value={selectedAssignee?.claims ?? ''}
                onChange={(event) => setAssigneeClaims(event.target.value)}
              >
                <option value="" disabled>Select an assignee</option>
                {lookups.assignees.map((person) => (
                  <option key={person.claims} value={person.claims}>{person.displayName} · {person.email}</option>
                ))}
              </Select>
            </Field>
            {incident && (
              <Field label="Resolved date">
                <Input
                  type="datetime-local"
                  value={resolvedDate}
                  onChange={(event) => setResolvedDate(event.target.value)}
                />
              </Field>
            )}
            {formError && <p className="form-error" role="alert">{formError}</p>}
            {!incident && !lookups.statuses.some((value) => value.toLowerCase() === 'new') && (
              <p className="form-note" role="status">The connected list does not currently return a “New” status choice.</p>
            )}
            {lookups.assignees.length === 0 && (
              <p className="form-note" role="status">No assignees were returned from the connected SharePoint field.</p>
            )}
            <div className="form-actions">
              <Button appearance="secondary" type="button" disabled={saving} onClick={onClose}>Cancel</Button>
              <Button appearance="primary" type="submit" disabled={saving}>
                {saving ? <><Spinner size="tiny" /> Saving</> : incident ? 'Save changes' : 'Create incident'}
              </Button>
            </div>
          </form>
        </DrawerBody>
      </OverlayDrawer>

      <Dialog open={confirmOpen} onOpenChange={(_, data) => setConfirmOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm {incident ? 'incident update' : 'incident creation'}</DialogTitle>
            <DialogContent>
              {incident
                ? `Save changes to ${incident.incidentNumber}?`
                : `Create incident ${incidentNumber.trim()}?`}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" disabled={saving} onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button appearance="primary" disabled={saving} onClick={() => void confirmSave()}>
                {saving ? <><Spinner size="tiny" /> Saving</> : 'Confirm save'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  )
}