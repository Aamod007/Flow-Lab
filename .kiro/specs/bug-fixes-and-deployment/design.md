# Design Document: Bug Fixes and Vercel Deployment

## Overview

This design addresses 32 critical bugs across security, error handling, TypeScript type safety, React hooks, database schema, and API validation. Additionally, it prepares the Next.js application for production deployment on Vercel. The fixes are organized into logical groups that can be implemented incrementally while maintaining application functionality.

The application is a workflow automation platform built with Next.js 14 (App Router), TypeScript, Prisma ORM with PostgreSQL, Clerk authentication, Stripe payments, and integrations with Google Drive, Discord, Notion, and Slack. It uses Zustand for state management, React Hook Form with Zod for validation, and is deployed on Vercel.

## Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Frontend   │  │  API Routes  │  │   Webhooks   │     │
│  │  Components  │  │  (Validated) │  │  (Hardened)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                  ┌─────────▼─────────┐                     │
│                  │  Error Handling   │                     │
│                  │  & Validation     │                     │
│                  └─────────┬─────────┘                     │
│                            │                                │
│                  ┌─────────▼─────────┐                     │
│                  │  Prisma Client    │                     │
│                  │  (Type-Safe)      │                     │
│                  └─────────┬─────────┘                     │
└────────────────────────────┼─────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │    Database     │
                    └─────────────────┘
```

### Fix Categories

1. **Security Layer**: Environment variable validation, secret handling, error sanitization
2. **Error Handling Layer**: Try-catch blocks, error boundaries, standardized responses
3. **Type Safety Layer**: TypeScript interfaces, type annotations, generic types
4. **React Layer**: Hook dependencies, cleanup functions, error boundaries
5. **Database Layer**: Schema consistency, foreign keys, type corrections
6. **Validation Layer**: Zod schemas for all API inputs
7. **Deployment Layer**: Vercel configuration, environment setup, health checks

## Components and Interfaces

### 1. Environment Variable Validator

**Purpose**: Validate required environment variables on application startup

**Interface**:
```typescript
interface EnvironmentConfig {
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  
  // Database
  DATABASE_URL: string;
  
  // Stripe
  STRIPE_SECRET: string;
  
  // Application URLs
  NEXT_PUBLIC_URL: string;
  NEXT_PUBLIC_DOMAIN: string;
  NEXT_PUBLIC_SCHEME: string;
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  NOTION_API_SECRET: string;
  NOTION_CLIENT_ID: string;
  SLACK_CLIENT_ID: string;
  SLACK_CLIENT_SECRET: string;
  SLACK_SIGNING_SECRET: string;
}

interface ValidationResult {
  valid: boolean;
  missing: string[];
  errors: string[];
}

function validateEnvironment(): ValidationResult;
function getRequiredEnvVar(key: string): string;
function getOptionalEnvVar(key: string, defaultValue?: string): string | undefined;
```

**Implementation Strategy**:
- Create `src/lib/env-validator.ts` module
- Export validation function called in root layout or middleware
- Throw descriptive errors for missing required variables
- Log warnings for missing optional variables

### 2. Standardized Error Response

**Purpose**: Provide consistent error responses across all API routes

**Interface**:
```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  status: number;
}

interface ApiSuccess<T> {
  data: T;
  status: number;
}

class ApiErrorHandler {
  static badRequest(message: string, details?: unknown): Response;
  static unauthorized(message: string): Response;
  static forbidden(message: string): Response;
  static notFound(message: string): Response;
  static internalError(message: string): Response;
  static validationError(errors: ZodError): Response;
}

function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response;

function createSuccessResponse<T>(data: T, status?: number): Response;
```

**Implementation Strategy**:
- Create `src/lib/api-response.ts` module
- Use in all API route handlers
- Never expose stack traces in production
- Log full errors server-side for debugging

### 3. API Input Validation Schemas

**Purpose**: Validate all API route inputs using Zod

**Interface**:
```typescript
// Payment route validation
const PaymentRequestSchema = z.object({
  tier: z.enum(['Free', 'Pro', 'Unlimited']),
  userId: z.string().min(1),
});

