'use server'

import { currentUser } from '@clerk/nextjs'
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
    const user = await currentUser()
    if (!user) return { success: false, message: 'Unauthorized' }

    try {
        const allKeys = await readKeysFromFile()
        // Initialize user object if not exists
        const userKeys = allKeys[user.id] ? JSON.parse(allKeys[user.id]) : {}

        userKeys[provider] = key
        // Store back as stringified JSON because our flat file structure is simpler as Record<UserId, StringifiedKeys>
        // Or we can just do a nested object. Let's do Record<UserId, Record<Provider, Key>> directly.

        // Re-read strategy:
        // readKeysFromFile returns the whole JSON.
        // Let's coerce it to Record<string, any>
        const dbData: any = await readKeysFromFile()

        if (!dbData[user.id]) dbData[user.id] = {}
        dbData[user.id][provider] = key

        await writeKeysToFile(dbData)

        return { success: true, message: 'API Key Saved' }
    } catch (error) {
        console.error(error)
        return { success: false, message: 'Failed to save API Key' }
    }
}

export async function getAPIKeys() {
    const user = await currentUser()
    if (!user) return {}

    try {
        const dbData: any = await readKeysFromFile()
        return dbData[user.id] || {}
    } catch (error) {
        return {}
    }
}
