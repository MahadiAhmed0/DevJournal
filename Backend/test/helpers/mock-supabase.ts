import { v4 as uuidv4 } from 'uuid';

/**
 * Mock Supabase user generator for testing.
 * Creates fake Supabase user objects that mimic real auth responses.
 */
export interface MockSupabaseUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    full_name?: string;
    display_name?: string;
    username?: string;
  };
  app_metadata: Record<string, unknown>;
  aud: string;
  created_at: string;
}

/**
 * Generate a mock Supabase user for testing
 */
export function createMockSupabaseUser(overrides: Partial<MockSupabaseUser> = {}): MockSupabaseUser {
  const id = overrides.id || uuidv4();
  const email = overrides.email || `test-${id.slice(0, 8)}@example.com`;

  return {
    id,
    email,
    user_metadata: {
      name: `Test User ${id.slice(0, 4)}`,
      ...overrides.user_metadata,
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock Supabase client for testing.
 * Simulates auth.getUser() responses.
 */
export class MockSupabaseClient {
  private validTokens: Map<string, MockSupabaseUser> = new Map();

  /**
   * Register a token as valid with the associated user
   */
  registerToken(token: string, user: MockSupabaseUser): void {
    this.validTokens.set(token, user);
  }

  /**
   * Clear all registered tokens
   */
  clearTokens(): void {
    this.validTokens.clear();
  }

  /**
   * Mock auth object matching Supabase client structure
   */
  auth = {
    getUser: async (token: string) => {
      const user = this.validTokens.get(token);

      if (user) {
        return { data: { user }, error: null };
      }

      return {
        data: { user: null },
        error: { message: 'Invalid token', status: 401 },
      };
    },
  };
}

/**
 * Create a mock SupabaseService for testing
 */
export function createMockSupabaseService() {
  const mockClient = new MockSupabaseClient();

  return {
    client: mockClient,
    getClient: () => mockClient,
  };
}

/**
 * Generate a fake JWT token for testing
 */
export function generateMockToken(): string {
  return `mock-jwt-token-${uuidv4()}`;
}
