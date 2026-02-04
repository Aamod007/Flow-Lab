import { create } from 'zustand'

export interface Option {
  value: string
  label: string
  disable?: boolean
  /** fixed option that can't be removed. */
  fixed?: boolean
  /** Group the options by providing key. */
  [key: string]: string | boolean | undefined
}

// Google Drive file interface
export interface GoogleFile {
  id?: string
  name?: string
  mimeType?: string
  webViewLink?: string
  iconLink?: string
  thumbnailLink?: string
  [key: string]: unknown
}

// Workflow Editor Types
export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  type?: string
}

export interface WorkflowEditorState {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNode: WorkflowNode | null
  isExecuting: boolean
}

export interface WorkflowEditorActions {
  setNodes: (nodes: WorkflowNode[]) => void
  setEdges: (edges: WorkflowEdge[]) => void
  addNode: (node: WorkflowNode) => void
  removeNode: (nodeId: string) => void
  selectNode: (node: WorkflowNode | null) => void
  setExecuting: (executing: boolean) => void
}

export type WorkflowEditorStore = WorkflowEditorState & WorkflowEditorActions

// User Profile Types
export interface UserProfile {
  clerkId: string
  email: string
  name: string | null
  profileImage: string | null
  tier: 'Free' | 'Pro' | 'Unlimited'
  credits: number
}

export interface UserState {
  user: UserProfile | null
  loading: boolean
}

export interface UserActions {
  setUser: (user: UserProfile | null) => void
  updateCredits: (credits: number) => void
  setLoading: (loading: boolean) => void
}

export type UserStore = UserState & UserActions

// FlowLab Store State and Actions
interface FlowLabState {
  googleFile: GoogleFile
  slackChannels: Option[]
  selectedSlackChannels: Option[]
  logs: string[]
}

interface FlowLabActions {
  setGoogleFile: (googleFile: GoogleFile) => void
  setSlackChannels: (slackChannels: Option[]) => void
  setSelectedSlackChannels: (selectedSlackChannels: Option[]) => void
  setLogs: (logs: string[]) => void
}

type FlowLabStore = FlowLabState & FlowLabActions

export const useFlowLabStore = create<FlowLabStore>()((set) => ({
  googleFile: {},
  setGoogleFile: (googleFile: GoogleFile) => set({ googleFile }),
  slackChannels: [],
  setSlackChannels: (slackChannels: Option[]) => set({ slackChannels }),
  selectedSlackChannels: [],
  setSelectedSlackChannels: (selectedSlackChannels: Option[]) =>
    set({ selectedSlackChannels }),
  logs: [],
  setLogs: (logs: string[]) => set({ logs }),
}))


