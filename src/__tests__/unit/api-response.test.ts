/**
 * Unit tests for API Response module
 * These tests verify the basic functionality before running property tests
 */

import { ApiErrorHandler, createErrorResponse, ErrorCodes } from '@/lib/api-response';

describe('API Response Module - Unit Tests', () => {
  describe('ApiErrorHandler.badRequest', () => {
    it('should return 400 status code', async () => {
      const response = ApiErrorHandler.badRequest('Test error');
      expect(response.status).toBe(400);
    });

    it('should include error structure', async () => {
      const response = ApiErrorHandler.badRequest('Test error');
      const body = await response.json();
      
      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('code');
      expect(body.error).toHaveProperty('message');
      expect(body.error.code).toBe(ErrorCodes.BAD_REQUEST);
      expect(body.error.message).toBe('Test error');
    });
  });

  describe('ApiErrorHandler.unauthorized', () => {
    it('should return 401 status code', async () => {
      const response = ApiErrorHandler.unauthorized();
      expect(response.status).toBe(401);
    });
  });

  describe('ApiErrorHandler.forbidden', () => {
    it('should return 403 status code', async () => {
      const response = ApiErrorHandler.forbidden();
      expect(response.status).toBe(403);
    });
  });

  describe('ApiErrorHandler.notFound', () => {
    it('should return 404 status code', async () => {
      const response = ApiErrorHandler.notFound();
      expect(response.status).toBe(404);
    });
  });

  describe('ApiErrorHandler.internalError', () => {
    it('should return 500 status code', async () => {
      const response = ApiErrorHandler.internalError();
      expect(response.status).toBe(500);
    });
  });
});
