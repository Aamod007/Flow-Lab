/**
 * API Input Validation Schemas
 * Zod schemas for validating all API route inputs
 */

import { z } from 'zod';

/**
 * Payment route validation schemas
 */
export const PaymentRequestSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
});

export const PaymentQuerySchema = z.object({
  session_id: z.string().optional(),
});

/**
 * Drive route validation schemas
 */
export const DriveQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
});

/**
 * Clerk webhook validation schema
 */
export const ClerkWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    email_addresses: z.array(
      z.object({
        email_address: z.string().email(),
        id: z.string().optional(),
      })
    ),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    image_url: z.string().url().optional(),
  }),
});

/**
 * Connection test validation schemas
 */
export const ConnectionTestQuerySchema = z.object({
  provider: z.enum(['discord', 'notion', 'slack', 'google']),
  action: z.enum(['test', 'databases', 'channels', 'send']).optional(),
});

export const ConnectionTestBodySchema = z.object({
  channelId: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Workflow validation schemas
 */
export const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.unknown()),
});

export const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
});

export const WorkflowCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  nodes: z.array(WorkflowNodeSchema).optional(),
  edges: z.array(WorkflowEdgeSchema).optional(),
});

export const WorkflowUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  nodes: z.string().optional(), // JSON string
  edges: z.string().optional(), // JSON string
  publish: z.boolean().optional(),
});

/**
 * AI Provider validation schemas
 */
export const ApiKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'ollama']),
  key: z.string().min(1),
});

export const ApiKeyTestSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'ollama']),
});

/**
 * Ollama model validation schemas
 */
export const OllamaModelSchema = z.object({
  name: z.string().min(1),
});

/**
 * Generic validation helper
 * Returns typed result with success/error
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, error: result.error };
}

/**
 * Validates and parses JSON string
 */
export function validateJsonString<T>(
  schema: z.ZodSchema<T>,
  jsonString: string
): { success: true; data: T } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const result = schema.safeParse(parsed);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    return { success: false, error: result.error.message };
  } catch (error) {
    return { success: false, error: 'Invalid JSON string' };
  }
}

/**
 * Execution metrics validation schemas
 * For validating JSON stored in database metrics fields
 */
export const ExecutionMetricsSchema = z.object({
  modelUsage: z.record(z.object({
    provider: z.string().optional(),
    cost: z.number().optional(),
    tokens: z.number().optional(),
  })).optional(),
  costByProvider: z.record(z.number()).optional(),
  avgTokens: z.number().optional(),
  totalCost: z.number().optional(),
}).passthrough(); // Allow additional fields

export const ExecutionEventSchema = z.object({
  type: z.string(),
  timestamp: z.string().optional(),
  data: z.unknown().optional(),
}).passthrough();

export const ExecutionEventsArraySchema = z.array(ExecutionEventSchema);

/**
 * Stripe product metadata validation
 */
export const StripeProductFeaturesSchema = z.array(z.string());

/**
 * Cost analytics response validation schemas
 */
export const CostBreakdownSchema = z.object({
  provider: z.string(),
  cost: z.number(),
  percentage: z.number(),
  executions: z.number(),
});

export const DailyTrendSchema = z.object({
  date: z.string(),
  cost: z.number(),
  executions: z.number(),
});

export const WorkflowCostSchema = z.object({
  workflowId: z.string(),
  workflowName: z.string(),
  totalCost: z.number(),
  executions: z.number(),
  avgCostPerRun: z.number(),
});

export const CostDataSchema = z.object({
  total: z.number(),
  period: z.string(),
  breakdown: z.array(CostBreakdownSchema),
  trend: z.array(DailyTrendSchema),
  topWorkflows: z.array(WorkflowCostSchema),
  executions: z.number(),
  budget: z.object({
    limit: z.number(),
    used: z.number(),
    remaining: z.number(),
    percentage: z.number(),
  }),
});

/**
 * Helper function to safely parse and validate JSON from database
 * Returns null if parsing or validation fails
 */
export function safeParseJson<T>(
  schema: z.ZodSchema<T>,
  jsonString: string | null | undefined
): T | null {
  if (!jsonString) return null;
  
  try {
    const parsed = JSON.parse(jsonString);
    const result = schema.safeParse(parsed);
    
    if (result.success) {
      return result.data;
    }
    
    console.warn('JSON validation failed:', result.error.message);
    return null;
  } catch (error) {
    console.warn('JSON parse error:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Helper function to safely parse JSON from API responses
 * Throws error with descriptive message if parsing or validation fails
 */
export async function safeParseApiResponse<T>(
  schema: z.ZodSchema<T>,
  response: Response
): Promise<T> {
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error('Failed to parse API response as JSON');
  }
  
  const result = schema.safeParse(json);
  
  if (result.success) {
    return result.data;
  }
  
  throw new Error(`API response validation failed: ${result.error.message}`);
}

/**
 * Type exports for use in components
 */
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;
export type DriveQuery = z.infer<typeof DriveQuerySchema>;
export type ClerkWebhook = z.infer<typeof ClerkWebhookSchema>;
export type ConnectionTestQuery = z.infer<typeof ConnectionTestQuerySchema>;
export type ConnectionTestBody = z.infer<typeof ConnectionTestBodySchema>;
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;
export type WorkflowCreate = z.infer<typeof WorkflowCreateSchema>;
export type WorkflowUpdate = z.infer<typeof WorkflowUpdateSchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type OllamaModel = z.infer<typeof OllamaModelSchema>;
export type ExecutionMetrics = z.infer<typeof ExecutionMetricsSchema>;
export type ExecutionEvent = z.infer<typeof ExecutionEventSchema>;
export type CostData = z.infer<typeof CostDataSchema>;
