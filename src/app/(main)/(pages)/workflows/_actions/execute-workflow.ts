'use server'


import { testAIAgent } from './ai-actions'
import { onCreateNewPageInDatabase } from '@/app/(main)/(pages)/connections/_actions/notion-connection'
import { postMessageToSlack } from '@/app/(main)/(pages)/connections/_actions/slack-connection'

export const onExecuteWorkflow = async (
    nodesStr: string, 
    edgesStr: string, 
    selectedSlackChannels?: { label: string; value: string }[],
    userInput?: string
): Promise<{ success: boolean; message: string; logs: string[] }> => {
    const logs: string[] = []
    logs.push(`Starting execution...`)

    try {
        // 1. Parse Workflow Data from arguments (Bypass DB)
        const nodes = JSON.parse(nodesStr)
        const edges = JSON.parse(edgesStr)

        logs.push(`Loaded ${nodes.length} nodes and ${edges.length} edges`)

        // 2. Find Starting Node (Trigger or First Node)
        // In our templates, the first node is often the trigger.
        // For "Slack to Notion", looking for a node with no incoming edges or type 'Trigger'/'Slack'

        // Simple topological sort / traversal
        // Find node with no incoming edges
        const targetIds = new Set(edges.map((e: any) => e.target))
        const startNode = nodes.find((n: any) => !targetIds.has(n.id))

        if (!startNode) {
            throw new Error('Could not determine start node (circular dependency?)')
        }

        logs.push(`Starting at node: ${startNode.data.title} (${startNode.type})`)

        let currentNode = startNode
        // Use user-provided input or a default placeholder
        let currentInput = { content: userInput || '' }
        let steps = 0

        // If no user input provided, show a helpful message
        if (!userInput || userInput.trim() === '') {
            logs.push(`⚠️ No input provided - using empty input. Provide input when running the workflow for real data.`)
        } else {
            logs.push(`📥 Input received: "${userInput.substring(0, 100)}${userInput.length > 100 ? '...' : ''}"`)
        }

        while (currentNode && steps < 20) { // Safety limit
            steps++
            logs.push(`Executing Node: ${currentNode.data.type}`)

            const metadata = currentNode.data.metadata || {}
            let output = null

            switch (currentNode.data.type) {
                case 'Slack':
                    // If it's a trigger (first node), we just pass the mock input
                    if (steps === 1) {
                        logs.push(`- Simulating Slack Message: "${currentInput.content}"`)
                        output = currentInput.content
                    } else {
                        // If it's an action, we send the message (output from previous node)
                        // Use the passed selectedSlackChannels first, then fall back to node metadata
                        const channelFromMetadata = metadata.channelId || metadata.channel?.value || metadata.selectedChannel?.value
                        const channelsToUse = selectedSlackChannels && selectedSlackChannels.length > 0
                            ? selectedSlackChannels
                            : (channelFromMetadata ? [{ label: 'Channel', value: channelFromMetadata }] : [])

                        const messageContent = typeof currentInput === 'string' ? currentInput : JSON.stringify(currentInput)

                        logs.push(`- Attempting to send Slack message to ${channelsToUse.length} channel(s): ${channelsToUse.map(c => c.value).join(', ')}`)
                        logs.push(`- Message content: "${messageContent?.substring(0, 100)}..."`)

                        if (channelsToUse.length > 0 && messageContent) {
                            try {
                                const slackResult = await postMessageToSlack(
                                    undefined,
                                    channelsToUse,
                                    messageContent
                                )
                                logs.push(`- Slack API Result: ${slackResult.message}`)
                                output = messageContent
                            } catch (slackError) {
                                const errorMessage = slackError instanceof Error ? slackError.message : 'Unknown error'
                                logs.push(`- Slack Error: ${errorMessage}`)
                                output = currentInput
                            }
                        } else {
                            logs.push(`- Skipped Slack: Missing ${channelsToUse.length === 0 ? 'channel selection (select a channel in the Settings tab)' : 'message content'}`)
                            output = currentInput
                        }
                    }
                    break

                case 'AI':
                    // Run AI Agent
                    // Build AI config with defaults for missing values
                    const provider = metadata.provider || 'Groq'  // Default to Groq (Free)
                    
                    // Get the right default model for the provider
                    const getDefaultModel = (prov: string) => {
                        switch (prov) {
                            case 'Google Gemini': return 'gemini-1.5-flash'
                            case 'OpenAI': return 'gpt-4o-mini'
                            case 'Anthropic': return 'claude-3-haiku-20240307'
                            case 'Groq': return 'llama-3.1-70b-versatile'
                            case 'Ollama': return 'llama3.2'
                            default: return 'llama-3.1-70b-versatile'
                        }
                    }
                    
                    // Check if model is valid for the provider
                    const isModelValidForProvider = (model: string, prov: string): boolean => {
                        const providerModels: Record<string, string[]> = {
                            'Google Gemini': ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-pro'],
                            'OpenAI': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1', 'o1-mini', 'o3-mini'],
                            'Anthropic': ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
                            'Groq': ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'llama-3.3-70b-versatile'],
                            'Ollama': ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'phi3']
                        }
                        const validModels = providerModels[prov] || []
                        return validModels.some(m => model.includes(m) || m.includes(model))
                    }
                    
                    // Use saved model only if it's valid for the provider, otherwise use default
                    const savedModel = metadata.model
                    const model = (savedModel && isModelValidForProvider(savedModel, provider)) 
                        ? savedModel 
                        : getDefaultModel(provider)
                    
                    const aiConfig = {
                        provider,
                        model,
                        prompt: metadata.prompt || '',
                        systemPrompt: metadata.systemPrompt || 'You are a helpful assistant.',
                        temperature: metadata.temperature ?? 0.7,
                        maxTokens: metadata.maxTokens ?? 1000,
                    }

                    // Build/enhance prompt with input content
                    if (typeof currentInput === 'string' && currentInput) {
                        if (aiConfig.prompt) {
                            // Replace {{content}} placeholder if present
                            if (aiConfig.prompt.includes('{{content}}')) {
                                aiConfig.prompt = aiConfig.prompt.replace('{{content}}', currentInput)
                            } else {
                                // Append input to existing prompt
                                aiConfig.prompt = `${aiConfig.prompt}\n\nInput: ${currentInput}`
                            }
                        } else {
                            // No prompt configured - use input as the prompt
                            aiConfig.prompt = `Process the following:\n\n${currentInput}`
                        }
                    }

                    logs.push(`- Running AI (${aiConfig.provider}/${aiConfig.model})...`)

                    if (!aiConfig.prompt) {
                        logs.push(`- Skipped AI (No prompt or input provided)`)
                        output = currentInput
                    } else {
                        try {
                            const aiResponse = await testAIAgent(aiConfig)
                            if (aiResponse.success) {
                                output = aiResponse.data
                                logs.push(`- AI Response: "${output?.substring(0, 50)}..."`)
                            } else {
                                logs.push(`- AI Failed: ${aiResponse.data}`)
                                output = currentInput
                            }
                        } catch (e) {
                            const errorMessage = e instanceof Error ? e.message : 'Unknown error'
                            logs.push(`- AI Error: ${errorMessage}`)
                            output = currentInput
                        }
                    }
                    break

                case 'Notion':
                    // Create Page
                    const dbId = metadata.databaseId || metadata.database?.value
                    if (dbId) {
                        logs.push(`- Creating Notion Page in DB: ${dbId}`)
                        await onCreateNewPageInDatabase(dbId, undefined, String(currentInput))
                        output = 'Notion Page Created'
                    } else {
                        logs.push(`- Skipped Notion (No Database Selected)`)
                        output = currentInput
                    }
                    break

                case 'Trigger':
                    output = currentInput.content
                    break

                default:
                    logs.push(`- Passthrough node type: ${currentNode.data.type}`)
                    output = currentInput
            }

            // Prepare for next step
            currentInput = output

            // Find next node
            const edge = edges.find((e: any) => e.source === currentNode.id)
            if (!edge) {
                break // End of flow
            }
            currentNode = nodes.find((n: any) => n.id === edge.target)
        }

        logs.push('Workflow execution completed successfully')
        return { success: true, message: 'Workflow completed', logs }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        console.error('Workflow Execution Failed:', error)
        logs.push(`Error: ${errorMessage}`)
        return { success: false, message: errorMessage, logs }
    }
}
