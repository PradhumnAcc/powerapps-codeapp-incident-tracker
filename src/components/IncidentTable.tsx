import { Badge, Button, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@fluentui/react-components'
import type { Incident } from '../models/Incident'
import { formatDateTime, getIncidentAge } from '../utils/dateUtils'

interface IncidentTableProps {
  incidents: Incident[]
  onOpenDetails: (incident: Incident) => void
  onEdit: (incident: Incident) => void
}

function statusClass(status: string): string {
  return `status-${status.toLowerCase().replace(/[^a-z]+/g, '-') || 'unknown'}`
}

export function IncidentTable({ incidents, onOpenDetails, onEdit }: IncidentTableProps) {
  return (
    <div className="table-scroll" role="region" aria-label="Incident list" tabIndex={0}>
      <Table aria-label="IT incidents" className="incident-table" size="small">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Incident number</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Description</TableHeaderCell>
            <TableHeaderCell>Reported</TableHeaderCell>
            <TableHeaderCell>Resolved</TableHeaderCell>
            <TableHeaderCell>Assigned to</TableHeaderCell>
            <TableHeaderCell>Age</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id || incident.incidentNumber}>
              <TableCell>
                <Button appearance="subtle" className="incident-link" onClick={() => onOpenDetails(incident)}>
                  {incident.incidentNumber || 'Untitled'}
                </Button>
              </TableCell>
              <TableCell>
                <Badge appearance="tint" className={`status-badge ${statusClass(incident.status)}`}>
                  {incident.status || 'Unknown'}
                </Badge>
              </TableCell>
              <TableCell>{incident.category || '—'}</TableCell>
              <TableCell className="description-cell" title={incident.description}>
                {incident.description || '—'}
              </TableCell>
              <TableCell className="date-cell">{formatDateTime(incident.reportedDate)}</TableCell>
              <TableCell className="date-cell">{formatDateTime(incident.resolvedDate)}</TableCell>
              <TableCell>{incident.assignedTo?.displayName || 'Unassigned'}</TableCell>
              <TableCell className="age-cell">{getIncidentAge(incident.reportedDate, incident.resolvedDate)}</TableCell>
              <TableCell>
                <Button appearance="subtle" className="edit-button" onClick={() => onEdit(incident)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}