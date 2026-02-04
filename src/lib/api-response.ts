/**
 * Standardized API Error Response Module
 * Provides consistent error handling and response formatting for all API routes
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standard error response structure
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Standard success response structure
 */
export interface ApiSuccess<T = unknown> {
  data: T;
}

/**
 * Error codes for different error types
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  INVALID_JSON: 'INVALID_JSON',
  MISSING_CONFIG: 'MISSING_CONFIG',
} as const;

/**
 * API Error Handler class with static methods for common error types
 */
export class ApiErrorHandler {
  /**
   * Returns a 400 Bad Request response
   */
  static badRequest(message: string, details?: unknown): NextResponse<ApiError> {
    return createErrorResponse(400, ErrorCodes.BAD_REQUEST, message, details);
  }

  /**
   * Returns a 401 Unauthorized response
   */
  static unauthorized(message: string = 'Unauthorized'): NextResponse<ApiError> {
    return createErrorResponse(401, ErrorCodes.UNAUTHORIZED, message);
  }

  /**
   * Returns a 403 Forbidden response
   */
  static forbidden(message: string = 'Forbidden'): NextResponse<ApiError> {
    return createErrorResponse(403, ErrorCodes.FORBIDDEN, message);
  }

  /**
   * Returns a 404 Not Found response
   */
  static notFound(message: string = 'Resource not found'): NextResponse<ApiError> {
    return createErrorResponse(404, ErrorCodes.NOT_FOUND, message);
  }

  /**
   * Returns a 500 Internal Server Error response
   */
  static internalError(message: string = 'Internal server error'): NextResponse<ApiError> {
    return createErrorResponse(500, ErrorCodes.INTERNAL_ERROR, message);
  }

  /**
   * Returns a 400 response with Zod validation errors
   */
  static validationError(error: ZodError): NextResponse<ApiError> {
    const details = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));

    return createErrorResponse(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      details
    );
  }

  /**
   * Returns a 400 response for invalid JSON
   */
  static invalidJson(message: string = 'Invalid JSON payload'): NextResponse<ApiError> {
    return createErrorResponse(400, ErrorCodes.INVALID_JSON, message);
  }

  /**
   * Returns a 500 response for missing configuration
   */
  static missingConfig(message: string): NextResponse<ApiError> {
    return createErrorResponse(500, ErrorCodes.MISSING_CONFIG, message);
  }
}

/**
 * Creates a standardized error response
 * NEVER exposes stack traces or sensitive information
 */
export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown
): NextResponse<ApiError> {
  const errorResponse: ApiError = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };

  return NextResponse.json(errorResponse, { status });
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data }, { status });
}

/**
 * Safely extracts error message from unknown error
 * Prevents exposure of sensitive information
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Logs error with context for debugging
 * Should be called before returning error response
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  console.error(`[${context}] Error:`, {
    message: getErrorMessage(error),
    ...(error instanceof Error && { stack: error.stack }),
    ...additionalInfo,
  });
}
