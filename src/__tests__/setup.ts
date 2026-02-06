/**
 * Jest test setup file
 * This file is loaded before running tests to configure the test environment
 */

// Import jest-dom matchers
import '@testing-library/jest-dom'

// Polyfill Next.js Web APIs for testing
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Polyfill Request and Response for Next.js API routes
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(public url: string, public init?: any) {}
    headers = new Map();
    method = 'GET';
    json = async () => ({});
    text = async () => '';
  } as any;
}

if (typeof global.Response === 'undefined') {
  class ResponsePolyfill {
    constructor(public body?: any, public init?: any) {
      this.status = init?.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
    headers: Map<string, any>;
    status: number;
    ok: boolean;
    
    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return this.body;
    }
    
    async text() {
      if (typeof this.body === 'string') {
        return this.body;
      }
      return JSON.stringify(this.body);
    }
    
    static json(data: any, init?: any) {
      return new ResponsePolyfill(data, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      });
    }
  }
  
  global.Response = ResponsePolyfill as any;
}

// Global test configuration
// Suppress console output in tests unless explicitly testing logging
const originalConsole = global.console;

beforeEach(() => {
  global.console = {
    ...originalConsole,
    error: jest.fn(),
    warn: jest.fn(),
    log: originalConsole.log, // Keep log for debugging
  };
});

afterEach(() => {
  global.console = originalConsole;
});

