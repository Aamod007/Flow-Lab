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

type FlowLabStore = {
  googleFile: any
  setGoogleFile: (googleFile: any) => void
  slackChannels: Option[]
  setSlackChannels: (slackChannels: Option[]) => void
  selectedSlackChannels: Option[]
  setSelectedSlackChannels: (selectedSlackChannels: Option[]) => void
  logs: string[]
  setLogs: (logs: string[]) => void
}

export const useFlowLabStore = create<FlowLabStore>()((set) => ({
  googleFile: {},
  setGoogleFile: (googleFile: any) => set({ googleFile }),
  slackChannels: [],
  setSlackChannels: (slackChannels: Option[]) => set({ slackChannels }),
  selectedSlackChannels: [],
  setSelectedSlackChannels: (selectedSlackChannels: Option[]) =>
    set({ selectedSlackChannels }),
  logs: [] as string[],
  setLogs: (logs: string[]) => set({ logs }),
}))


