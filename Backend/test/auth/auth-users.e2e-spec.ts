import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SupabaseService } from '../../src/common/supabase/supabase.service';
import {
  createMockSupabaseUser,
  createMockSupabaseService,
  generateMockToken,
  MockSupabaseClient,
} from '../helpers';

describe('Auth & Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mockSupabaseService: ReturnType<typeof createMockSupabaseService>;
  let mockClient: MockSupabaseClient;

  beforeAll(async () => {
    mockSupabaseService = createMockSupabaseService();
    mockClient = mockSupabaseService.client;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    // Clear mock tokens before each test
    mockClient.clearTokens();

    // Clean up test users from database
    await prisma.user.deleteMany({
      where: {
        email: { contains: '@example.com' },
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Auto-Creation (Just-in-Time Provisioning)', () => {
    it('should auto-create Prisma user on first authenticated request', async () => {
      const mockUser = createMockSupabaseUser({
        email: 'newuser@example.com',
        user_metadata: { name: 'New User' },
      });
      const token = generateMockToken();
      mockClient.registerToken(token, mockUser);

      // Verify user doesn't exist yet
      const existingUser = await prisma.user.findUnique({
        where: { id: mockUser.id },
      });
      expect(existingUser).toBeNull();

      // Make authenticated request
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify user was created
      expect(response.body).toHaveProperty('id', mockUser.id);
      expect(response.body).toHaveProperty('email', mockUser.email);
      expect(response.body).toHaveProperty('name', 'New User');
      expect(response.body).toHaveProperty('username');

      // Verify user exists in database
      const createdUser = await prisma.user.findUnique({
        where: { id: mockUser.id },
      });
      expect(createdUser).not.toBeNull();
      expect(createdUser?.email).toBe(mockUser.email);
    });

    it('should return existing user on subsequent requests', async () => {
      const mockUser = createMockSupabaseUser({
        email: 'existinguser@example.com',
      });
      const token = generateMockToken();
      mockClient.registerToken(token, mockUser);

      // First request creates the user
      const firstResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Second request should return the same user
      const secondResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(firstResponse.body.id).toBe(secondResponse.body.id);
      expect(firstResponse.body.username).toBe(secondResponse.body.username);
    });
  });

  describe('GET /users/me', () => {
    it('should return 401 without authorization header', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return user profile with valid token', async () => {
      const mockUser = createMockSupabaseUser({
        email: 'profile@example.com',
        user_metadata: { name: 'Profile User' },
      });
      const token = generateMockToken();
      mockClient.registerToken(token, mockUser);

      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockUser.id,
        email: 'profile@example.com',
        name: 'Profile User',
      });
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });
  });

  describe('PATCH /users/me', () => {
    it('should update user profile', async () => {
      const mockUser = createMockSupabaseUser({
        email: 'update@example.com',
      });
      const token = generateMockToken();
      mockClient.registerToken(token, mockUser);

      // First create the user
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Update the profile
      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          bio: 'This is my bio',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.bio).toBe('This is my bio');
    });

    it('should update username if unique', async () => {
      const mockUser = createMockSupabaseUser({
        email: 'username@example.com',
      });
      const token = generateMockToken();
      mockClient.registerToken(token, mockUser);

      // Create the user
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Update username
      const newUsername = `unique_username_${Date.now()}`;
      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: newUsername })
        .expect(200);

      expect(response.body.username).toBe(newUsername);
    });
  });

  describe('Username Uniqueness', () => {
    it('should enforce username uniqueness on update', async () => {
      // Create first user
      const mockUser1 = createMockSupabaseUser({
        email: 'user1@example.com',
      });
      const token1 = generateMockToken();
      mockClient.registerToken(token1, mockUser1);

      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      // Set a specific username for user1
      const sharedUsername = `shared_username_${Date.now()}`;
      await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${token1}`)
        .send({ username: sharedUsername })
        .expect(200);

      // Create second user
      const mockUser2 = createMockSupabaseUser({
        email: 'user2@example.com',
      });
      const token2 = generateMockToken();
      mockClient.registerToken(token2, mockUser2);

      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      // Try to set the same username for user2 - should fail
      await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${token2}`)
        .send({ username: sharedUsername })
        .expect(409); // Conflict
    });

    it('should generate unique usernames for new users with similar emails', async () => {
      // Create first user
      const mockUser1 = createMockSupabaseUser({
        email: 'testuser@example.com',
      });
      const token1 = generateMockToken();
      mockClient.registerToken(token1, mockUser1);

      const response1 = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      // Create second user with same email prefix (different domain would give same base username)
      const mockUser2 = createMockSupabaseUser({
        email: 'testuser@different.com',
      });
      const token2 = generateMockToken();
      mockClient.registerToken(token2, mockUser2);

      const response2 = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      // Both users should have different usernames
      expect(response1.body.username).not.toBe(response2.body.username);
    });
  });

  describe('GET /users/profile/:username', () => {
    it('should return public profile by username', async () => {
      const mockUser = createMockSupabaseUser({
        email: 'publicprofile@example.com',
        user_metadata: { name: 'Public User' },
      });
      const token = generateMockToken();
      mockClient.registerToken(token, mockUser);

      // Create user and set username
      const createResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const username = createResponse.body.username;

      // Get public profile without auth
      const response = await request(app.getHttpServer())
        .get(`/users/profile/${username}`)
        .expect(200);

      expect(response.body).toHaveProperty('username', username);
      expect(response.body).toHaveProperty('name');
      // Should not expose sensitive data
      expect(response.body).not.toHaveProperty('email');
    });

    it('should return 404 for non-existent username', async () => {
      await request(app.getHttpServer())
        .get('/users/profile/nonexistent_user_12345')
        .expect(404);
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by ID', async () => {
      const mockUser = createMockSupabaseUser({
        email: 'byid@example.com',
      });
      const token = generateMockToken();
      mockClient.registerToken(token, mockUser);

      // Create the user
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Get by ID
      const response = await request(app.getHttpServer())
        .get(`/users/${mockUser.id}`)
        .expect(200);

      expect(response.body.id).toBe(mockUser.id);
    });

    it('should return 404 for non-existent user ID', async () => {
      await request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});

