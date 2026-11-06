import { Office365OutlookService } from '../generated/services/Office365OutlookService'
import { Office365UsersService } from '../generated/services/Office365UsersService'
import type { Incident } from '../models/Incident'
import { createIncidentsWorkbookBase64 } from '../utils/exportIncidents'

function formatLocalTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`
}

export async function sendIncidentReportEmail(incidents: Incident[], hasFilters: boolean): Promise<void> {
  const profileResult = await Office365UsersService.MyProfile_V2('displayName')
  if (profileResult.error || !profileResult.success) {
    throw profileResult.error ?? new Error('Unable to get your Office 365 profile.')
  }

  const displayName = profileResult.data.displayName?.trim()
  if (!displayName) {
    throw new Error('Your display name could not be found in your Office 365 profile.')
  }

  const timestamp = formatLocalTimestamp(new Date())
  const attachment = await createIncidentsWorkbookBase64(incidents)
  const result = await Office365OutlookService.SendEmailV2({
    To: 'pradhumn.pathak@accenture.com',
    Subject: `SharePointIncidentsReport_${hasFilters ? 'filtered' : 'unfiltered'}_${timestamp}`,
    Body: [
      `<p>Hi ${escapeHtml(displayName)},</p>`,
      '<p>Please find the SharePoint incident report attached.</p>',
      '<p>Please reach out to the assignee if a ticket has been open for more than 10 days and is still unresolved.</p>',
      '<p>Thanks,<br>Powerapps Teams</p>',
    ].join(''),
    Attachments: [{
      Name: `SharePointIncidentsReport_${timestamp}.xlsx`,
      ContentBytes: attachment,
    }],
  })

  if (result.error || !result.success) {
    throw result.error ?? new Error('Outlook did not confirm sending the incident report email.')
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
