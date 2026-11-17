import { Badge, Button, DrawerBody, DrawerHeader, DrawerHeaderTitle, OverlayDrawer } from '@fluentui/react-components'
import type { Incident } from '../models/Incident'
import { formatDateTime, getIncidentAge } from '../utils/dateUtils'

interface IncidentDetailsProps {
  incident: Incident | null
  onClose: () => void
}

export function IncidentDetails({ incident, onClose }: IncidentDetailsProps) {
  return (
    <OverlayDrawer
      open={incident !== null}
      position="end"
      size="medium"
      onOpenChange={(_, data) => { if (!data.open) onClose() }}
    >
      {incident && (
        <>
          <DrawerHeader>
            <DrawerHeaderTitle
              action={<Button appearance="subtle" aria-label="Close incident details" onClick={onClose}>Close</Button>}
            >
              Incident details
            </DrawerHeaderTitle>
          </DrawerHeader>
          <DrawerBody>
            <div className="detail-hero">
              <span className="detail-eyebrow">INCIDENT</span>
              <h2>{incident.incidentNumber || 'Untitled incident'}</h2>
              <Badge appearance="tint" className={`status-badge detail-status ${`status-${incident.status.toLowerCase().replace(/[^a-z]+/g, '-') || 'unknown'}`}`}>
                {incident.status || 'Unknown'}
              </Badge>
            </div>
            <dl className="detail-list">
              <div><dt>Category</dt><dd>{incident.category || '—'}</dd></div>
              <div className="detail-description"><dt>Description</dt><dd>{incident.description || '—'}</dd></div>
              <div><dt>Reported date</dt><dd>{formatDateTime(incident.reportedDate)}</dd></div>
              <div><dt>Resolved date</dt><dd>{formatDateTime(incident.resolvedDate)}</dd></div>
              <div><dt>Assigned person</dt><dd>{incident.assignedTo?.displayName || 'Unassigned'}</dd></div>
              <div><dt>Assigned email</dt><dd>{incident.assignedTo?.email || '—'}</dd></div>
              <div><dt>Incident age</dt><dd>{getIncidentAge(incident.reportedDate, incident.resolvedDate)}</dd></div>
            </dl>
          </DrawerBody>
        </>
      )}
    </OverlayDrawer>
  )
}