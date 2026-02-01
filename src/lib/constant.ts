import Category from '@/components/icons/category'
import Logs from '@/components/icons/clipboard'
import Templates from '@/components/icons/cloud_download'
import Home from '@/components/icons/home'
import Payment from '@/components/icons/payment'
import Settings from '@/components/icons/settings'
import Workflows from '@/components/icons/workflows'
import { Connection } from './types'

export const clients = [...new Array(10)].map((client, index) => ({
  href: `/${index + 1}.png`,
}))

export const products = [
  {
    title: 'Moonbeam',
    link: 'https://gomoonbeam.com',
    thumbnail: '/p1.png',
  },
  {
    title: 'Cursor',
    link: 'https://cursor.so',
    thumbnail: '/p2.png',
  },
  {
    title: 'Rogue',
    link: 'https://userogue.com',
    thumbnail: '/p3.png',
  },

  {
    title: 'Editorially',
    link: 'https://editorially.org',
    thumbnail: '/p4.png',
  },
  {
    title: 'Editrix AI',
    link: 'https://editrix.ai',
    thumbnail: '/p5.png',
  },
  {
    title: 'Pixel Perfect',
    link: 'https://app.pixelperfect.quest',
    thumbnail: '/p6.png',
  },

  {
    title: 'Algochurn',
    link: 'https://algochurn.com',
    thumbnail: '/p1.png',
  },
  {
    title: 'Aceternity UI',
    link: 'https://ui.aceternity.com',
    thumbnail: '/p2.png',
  },
  {
    title: 'Tailwind Master Kit',
    link: 'https://tailwindmasterkit.com',
    thumbnail: '/p3.png',
  },
  {
    title: 'SmartBridge',
    link: 'https://smartbridgetech.com',
    thumbnail: '/p4.png',
  },
  {
    title: 'Renderwork Studio',
    link: 'https://renderwork.studio',
    thumbnail: '/p5.png',
  },

  {
    title: 'Creme Digital',
    link: 'https://cremedigital.com',
    thumbnail: '/p6.png',
  },
  {
    title: 'Golden Bells Academy',
    link: 'https://goldenbellsacademy.com',
    thumbnail: '/p1.png',
  },
  {
    title: 'Invoker Labs',
    link: 'https://invoker.lol',
    thumbnail: '/p2.png',
  },
  {
    title: 'E Free Invoice',
    link: 'https://efreeinvoice.com',
    thumbnail: '/p3.png',
  },
]

export const menuOptions = [
  { name: 'Dashboard', Component: Home, href: '/dashboard' },
  { name: 'Workflows', Component: Workflows, href: '/workflows' },
  { name: 'Settings', Component: Settings, href: '/settings' },
  { name: 'Connections', Component: Category, href: '/connections' },
  { name: 'Billing', Component: Payment, href: '/billing' },
  { name: 'Templates', Component: Templates, href: '/templates' },
  { name: 'Logs', Component: Logs, href: '/logs' },
]

export const EditorCanvasDefaultCardTypes = {
  Email: { description: 'Send and email to a user', type: 'Action' },
  Condition: {
    description: 'Boolean operator that creates different conditions lanes.',
    type: 'Action',
  },
  AI: {
    description:
      'Use the power of AI to summarize, respond, create and much more.',
    type: 'Action',
  },
  Slack: { description: 'Send a notification to slack', type: 'Action' },
  'Google Drive': {
    description:
      'Connect with Google drive to trigger actions or to create files and folders.',
    type: 'Trigger',
  },
  Notion: { description: 'Create entries directly in notion.', type: 'Action' },
  'Custom Webhook': {
    description:
      'Connect any app that has an API key and send data to your applicaiton.',
    type: 'Action',
  },
  Discord: {
    description: 'Post messages to your discord server',
    type: 'Action',
  },
  'Google Calendar': {
    description: 'Create a calendar invite.',
    type: 'Action',
  },
  Trigger: {
    description: 'An event that starts the workflow.',
    type: 'Trigger',
  },
  Action: {
    description: 'An event that happens after the workflow begins',
    type: 'Action',
  },
  Wait: {
    description: 'Delay the next action step by using the wait timer.',
    type: 'Action',
  },
}