// Drive route validation
const DriveQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
});

// Webhook validation
const ClerkWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    email_addresses: z.array(z.object({
      email_address: z.string().email(),
    })),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    image_url: z.string().optional(),
  }),
});

// Connection test validation
const ConnectionTestSchema = z.object({
  provider: z.enum(['discord', 'notion', 'slack', 'google']),
  connectionId: z.string().uuid(),
});

function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ZodError };
```

**Implementation Strategy**:
- Create `src/lib/validation-schemas.ts` module
- Define schemas for each API route
- Validate before processing in route handlers
- Return 400 with validation errors on failure

### 4. Type-Safe Store Definitions

**Purpose**: Replace `any` types in Zustand stores with proper interfaces

**Interface**:
```typescript
// Workflow Editor Store
interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

interface WorkflowEditorState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNode: WorkflowNode | null;
  isExecuting: boolean;
}

interface WorkflowEditorActions {
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (node: WorkflowNode) => void;
  removeNode: (nodeId: string) => void;
  selectNode: (node: WorkflowNode | null) => void;
  setExecuting: (executing: boolean) => void;
}

type WorkflowEditorStore = WorkflowEditorState & WorkflowEditorActions;

// User Store
interface UserProfile {
  clerkId: string;
  email: string;
  name: string | null;
  profileImage: string | null;
  tier: 'Free' | 'Pro' | 'Unlimited';
  credits: number;
}

interface UserState {
  user: UserProfile | null;
  loading: boolean;
}

interface UserActions {
  setUser: (user: UserProfile | null) => void;
  updateCredits: (credits: number) => void;
  setLoading: (loading: boolean) => void;
}

type UserStore = UserState & UserActions;
```

**Implementation Strategy**:
- Update `src/store.tsx` with proper interfaces
- Remove all `any` types
- Use TypeScript generics for flexible typing
- Export types for use in components

### 5. React Error Boundary

**Purpose**: Catch and handle React component errors gracefully

**Interface**:
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  static getDerivedStateFromError(error: Error): ErrorBoundaryState;
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
  reset(): void;
  render(): React.ReactNode;
}

// Default fallback component
interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

function DefaultErrorFallback({ error, reset }: ErrorFallbackProps): JSX.Element;
```

**Implementation Strategy**:
- Create `src/components/error-boundary.tsx`
- Wrap major page sections and route groups
- Log errors to monitoring service
- Provide reset functionality

### 6. Database Schema Updates

**Purpose**: Fix inconsistencies and type issues in Prisma schema

**Changes Required**:

```prisma
model User {
  id Int @id @default(autoincrement())
  
  clerkId      String  @unique
  name         String?
  email        String  @unique
  profileImage String?
  tier         Tier    @default(Free)  // Changed from String to enum
  credits      Int     @default(10)    // Changed from String to Int
  
  // ... rest of fields
}

enum Tier {
  Free
  Pro
  Unlimited
}

model LocalGoogleCredential {
  // ... fields
  userId String  @unique  // Changed from Int to String
  user   User    @relation(fields: [userId], references: [clerkId], onDelete: Cascade)
}

model DiscordWebhook {
  // ... fields
  user        User          @relation(fields: [userId], references: [clerkId], onDelete: Cascade)
  userId      String
  connections Connections[]
}

model Slack {
  // ... fields
  User        User          @relation(fields: [userId], references: [clerkId], onDelete: Cascade)
  userId      String
  connections Connections[]
}

model Notion {
  // ... fields
  User          User          @relation(fields: [userId], references: [clerkId], onDelete: Cascade)
  userId        String
  connections   Connections[]
}

model Connections {
  id               String          @id @default(uuid())
  type             String
  DiscordWebhook   DiscordWebhook? @relation(fields: [discordWebhookId], references: [id], onDelete: Cascade)
  discordWebhookId String?
  Notion           Notion?         @relation(fields: [notionId], references: [id], onDelete: Cascade)
  notionId         String?
  User             User?           @relation(fields: [userId], references: [clerkId], onDelete: Cascade)
  userId           String?
  Slack            Slack?          @relation(fields: [slackId], references: [id], onDelete: Cascade)
  slackId          String?
}

model Workflows {
  // ... fields
  User              User     @relation(fields: [userId], references: [clerkId], onDelete: Cascade)
  userId            String
  schedules         Schedule[]
  executionLogs     ExecutionLog[]
}

model ApiKey {
  // ... fields
  User      User     @relation(fields: [userId], references: [clerkId], onDelete: Cascade)
  userId    String
  
  @@unique([userId, provider])
}

// Similar updates for other models...
```

