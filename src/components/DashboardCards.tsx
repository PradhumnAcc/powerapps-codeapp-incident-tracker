import { Badge, Card } from '@fluentui/react-components'
import type { Incident } from '../models/Incident'

interface DashboardCardsProps {
  incidents: Incident[]
}

function isOpenStatus(status: string): boolean {
  return ['new', 'in progress', 'on hold'].includes(status.trim().toLowerCase())
}

export function DashboardCards({ incidents }: DashboardCardsProps) {
  const metrics = [
    { label: 'Total incidents', value: incidents.length, marker: 'ALL', tone: 'metric-total' },
    { label: 'Open incidents', value: incidents.filter((incident) => isOpenStatus(incident.status)).length, marker: 'OPEN', tone: 'metric-open' },
    { label: 'On hold', value: incidents.filter((incident) => incident.status.trim().toLowerCase() === 'on hold').length, marker: 'HOLD', tone: 'metric-hold' },
    { label: 'Resolved', value: incidents.filter((incident) => incident.status.trim().toLowerCase() === 'resolved').length, marker: 'DONE', tone: 'metric-resolved' },
  ]

  return (
    <section className="kpi-grid" aria-label="Incident summary">
      {metrics.map((metric) => (
        <Card className={`kpi-card ${metric.tone}`} key={metric.label}>
          <div className="kpi-topline">
            <span className="kpi-marker">{metric.marker}</span>
            {metric.label === 'Open incidents' && <Badge appearance="tint" color="warning">Active</Badge>}
          </div>
          <strong className="kpi-value">{metric.value}</strong>
          <span className="kpi-label">{metric.label}</span>
        </Card>
      ))}
    </section>
  )
}