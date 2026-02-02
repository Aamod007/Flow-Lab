'use server'

import { auth } from '@clerk/nextjs'
import fs from 'fs/promises'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'api-keys.json')

const getAPIKey = async (provider: string): Promise<string | undefined> => {
    try {
        // 1. Try Local File first
        let userId;
        try {
            const session = auth();
            userId = session.userId;
        } catch (e) { /* ignore */ }

        if (userId) {
            const data = await fs.readFile(DB_PATH, 'utf-8')
            const allKeys = JSON.parse(data)

            // Check if user exists in keys
            if (allKeys[userId]) {
                const userKeys = typeof allKeys[userId] === 'string' ? JSON.parse(allKeys[userId]) : allKeys[userId]
                const key = userKeys[provider + '_API_KEY']
                if (key) return key
                // Fallback to checking direct key access if structure differs
                if (userKeys[provider]) return userKeys[provider]
            }
        }
    } catch (error) {
        // file might not exist or parsing error
    }

    // 2. Fallback to Env
    return process.env[`${provider}_API_KEY`]
}

export async function testAIAgent(config: {
    provider: string
    model: string
    prompt: string
    systemPrompt: string
    temperature: number
    maxTokens: number
}) {
    console.log('Testing AI Agent with config:', config)

    try {
        let responseText = ''
        let cost = 0

        if (config.provider === 'OpenAI') {
            const apiKey = await getAPIKey('OPENAI')
            if (!apiKey) throw new Error('OpenAI Key not found (Add in Settings)')

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: config.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
                        { role: 'user', content: config.prompt }
                    ],
                    temperature: config.temperature,
                    max_tokens: config.maxTokens
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error?.message || 'OpenAI API Error')
            responseText = data.choices[0].message.content
            cost = (data.usage?.total_tokens || 0) * 0.000002 // Rough estimate

        } else if (config.provider === 'Google Gemini') {
            const apiKey = await getAPIKey('GOOGLE')
            if (!apiKey) throw new Error('Gemini Key not found (Add in Settings)')

            let model = config.model || 'gemini-2.0-flash'

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `${config.systemPrompt ? 'System: ' + config.systemPrompt + '\n' : ''}User: ${config.prompt}` }]
                    }],
                    generationConfig: {
                        temperature: config.temperature,
                        maxOutputTokens: config.maxTokens
                    }
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error?.message || 'Gemini API Error')
            responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text found'
            // Gemini is free basically, but let's fake it
            cost = 0.0002

        } else if (config.provider === 'Groq') {
            const apiKey = await getAPIKey('GROQ')
            if (!apiKey) throw new Error('Groq Key not found (Add in Settings)')

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: config.model || 'llama3-8b-8192',
                    messages: [
                        { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
                        { role: 'user', content: config.prompt }
                    ],
                    temperature: config.temperature,
                    max_tokens: config.maxTokens
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error?.message || 'Groq API Error')
            responseText = data.choices[0].message.content
            cost = 0 // Groq is free for now

        } else if (config.provider === 'Anthropic') {
            const apiKey = await getAPIKey('ANTHROPIC')
            if (!apiKey) throw new Error('Anthropic Key not found (Add in Settings)')

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: config.model || 'claude-3-opus-20240229',
                    max_tokens: config.maxTokens || 1024,
                    temperature: config.temperature,
                    system: config.systemPrompt,
                    messages: [
                        { role: 'user', content: config.prompt }
                    ]
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error?.message || 'Anthropic API Error')
            responseText = data.content?.[0]?.text || 'No response text found'
            cost = (data.usage?.input_tokens + data.usage?.output_tokens) * 0.000015 // Approx

        } else if (config.provider === 'Ollama') {
            // Assumes Ollama is running locally on default port
            const response = await fetch('http://127.0.0.1:11434/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.model || 'llama3',
                    messages: [
                        { role: 'system', content: config.systemPrompt },
                        { role: 'user', content: config.prompt }
                    ],
                    stream: false,
                    options: {
                        temperature: config.temperature,
                        num_predict: config.maxTokens
                    }
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error('Ollama API Error or Model not found')
            responseText = data.message.content
            cost = 0 // Local is free

        } else {
            // Fallback Mock
            return {
                success: true,
                data: `[Mock Response] Provider ${config.provider} not implemented yet. Config: ${JSON.stringify(config)}`
            }
        }

        return {
            success: true,
            data: responseText,
            cost: cost,
            status: 'completed'
        }

    } catch (error: any) {
        console.error('AI Agent Error:', error)
        return {
            success: false,
            data: error.message,
            status: 'failed'
        }
    }
}