**Migration Strategy**:
1. Create migration for tier enum
2. Migrate credits from String to Int (parse existing values)
3. Update foreign key references
4. Add onDelete: Cascade to all relations
5. Test migration on development database
6. Document rollback procedure

### 7. React Hook Fixes

**Purpose**: Fix missing dependencies and memory leaks in hooks

**Common Patterns**:

```typescript
// useEffect with proper dependencies
useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await apiCall(dependency1, dependency2);
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  fetchData();
}, [dependency1, dependency2]); // All dependencies included

// useEffect with cleanup
useEffect(() => {
  const timeoutId = setTimeout(() => {
    doSomething();
  }, 1000);
  
  return () => {
    clearTimeout(timeoutId); // Cleanup on unmount
  };
}, []);

// useCallback with proper dependencies
const handleSubmit = useCallback(
  async (data: FormData) => {
    try {
      await submitForm(data, userId);
    } catch (error) {
      console.error('Submission error:', error);
    }
  },
  [userId] // Include all dependencies
);

// Safe context usage
function useWorkflowContext() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflowContext must be used within WorkflowProvider');
  }
  return context;
}
```

**Files to Fix**:
- `src/hooks/use-execution-stream.ts`: Add missing dependencies
- All components with timeouts: Add cleanup functions
- Form submission handlers: Add error handling
- Context hooks: Add validation

### 8. Vercel Deployment Configuration

**Purpose**: Configure application for production deployment

**vercel.json**:
```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "env": {
    "DATABASE_URL": "@database-url",
    "STRIPE_SECRET": "@stripe-secret"
  },
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

**Environment Variables Setup**:
- Document all required variables
- Create Vercel environment variable guide
- Set up production database connection
- Configure webhook URLs for production

**Build Configuration**:
- Ensure Prisma client generation in build
- Configure TypeScript strict mode
- Set up proper CORS headers
- Configure API route timeouts

### 9. Startup Validation Script

**Purpose**: Validate environment and dependencies on startup

**Interface**:
```typescript
interface StartupCheck {
  name: string;
  check: () => Promise<boolean>;
  critical: boolean;
}

interface StartupResult {
  success: boolean;
  checks: {
    name: string;
    passed: boolean;
    error?: string;
  }[];
}

async function runStartupChecks(): Promise<StartupResult>;
async function checkDatabaseConnection(): Promise<boolean>;
async function checkEnvironmentVariables(): Promise<boolean>;
async function checkExternalServices(): Promise<boolean>;
```

**Checks to Implement**:
1. Environment variables present
2. Database connection successful
3. Prisma client generated
4. External service credentials valid (optional)
5. Required directories exist

## Data Models

### Updated Prisma Types

The database schema changes will generate new TypeScript types:

```typescript
// Generated by Prisma
enum Tier {
  Free = 'Free',
  Pro = 'Pro',
  Unlimited = 'Unlimited'
}

type User = {
  id: number;
  clerkId: string;
  name: string | null;
  email: string;
  profileImage: string | null;
  tier: Tier;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
  // ... relations
};

// Use in application code
function getUserTier(user: User): Tier {
  return user.tier;
}

function updateUserCredits(userId: string, amount: number): Promise<User> {
  return prisma.user.update({
    where: { clerkId: userId },
    data: { credits: { increment: amount } },
  });
}
```

### Form Data Types

```typescript
// Payment form
type PaymentFormData = z.infer<typeof PaymentRequestSchema>;