export const CONNECTIONS: Connection[] = [
  // Google Services
  {
    title: 'Google Drive',
    description: 'Connect your Google Drive to listen to folder changes',
    image: '/googleDrive.png',
    connectionKey: 'googleNode',
    alwaysTrue: true,
  },
  {
    title: 'Gmail',
    description: 'Send and receive emails, automate email workflows',
    image: '/gmail.png',
    connectionKey: 'googleNode',
  },
  {
    title: 'Google Sheets',
    description: 'Read, write and update spreadsheet data',
    image: '/googleSheets.png',
    connectionKey: 'googleNode',
  },
  {
    title: 'Google Calendar',
    description: 'Create and manage calendar events',
    image: '/googleCalendar.png',
    connectionKey: 'googleNode',
  },
  // Communication
  {
    title: 'Discord',
    description: 'Send notifications and messages to Discord',
    image: '/discord.png',
    connectionKey: 'discordNode',
    accessTokenKey: 'webhookURL',
  },
  {
    title: 'Slack',
    description: 'Send notifications to team members through Slack',
    image: '/slack.png',
    connectionKey: 'slackNode',
    accessTokenKey: 'slackAccessToken',
    slackSpecial: true,
  },
  {
    title: 'Microsoft Teams',
    description: 'Send messages and notifications to Teams channels',
    image: '/teams.png',
    connectionKey: 'slackNode',
  },
  {
    title: 'Telegram',
    description: 'Send messages via Telegram Bot API',
    image: '/telegram.png',
    connectionKey: 'discordNode',
  },
  {
    title: 'WhatsApp',
    description: 'Send WhatsApp messages through Business API',
    image: '/whatsapp.png',
    connectionKey: 'discordNode',
  },
  // Productivity
  {
    title: 'Notion',
    description: 'Create entries in your Notion dashboard',
    image: '/notion.png',
    connectionKey: 'notionNode',
    accessTokenKey: 'accessToken',
  },
  {
    title: 'Airtable',
    description: 'Manage Airtable bases, tables and records',
    image: '/airtable.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Trello',
    description: 'Create and manage Trello boards and cards',
    image: '/trello.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Asana',
    description: 'Manage Asana projects and tasks',
    image: '/asana.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Jira',
    description: 'Create and update Jira issues and projects',
    image: '/jira.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Linear',
    description: 'Manage Linear issues and projects',
    image: '/linear.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Monday.com',
    description: 'Manage Monday.com boards and items',
    image: '/monday.png',
    connectionKey: 'notionNode',
  },
  // Development
  {
    title: 'GitHub',
    description: 'Manage repositories, issues, and pull requests',
    image: '/github.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'GitLab',
    description: 'Manage GitLab projects and pipelines',
    image: '/gitlab.png',
    connectionKey: 'notionNode',
  },
  // AI Services
  {
    title: 'OpenAI',
    description: 'Use GPT models for text generation and analysis',
    image: '/openai.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Anthropic',
    description: 'Use Claude AI for advanced text processing',
    image: '/anthropic.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Google Gemini',
    description: 'Use Google\'s advanced multimodal AI models',
    image: '/gemini.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Ollama',
    description: 'Run open-source LLMs locally on your machine',
    image: '/ollama.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Groq',
    description: 'Ultra-fast AI inference for real-time applications',
    image: '/groq.png',
    connectionKey: 'notionNode',
  },
  // CRM & Marketing
  {
    title: 'Salesforce',
    description: 'Manage Salesforce leads, contacts and opportunities',
    image: '/salesforce.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'HubSpot',
    description: 'Manage HubSpot CRM contacts and deals',
    image: '/hubspot.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Mailchimp',
    description: 'Manage email campaigns and subscribers',
    image: '/mailchimp.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'SendGrid',
    description: 'Send transactional and marketing emails',
    image: '/sendgrid.png',
    connectionKey: 'notionNode',
  },
  // E-commerce & Payments
  {
    title: 'Stripe',
    description: 'Process payments and manage subscriptions',
    image: '/stripe.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'PayPal',
    description: 'Process PayPal payments and transactions',
    image: '/paypal.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Shopify',
    description: 'Manage Shopify store orders and products',
    image: '/shopify.png',
    connectionKey: 'notionNode',
  },
  // Social Media
  {
    title: 'Twitter',
    description: 'Post tweets and monitor Twitter activity',
    image: '/twitter.png',
    connectionKey: 'discordNode',
  },
  {
    title: 'LinkedIn',
    description: 'Post updates and manage LinkedIn presence',
    image: '/linkedin.png',
    connectionKey: 'discordNode',
  },
  {
    title: 'Facebook',
    description: 'Manage Facebook pages and posts',
    image: '/facebook.png',
    connectionKey: 'discordNode',
  },
  {
    title: 'Instagram',
    description: 'Post content and manage Instagram account',
    image: '/instagram.png',
    connectionKey: 'discordNode',
  },
  // Cloud Storage
  {
    title: 'Dropbox',
    description: 'Manage files and folders in Dropbox',
    image: '/dropbox.png',
    connectionKey: 'googleNode',
  },
  {
    title: 'OneDrive',
    description: 'Manage files in Microsoft OneDrive',
    image: '/onedrive.png',
    connectionKey: 'googleNode',
  },
  {
    title: 'AWS S3',
    description: 'Store and retrieve files from S3 buckets',
    image: '/aws.png',
    connectionKey: 'googleNode',
  },
  // Databases
  {
    title: 'PostgreSQL',
    description: 'Query and update PostgreSQL databases',
    image: '/postgresql.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'MySQL',
    description: 'Query and update MySQL databases',
    image: '/mysql.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'MongoDB',
    description: 'Manage MongoDB collections and documents',
    image: '/mongodb.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Supabase',
    description: 'Interact with Supabase database and auth',
    image: '/supabase.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Firebase',
    description: 'Manage Firebase Firestore and Realtime DB',
    image: '/firebase.png',
    connectionKey: 'notionNode',
  },
  // Meetings & Scheduling
  {
    title: 'Zoom',
    description: 'Create and manage Zoom meetings',
    image: '/zoom.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Calendly',
    description: 'Manage Calendly events and scheduling',
    image: '/calendly.png',
    connectionKey: 'notionNode',
  },
  // Forms
  {
    title: 'Typeform',
    description: 'Collect and process Typeform responses',
    image: '/typeform.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'Google Forms',
    description: 'Collect and process form responses',
    image: '/googleForms.png',
    connectionKey: 'googleNode',
  },
  // Communication
  {
    title: 'Twilio',
    description: 'Send SMS and make voice calls',
    image: '/twilio.png',
    connectionKey: 'discordNode',
  },
  // Developer Tools
  {
    title: 'Webhook',
    description: 'Receive data from any webhook source',
    image: '/webhook.png',
    connectionKey: 'notionNode',
  },
  {
    title: 'HTTP Request',
    description: 'Make HTTP requests to any API',
    image: '/http.png',
    connectionKey: 'notionNode',
  },
]
