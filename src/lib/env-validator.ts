/**
 * Environment Variable Validator
 * Validates required environment variables on application startup
 */

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  errors: string[];
}

/**
 * List of required environment variables
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'DATABASE_URL',
  'STRIPE_SECRET',
  'NEXT_PUBLIC_URL',
] as const;

/**
 * List of optional environment variables with their defaults
 */
const OPTIONAL_ENV_VARS = {
  GOOGLE_CLIENT_ID: undefined,
  GOOGLE_CLIENT_SECRET: undefined,
  OAUTH2_REDIRECT_URI: undefined,
  DISCORD_CLIENT_ID: undefined,
  DISCORD_CLIENT_SECRET: undefined,
  NOTION_API_SECRET: undefined,
  NOTION_CLIENT_ID: undefined,
  SLACK_CLIENT_ID: undefined,
  SLACK_CLIENT_SECRET: undefined,
  SLACK_SIGNING_SECRET: undefined,
} as const;

/**
 * Validates all required environment variables
 * @returns ValidationResult with status and any missing/error variables
 */
export function validateEnvironment(): ValidationResult {
  const missing: string[] = [];
  const errors: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    errors,
  };
}

/**
 * Gets a required environment variable or throws an error
 * @param key - The environment variable name
 * @returns The environment variable value
 * @throws Error if the variable is missing or empty
 */
export function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please set this variable in your .env file or deployment environment.`
    );
  }
  
  return value;
}

/**
 * Gets an optional environment variable with a default value
 * @param key - The environment variable name
 * @param defaultValue - The default value if the variable is not set
 * @returns The environment variable value or the default
 */
export function getOptionalEnvVar(
  key: string,
  defaultValue?: string
): string | undefined {
  const value = process.env[key];
  
  if (!value || value.trim() === '') {
    return defaultValue;
  }
  
  return value;
}

/**
 * Logs validation results to console
 * @param result - The validation result to log
 */
export function logValidationResult(result: ValidationResult): void {
  if (result.valid) {
    console.log('✅ Environment validation passed');
    return;
  }

  console.error('❌ Environment validation failed:');
  result.errors.forEach((error) => {
    console.error(`  - ${error}`);
  });
  
  console.error('\nPlease check your .env file or deployment environment variables.');
}
