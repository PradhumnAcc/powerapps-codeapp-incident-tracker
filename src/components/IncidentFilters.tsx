import { Button, Input, Select } from '@fluentui/react-components'
import type { IncidentPerson } from '../models/Incident'

export interface IncidentFilterValues {
  search: string
  status: string
  category: string
  assignee: string
}

interface IncidentFiltersProps {
  filters: IncidentFilterValues
  statuses: string[]
  categories: string[]
  assignees: IncidentPerson[]
  onChange: (filters: IncidentFilterValues) => void
  onClear: () => void
  onExport: () => void
  onSendEmail: () => void
  exportDisabled: boolean
  sendEmailDisabled: boolean
}

export function IncidentFilters({
  filters,
  statuses,
  categories,
  assignees,
  onChange,
  onClear,
  onExport,
  onSendEmail,
  exportDisabled,
  sendEmailDisabled,
}: IncidentFiltersProps) {
  return (
    <section className="filter-toolbar" aria-label="Search and filter incidents">
      <label className="search-field">
        <span className="visually-hidden">Search incident number or description</span>
        <Input
          className="filter-input"
          contentBefore={<span aria-hidden="true">⌕</span>}
          placeholder="Search incidents"
          value={filters.search}
          onChange={(_, data) => onChange({ ...filters, search: data.value })}
        />
      </label>
      <Select
        aria-label="Filter by status"
        className="filter-select"
        value={filters.status}
        onChange={(event) => onChange({ ...filters, status: event.target.value })}
      >
        <option value="">All statuses</option>
        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </Select>
      <Select
        aria-label="Filter by category"
        className="filter-select"
        value={filters.category}
        onChange={(event) => onChange({ ...filters, category: event.target.value })}
      >
        <option value="">All categories</option>
        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
      </Select>
      <Select
        aria-label="Filter by assigned person"
        className="filter-select assignee-filter"
        value={filters.assignee}
        onChange={(event) => onChange({ ...filters, assignee: event.target.value })}
      >
        <option value="">All assignees</option>
        {assignees.map((person) => (
          <option key={person.claims} value={person.claims}>{person.displayName}</option>
        ))}
      </Select>
      <div className="filter-actions">
        <Button appearance="primary" className="export-incidents" disabled={sendEmailDisabled} onClick={onSendEmail}>
          Send email
        </Button>
        <Button appearance="secondary" className="export-incidents" disabled={exportDisabled} onClick={onExport}>
          Export to Excel
        </Button>
        <Button appearance="subtle" className="clear-filters" onClick={onClear}>Clear filters</Button>
      </div>
    </section>
  )
}