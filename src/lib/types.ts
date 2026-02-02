import { ConnectionProviderProps } from '@/providers/connections-provider'
import { z } from 'zod'

export const EditUserProfileSchema = z.object({
  email: z.string().email('Required'),
  name: z.string().min(1, 'Required'),
})

export const WorkflowFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
})

export type ConnectionTypes =
  | 'Google Drive'
  | 'Notion'
  | 'Slack'
  | 'Discord'
  | 'Gmail'
  | 'Google Sheets'
  | 'Google Calendar'
  | 'GitHub'
  | 'GitLab'
  | 'Airtable'
  | 'Trello'
  | 'Asana'
  | 'Jira'
  | 'Linear'
  | 'Monday.com'
  | 'Salesforce'
  | 'HubSpot'
  | 'Mailchimp'
  | 'SendGrid'
  | 'Twilio'
  | 'Stripe'
  | 'PayPal'
  | 'Shopify'
  | 'WooCommerce'
  | 'Telegram'
  | 'WhatsApp'
  | 'Twitter'
  | 'LinkedIn'
  | 'Facebook'
  | 'Instagram'
  | 'Dropbox'
  | 'OneDrive'
  | 'AWS S3'
  | 'OpenAI'
  | 'Anthropic'
  | 'PostgreSQL'
  | 'MySQL'
  | 'MongoDB'
  | 'Redis'
  | 'Supabase'
  | 'Firebase'
  | 'Webhook'
  | 'HTTP Request'
  | 'Zapier'
  | 'Microsoft Teams'
  | 'Zoom'
  | 'Calendly'
  | 'Typeform'
  | 'Google Forms'
  | 'Google Gemini'
  | 'Ollama'
  | 'Groq'

export type Connection = {
  title: ConnectionTypes
  description: string
  image: string
  connectionKey: keyof ConnectionProviderProps
  accessTokenKey?: string
  alwaysTrue?: boolean
  slackSpecial?: boolean
}

export type EditorCanvasTypes =
  | 'Email'
  | 'Condition'
  | 'AI'
  | 'Slack'
  | 'Google Drive'
  | 'Notion'
  | 'Custom Webhook'
  | 'Google Calendar'
  | 'Trigger'
  | 'Action'
  | 'Wait'
  | 'Agent'
  | 'Research Agent'
  | 'Coder Agent'
  | 'Analyst Agent'
  | 'Writer Agent'
  | 'Reviewer Agent'
  | 'Coordinator Agent'

export type EditorCanvasCardType = {
  title: string
  description: string
  completed: boolean
  current: boolean
  metadata: any
  type: EditorCanvasTypes
}

export type EditorNodeType = {
  id: string
  type: EditorCanvasCardType['type']
  position: {
    x: number
    y: number
  }
  data: EditorCanvasCardType
}

export type EditorNode = EditorNodeType

export type EditorActions =
  | {
    type: 'LOAD_DATA'
    payload: {
      elements: EditorNode[]
      edges: {
        id: string
        source: string
        target: string
      }[]
    }
  }
  | {
    type: 'UPDATE_NODE'
    payload: {
      elements: EditorNode[]
    }
  }
  | { type: 'REDO' }
  | { type: 'UNDO' }
  | {
    type: 'SELECTED_ELEMENT'
    payload: {
      element: EditorNode
    }
  }

export const nodeMapper: Record<string, string> = {
  Notion: 'notionNode',
  Slack: 'slackNode',
  Discord: 'discordNode',
  'Google Drive': 'googleNode',
  AI: 'aiNode',
  Agent: 'agentNode',
  'Research Agent': 'agentNode',
  'Coder Agent': 'agentNode',
  'Analyst Agent': 'agentNode',
  'Writer Agent': 'agentNode',
  'Reviewer Agent': 'agentNode',
  'Coordinator Agent': 'agentNode',
}
