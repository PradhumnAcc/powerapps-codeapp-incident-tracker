import { Button, Input, Select } from '@fluentui/react-components'
import type { IncidentPerson } from '../models/Incident'

export type IncidentGroupBy = '' | 'status' | 'category'

export interface IncidentFilterValues {
  search: string
  status: string
  category: string
  assignee: string
  groupBy: IncidentGroupBy
  thenGroupBy: IncidentGroupBy
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
      <div className="grouping-controls" role="group" aria-label="Group incidents">
        <span className="grouping-controls-label">Group by</span>
        <Select
          aria-label="Primary grouping"
          className="filter-select group-by-filter"
          value={filters.groupBy}
          onChange={(event) => {
            const value = event.target.value
            const groupBy = value === 'status' || value === 'category' ? value : ''
            onChange({
              ...filters,
              groupBy,
              thenGroupBy: !groupBy || filters.thenGroupBy === groupBy ? '' : filters.thenGroupBy,
            })
          }}
        >
          <option value="">None</option>
          <option value="status">Status</option>
          <option value="category">Category</option>
        </Select>
        <Select
          aria-label="Secondary grouping"
          className="filter-select group-by-filter"
          value={filters.thenGroupBy}
          disabled={!filters.groupBy}
          onChange={(event) => {
            const value = event.target.value
            const thenGroupBy = value === 'status' || value === 'category'
              ? value === filters.groupBy ? '' : value
              : ''
            onChange({ ...filters, thenGroupBy })
          }}
        >
          <option value="">Then by (optional)</option>
          <option value="status" disabled={filters.groupBy === 'status'}>Status</option>
          <option value="category" disabled={filters.groupBy === 'category'}>Category</option>
        </Select>
      </div>
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