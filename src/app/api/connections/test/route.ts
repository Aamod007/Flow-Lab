import { testNotionConnection, listNotionDatabases } from '@/app/(main)/(pages)/connections/_actions/notion-connection'
import { testSlackConnection, listSlackChannels, sendTestSlackMessage } from '@/app/(main)/(pages)/connections/_actions/slack-connection'
import { ConnectionTestQuerySchema, ConnectionTestBodySchema, validateRequest } from '@/lib/validation-schemas'
import { ApiErrorHandler, createSuccessResponse, logError } from '@/lib/api-response'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const queryValidation = validateRequest(ConnectionTestQuerySchema, {
      provider: searchParams.get('provider'),
      action: searchParams.get('action') || 'test',
    })
    
    if (!queryValidation.success) {
      return ApiErrorHandler.validationError(queryValidation.error)
    }
    
    const { provider, action } = queryValidation.data

    if (provider === 'notion') {
      if (action === 'test') {
        const result = await testNotionConnection()
        return createSuccessResponse(result)
      } else if (action === 'databases') {
        const result = await listNotionDatabases()
        return createSuccessResponse(result)
      }
    }

    if (provider === 'slack') {
      if (action === 'test') {
        const result = await testSlackConnection()
        return createSuccessResponse(result)
      } else if (action === 'channels') {
        const result = await listSlackChannels()
        return createSuccessResponse(result)
      }
    }

    return ApiErrorHandler.badRequest('Unknown provider or action')
  } catch (error) {
    logError('Connection Test GET', error, {
      url: request.url,
    })
    return ApiErrorHandler.internalError('Connection test failed')
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const queryValidation = validateRequest(ConnectionTestQuerySchema, {
      provider: searchParams.get('provider'),
      action: searchParams.get('action'),
    })
    
    if (!queryValidation.success) {
      return ApiErrorHandler.validationError(queryValidation.error)
    }
    
    const { provider, action } = queryValidation.data

    // Parse and validate request body
    let body;
    try {
      body = await request.json()
    } catch (parseError) {
      return ApiErrorHandler.invalidJson()
    }
    
    const bodyValidation = validateRequest(ConnectionTestBodySchema, body)
    
    if (!bodyValidation.success) {
      return ApiErrorHandler.validationError(bodyValidation.error)
    }

    if (provider === 'slack' && action === 'send') {
      if (!bodyValidation.data.channelId || !bodyValidation.data.message) {
        return ApiErrorHandler.badRequest('channelId and message are required')
      }
      
      const result = await sendTestSlackMessage(
        bodyValidation.data.channelId,
        bodyValidation.data.message
      )
      return createSuccessResponse(result)
    }

    return ApiErrorHandler.badRequest('Unknown action')
  } catch (error) {
    logError('Connection Test POST', error, {
      url: request.url,
    })
    return ApiErrorHandler.internalError('Connection test failed')
  }
}