// Connection form
type ConnectionFormData = z.infer<typeof ConnectionTestSchema>;

// Workflow form
interface WorkflowFormData {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  publish: boolean;
}

const WorkflowFormSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  nodes: z.array(z.custom<WorkflowNode>()),
  edges: z.array(z.custom<WorkflowEdge>()),
  publish: z.boolean(),
});
```

## Error Handling

### Error Handling Strategy

**1. API Route Error Handling**:
```typescript
export async function POST(req: Request) {
  try {
    // Validate input
    const body = await req.json();
    const validation = validateRequest(PaymentRequestSchema, body);
    
    if (!validation.success) {
      return ApiErrorHandler.validationError(validation.error);
    }
    
    // Validate environment
    const stripeSecret = getRequiredEnvVar('STRIPE_SECRET');
    
    // Process request
    const result = await processPayment(validation.data, stripeSecret);
    
    return createSuccessResponse(result);
  } catch (error) {
    // Type-safe error handling
    if (error instanceof Error) {
      console.error('Payment error:', error.message, error.stack);
      return ApiErrorHandler.internalError('Payment processing failed');
    }
    
    console.error('Unknown error:', error);
    return ApiErrorHandler.internalError('An unexpected error occurred');
  }
}
```

**2. Webhook Error Handling**:
```typescript
export async function POST(req: Request) {
  try {
    // Parse and validate
    const rawBody = await req.text();
    let payload;
    
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return createErrorResponse(400, 'INVALID_JSON', 'Invalid JSON payload');
    }
    
    const validation = validateRequest(ClerkWebhookSchema, payload);
    if (!validation.success) {
      return ApiErrorHandler.validationError(validation.error);
    }
    
    // Process webhook
    await handleWebhook(validation.data);
    
    return createSuccessResponse({ received: true });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Webhook error:', error.message);
    }
    return ApiErrorHandler.internalError('Webhook processing failed');
  }
}
```

**3. Component Error Handling**:
```typescript
function WorkflowEditor() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await saveWorkflow(workflowData);
      
      toast.success('Workflow saved successfully');
    } catch (error) {
      const message = error instanceof Error 
        ? error.message 
        : 'Failed to save workflow';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ErrorBoundary>
      <div>
        {error && <ErrorAlert message={error} />}
        {/* Component content */}
      </div>
    </ErrorBoundary>
  );
}
```

### Error Response Format

All API errors follow this structure:

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR" | "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL_ERROR",
    "message": "Human-readable error message",
    "details": {
      // Optional additional context
      // For validation errors: field-level errors
      // Never includes stack traces or sensitive data
    }
  },
  "status": 400 | 401 | 403 | 404 | 500
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Test specific error scenarios (missing env vars, invalid JSON, etc.)
- Test API route responses with known inputs
- Test React component error boundaries
- Test database migration scripts
- Test form validation with specific invalid inputs

**Property-Based Tests**: Verify universal properties across all inputs
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: **Feature: bug-fixes-and-deployment, Property {number}: {property_text}**

### Testing Configuration

**Property-Based Testing Library**: Use `fast-check` for TypeScript/JavaScript property-based testing

```typescript
import fc from 'fast-check';

