'use server'

import { auth } from '@clerk/nextjs'
import fs from 'fs/promises'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'api-keys.json')

async function readKeysFromFile(): Promise<Record<string, string>> {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        return {}
    }
}

async function writeKeysToFile(keys: Record<string, string>) {
    await fs.writeFile(DB_PATH, JSON.stringify(keys, null, 2))
}

export async function saveAPIKey(provider: string, key: string) {
    const { userId } = auth()

    if (!userId) return { success: false, message: 'Unauthorized' }

    try {
        const dbData: any = await readKeysFromFile()

        if (!dbData[userId]) dbData[userId] = {}
        dbData[userId][provider] = key

        await writeKeysToFile(dbData)

        return { success: true, message: 'API Key Saved' }
    } catch (error) {
        console.error(error)
        return { success: false, message: 'Failed to save API Key' }
    }
}

export async function getAPIKeys() {
    const { userId } = auth()
    if (!userId) return {}

    try {
        const dbData: any = await readKeysFromFile()
        return dbData[userId] || {}
    } catch (error) {
        return {}
    }
}
