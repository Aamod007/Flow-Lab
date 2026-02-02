'use server'
import { google } from 'googleapis'

const DEMO_USER_ID = 'demo-user-123'

export const getFileMetaData = async () => {
  'use server'
  
  // Mock response for demo
  return {
    files: [],
    message: 'Google Drive integration requires authentication'
  }
}