// Example property test
describe('API Validation', () => {
  it('should validate all payment requests', () => {
    fc.assert(
      fc.property(
        fc.record({
          tier: fc.constantFrom('Free', 'Pro', 'Unlimited'),
          userId: fc.string({ minLength: 1 }),
        }),
        (data) => {
          const result = validateRequest(PaymentRequestSchema, data);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Organization

```
src/
  __tests__/
    unit/
      api/
        payment.test.ts
        webhooks.test.ts
      lib/
        env-validator.test.ts
        api-response.test.ts
      components/
        error-boundary.test.ts
    properties/
      validation.property.test.ts
      error-handling.property.test.ts
      type-safety.property.test.ts
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following testable properties and examples. Many requirements are TypeScript compile-time checks or code structure requirements that cannot be tested at runtime. The testable properties focus on runtime behavior that can be verified through property-based testing or specific examples.

**Redundancy Analysis**:
- Properties 1.3 and 2.4 both relate to error response content - combined into Property 1
- Properties 2.2 and 12.2 both test JSON parsing errors - combined into Property 2
- Properties 6.1, 6.2, and 6.3 all relate to validation - combined into Property 3
- Properties 19.1, 19.2, 19.3, and 19.5 all relate to error response format - combined into Property 1
- Properties 2.3 and 19.5 both test HTTP status codes - combined into Property 1

### Universal Properties

**Property 1: Error Response Safety and Consistency**

*For any* error that occurs in an API route, the error response should:
- Return an appropriate HTTP status code (400, 401, 403, 404, or 500)
- Include a consistent JSON structure with "error" object containing "code" and "message" fields
- NOT expose stack traces or sensitive information in the response body
- Include descriptive error messages without implementation details

**Validates: Requirements 1.3, 2.3, 2.4, 19.1, 19.2, 19.5**

---

**Property 2: JSON Parsing Error Handling**

*For any* invalid JSON string sent to a webhook or API route, the application should:
- Catch the JSON parsing error
- Return a 400 status code
- Include an error message indicating invalid JSON
- NOT crash or expose internal errors

**Validates: Requirements 2.2, 12.2**

---

**Property 3: Input Validation Consistency**

*For any* API route that receives query parameters or request body, the application should:
- Validate the input using a Zod schema before processing
- Return a 400 status code when validation fails
- Include detailed validation errors in the response (field names and error messages)
- Only process data that has passed validation

**Validates: Requirements 6.1, 6.2, 6.3, 19.3**

---

**Property 4: Webhook Payload Validation**

*For any* webhook payload that doesn't match the expected structure, the application should:
- Reject the payload with a 400 status code
- Include validation error details
- NOT process invalid payloads
- Log the validation failure for debugging

**Validates: Requirements 12.5**

---

**Property 5: Workflow Data Validation**

*For any* workflow data parsed from storage, the application should:
- Validate the data structure matches the expected WorkflowNode and WorkflowEdge interfaces
- Reject invalid workflow data
- Provide clear error messages for validation failures
- NOT attempt to process invalid workflow structures

**Validates: Requirements 14.2**

---

**Property 6: Form Data Validation**

*For any* form submission, the application should:
- Validate the form data using the defined Zod schema before submission
- Prevent submission of invalid data
- Display validation errors to the user
- Only submit data that passes validation

**Validates: Requirements 16.5**

---

### Specific Examples and Edge Cases

The following are specific test cases that validate particular scenarios or edge cases:

**Example 1: Missing Stripe Secret Handling**

Test that when the STRIPE_SECRET environment variable is missing, the payment route:
- Returns a 500 status code
- Includes an error message about missing configuration
- Does NOT crash the application
- Logs the missing secret error

**Validates: Requirements 1.4, 11.3**

---

**Example 2: React Error Boundary Fallback**

Test that when a React component throws an error:
- The error boundary catches the error
- A fallback UI is displayed to the user
- The error is logged for debugging
- The rest of the application continues to function

**Validates: Requirements 2.5, 13.2**

---

**Example 3: Component Cleanup on Unmount**

Test that when a component with timeouts/intervals unmounts:
- All active timeouts are cleared
- All active intervals are cleared
- No memory leaks occur
- No errors are thrown after unmount

**Validates: Requirements 4.2**

---

**Example 4: Missing Context Provider Error**

Test that when useContext is called outside its provider:
- A clear error is thrown
- The error message indicates which context is missing
- The error boundary catches the error
- A fallback UI is displayed

**Validates: Requirements 4.4**

---

**Example 5: Null Tier Default Value**

Test that when accessing user tier information where tier is null:
- A default value of "Free" is provided
- The application does NOT crash
- The UI displays the default tier correctly

**Validates: Requirements 7.4**

---

**Example 6: Async Operation Loading State**

Test that when an async operation is in progress:
- A loading indicator is displayed to the user
- User interactions are appropriately disabled or queued
- The loading state is cleared when the operation completes

**Validates: Requirements 8.3**

---

**Example 7: Async Operation Error Display**

Test that when an async operation fails:
- An error message is displayed to the user
- The error message is user-friendly (not technical)
- The user can dismiss or retry the operation
- The application remains functional

**Validates: Requirements 8.5**

---

**Example 8: Database Connection Health Check**

Test that the health check endpoint:
- Returns 200 status when database is connected
- Returns 503 status when database is unreachable
- Includes connection status in the response
- Responds within a reasonable timeout

**Validates: Requirements 9.4, 18.2**

---

**Example 9: Environment Variable Validation on Startup**

Test that the startup validation script:
- Identifies all missing required environment variables
- Logs clear error messages for each missing variable
- Exits with a non-zero code when validation fails
- Allows the application to start when all variables are present

**Validates: Requirements 10.2, 10.3, 18.1, 18.4**

---

**Example 10: Payment URL Construction**

Test that payment URLs:
- Use the NEXT_PUBLIC_URL environment variable
- Do NOT contain hardcoded localhost
- Are properly formatted with scheme and domain
- Work correctly in both development and production

**Validates: Requirements 11.2**

---

**Example 11: Stripe API Error Handling**

Test that when Stripe API calls fail:
- The error is caught and handled gracefully
- An appropriate error response is returned to the client
- The error is logged for debugging
- Sensitive Stripe data is NOT exposed

**Validates: Requirements 11.4**

---

**Example 12: Webhook Signature Validation**

Test that webhook handlers:
- Validate request signatures when applicable (Stripe, Clerk)
- Reject requests with invalid signatures
- Return 401 status for invalid signatures
- Log signature validation failures

**Validates: Requirements 12.1**

---

**Example 13: Webhook Success Response**

Test that when a webhook processes successfully:
- A 200 status code is returned
- An appropriate success response is included
- The webhook data is processed correctly
- No errors are logged

**Validates: Requirements 12.4**

---

**Example 14: Webhook Error Logging**

Test that when a webhook handler encounters an error:
- The error is logged with sufficient context
- A 500 status code is returned
- The error response does NOT expose internal details
- The webhook can be retried

**Validates: Requirements 12.3**

---

**Example 15: Error Boundary Logging**

Test that when an error boundary catches an error:
- The error is logged with component stack trace
- The error includes sufficient debugging information
- Sensitive user data is NOT logged
- The log can be used to reproduce the issue

**Validates: Requirements 13.3**

---

**Example 16: Error Recovery Without Reload**

Test that error boundaries:
- Provide a reset/retry button
- Can recover from errors without full page reload
- Restore the component to a working state
- Clear the error state after successful recovery

**Validates: Requirements 13.4**

---

**Example 17: User-Friendly Error Messages**

Test that error boundaries:
- Display messages in plain language
- Do NOT show technical jargon or stack traces
- Provide actionable guidance when possible
- Maintain the application's visual design

**Validates: Requirements 13.5**

---

**Example 18: Database Migration Foreign Key Consistency**

Test that after running database migrations:
- All foreign key references are valid
- No orphaned records exist
- Cascade deletes work correctly
- Data integrity is maintained

**Validates: Requirements 17.3**

---

**Example 19: Health Check Endpoint**

Test that the health check endpoint:
- Returns 200 status when all systems are operational
- Returns 503 status when critical services are down
- Includes status of database, external services
- Responds quickly (< 5 seconds)

**Validates: Requirements 18.5**

---

### Testing Implementation Notes

**Property-Based Testing**:
- Use `fast-check` library for generating test inputs
- Run minimum 100 iterations per property test
- Tag each test with: `Feature: bug-fixes-and-deployment, Property {number}: {description}`
- Focus on generating diverse inputs (valid, invalid, edge cases)

**Example Testing**:
- Use Jest or Vitest for unit tests
- Mock external services (Stripe, database, etc.)
- Test both success and failure paths
- Verify error messages and status codes

**Integration Testing**:
- Test API routes end-to-end
- Use test database for migration tests
- Test webhook handlers with real payloads
- Verify error boundaries in rendered components

