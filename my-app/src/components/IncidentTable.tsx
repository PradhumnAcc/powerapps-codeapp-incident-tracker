import { useMemo, useState } from 'react'
import { ArrowDown20Regular, ArrowSort20Regular, ArrowUp20Regular } from '@fluentui/react-icons'
import { Badge, Button, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@fluentui/react-components'
import type { ReactNode } from 'react'
import type { Incident } from '../models/Incident'
import type { IncidentGroupBy } from './IncidentFilters'
import { formatDateTime, getIncidentAge, getIncidentAgeHours } from '../utils/dateUtils'

interface IncidentTableProps {
  incidents: Incident[]
  groupBy: IncidentGroupBy
  thenGroupBy: IncidentGroupBy
  onOpenDetails: (incident: Incident) => void
  onEdit: (incident: Incident) => void
}

interface IncidentGroup {
  label: string
  incidents: Incident[]
}

type SortColumn =
  | 'incidentNumber'
  | 'status'
  | 'category'
  | 'description'
  | 'reportedDate'
  | 'resolvedDate'
  | 'assignedTo'
  | 'age'
type SortDirection = 'ascending' | 'descending'

interface SortState {
  column: SortColumn
  direction: SortDirection
}

function statusClass(status: string): string {
  return `status-${status.toLowerCase().replace(/[^a-z]+/g, '-') || 'unknown'}`
}

function groupIncidents(
  incidents: Incident[],
  groupBy: Exclude<IncidentGroupBy, ''>,
  sortAlphabetically: boolean,
): IncidentGroup[] {
  const groups = new Map<string, IncidentGroup>()

  incidents.forEach((incident) => {
    const rawValue = incident[groupBy].trim()
    const label = rawValue || (groupBy === 'status' ? 'Unknown' : 'Uncategorized')
    const key = label.toLowerCase()
    const group = groups.get(key)

    if (group) group.incidents.push(incident)
    else groups.set(key, { label, incidents: [incident] })
  })

  const result = [...groups.values()]
  return sortAlphabetically ? result.sort((left, right) => left.label.localeCompare(right.label)) : result
}

function getSortValue(incident: Incident, column: SortColumn, now: number): string | number | null {
  switch (column) {
    case 'incidentNumber':
      return incident.incidentNumber.trim() || null
    case 'status':
      return incident.status.trim() || null
    case 'category':
      return incident.category.trim() || null
    case 'description':
      return incident.description.trim() || null
    case 'assignedTo':
      return incident.assignedTo?.displayName.trim() || null
    case 'reportedDate':
    case 'resolvedDate': {
      const value = incident[column]
      if (!value) return null
      const date = Date.parse(value)
      return Number.isNaN(date) ? null : date
    }
    case 'age':
      return getIncidentAgeHours(incident.reportedDate, incident.resolvedDate, now)
  }
}

function compareIncidents(left: Incident, right: Incident, sort: SortState, now: number): number {
  const leftValue = getSortValue(left, sort.column, now)
  const rightValue = getSortValue(right, sort.column, now)
  if (leftValue === null) return rightValue === null ? 0 : 1
  if (rightValue === null) return -1

  const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
    ? leftValue - rightValue
    : String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true, sensitivity: 'base' })

  return sort.direction === 'ascending' ? comparison : -comparison
}

export function IncidentTable({ incidents, groupBy, thenGroupBy, onOpenDetails, onEdit }: IncidentTableProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set())
  const [sort, setSort] = useState<SortState>({ column: 'reportedDate', direction: 'descending' })
  const [hasUserSorted, setHasUserSorted] = useState(false)
  const [sortNow, setSortNow] = useState(0)
  const sortedIncidents = useMemo(() => {
    return [...incidents].sort((left, right) => compareIncidents(left, right, sort, sortNow))
  }, [incidents, sort, sortNow])
  const groupFields = [groupBy, thenGroupBy].filter(
    (field, index, fields): field is Exclude<IncidentGroupBy, ''> =>
      Boolean(field) && fields.indexOf(field) === index,
  )

  function renderSortHeader(label: string, column: SortColumn) {
    const isActive = sort.column === column
    const direction = isActive
      ? sort.direction === 'ascending' ? 'descending' : 'ascending'
      : 'ascending'
    const icon = isActive
      ? sort.direction === 'ascending' ? <ArrowUp20Regular /> : <ArrowDown20Regular />
      : <ArrowSort20Regular />

    return (
      <TableHeaderCell aria-sort={isActive ? sort.direction : 'none'}>
        <Button
          appearance="subtle"
          className="sort-header-button"
          aria-label={`Sort by ${label} ${direction}`}
          aria-pressed={isActive}
          onClick={() => {
            setHasUserSorted(true)
            setSortNow(Date.now())
            setSort((current) => ({
              column,
              direction: current.column === column && current.direction === 'ascending'
                ? 'descending'
                : 'ascending',
            }))
          }}
        >
          <span>{label}</span>
          <span className="sort-indicator" aria-hidden="true">{icon}</span>
        </Button>
      </TableHeaderCell>
    )
  }

  function renderIncidentRow(incident: Incident) {
    return (
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
    )
  }

  function renderGroupRows(records: Incident[], fields: Exclude<IncidentGroupBy, ''>[], parentKey = ''): ReactNode[] {
    const [field, ...childFields] = fields
    if (!field) return records.map(renderIncidentRow)

    return groupIncidents(records, field, !hasUserSorted).flatMap((group) => {
      const groupKey = `${parentKey}${field}:${group.label.toLowerCase()}`
      const isCollapsed = collapsedGroups.has(groupKey)
      const groupName = `${field === 'status' ? 'Status' : 'Category'}: ${group.label}`
      const childRows = isCollapsed
        ? []
        : childFields.length
          ? renderGroupRows(group.incidents, childFields, `${groupKey}/`)
          : group.incidents.map(renderIncidentRow)

      return [
        <TableRow key={`${groupKey}:header`} className={`incident-group-row${parentKey ? ' nested-group-row' : ''}`}>
          <TableCell colSpan={9}>
            <div className="incident-group-content">
              <Button
                appearance="subtle"
                className="group-toggle"
                aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${groupName}`}
                aria-expanded={!isCollapsed}
                onClick={() => {
                  setCollapsedGroups((current) => {
                    const next = new Set(current)
                    if (isCollapsed) next.delete(groupKey)
                    else next.add(groupKey)
                    return next
                  })
                }}
              >
                {isCollapsed ? '+' : '−'}
              </Button>
              <span className="incident-group-title">{groupName}</span>
              <span className="incident-group-count">
                {group.incidents.length} {group.incidents.length === 1 ? 'incident' : 'incidents'}
              </span>
            </div>
          </TableCell>
        </TableRow>,
        ...childRows,
      ]
    })
  }

  return (
    <div className="table-scroll" role="region" aria-label="Incident list" tabIndex={0}>
      <Table aria-label="IT incidents" className="incident-table" size="small">
        <TableHeader>
          <TableRow>
            {renderSortHeader('Incident number', 'incidentNumber')}
            {renderSortHeader('Status', 'status')}
            {renderSortHeader('Category', 'category')}
            {renderSortHeader('Description', 'description')}
            {renderSortHeader('Reported', 'reportedDate')}
            {renderSortHeader('Resolved', 'resolvedDate')}
            {renderSortHeader('Assigned to', 'assignedTo')}
            {renderSortHeader('Age', 'age')}
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupFields.length
            ? renderGroupRows(sortedIncidents, groupFields)
            : sortedIncidents.map(renderIncidentRow)}
        </TableBody>
      </Table>
    </div>
  )
}