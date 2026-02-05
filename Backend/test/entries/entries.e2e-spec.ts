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

describe('Entries (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mockSupabaseService: ReturnType<typeof createMockSupabaseService>;
  let mockClient: MockSupabaseClient;

  // Test users
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

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

    // Setup test users
    const mockUser1 = createMockSupabaseUser({
      email: 'entries-user1@entries-test.com',
      user_metadata: { name: 'Entry User 1' },
    });
    user1Id = mockUser1.id;
    user1Token = generateMockToken();
    mockClient.registerToken(user1Token, mockUser1);

    const mockUser2 = createMockSupabaseUser({
      email: 'entries-user2@entries-test.com',
      user_metadata: { name: 'Entry User 2' },
    });
    user2Id = mockUser2.id;
    user2Token = generateMockToken();
    mockClient.registerToken(user2Token, mockUser2);

    // Initialize users by making authenticated requests
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${user1Token}`);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${user2Token}`);
  });

  beforeEach(async () => {
    // Clean up entries before each test
    await prisma.entry.deleteMany({
      where: {
        user: {
          email: { contains: '@entries-test.com' },
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.entry.deleteMany({
      where: {
        user: {
          email: { contains: '@entries-test.com' },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: '@entries-test.com' },
      },
    });
    await app.close();
  });

  describe('POST /entries', () => {
    it('should create an entry when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'My First Entry',
          content: 'This is the content of my first entry.',
          isPublic: false,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('My First Entry');
      expect(response.body.content).toBe('This is the content of my first entry.');
      expect(response.body.isPublic).toBe(false);
      expect(response.body.userId).toBe(user1Id);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/entries')
        .send({
          title: 'Unauthorized Entry',
          content: 'Should not be created',
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({})
        .expect(400);
    });

    it('should create a public entry', async () => {
      const response = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Public Entry',
          content: 'This is visible to everyone.',
          isPublic: true,
        })
        .expect(201);

      expect(response.body.isPublic).toBe(true);
    });
  });

  describe('GET /entries/my', () => {
    it('should return only authenticated user entries', async () => {
      // Create entries for user1
      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'User1 Entry 1', content: 'Content 1' });

      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'User1 Entry 2', content: 'Content 2' });

      // Create entry for user2
      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ title: 'User2 Entry', content: 'Content' });

      // Get user1's entries
      const response = await request(app.getHttpServer())
        .get('/entries/my')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((e: any) => e.userId === user1Id)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/entries/my').expect(401);
    });

    it('should support pagination', async () => {
      // Create multiple entries
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/entries')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({ title: `Entry ${i}`, content: `Content ${i}` });
      }

      const response = await request(app.getHttpServer())
        .get('/entries/my?page=1&limit=2')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(5);
      expect(response.body.totalPages).toBe(3);
    });
  });

  describe('GET /entries/:id', () => {
    it('should return public entry without authentication', async () => {
      // Create public entry
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Public Entry',
          content: 'Public content',
          isPublic: true,
        });

      const entryId = createResponse.body.id;

      // Access without auth
      const response = await request(app.getHttpServer())
        .get(`/entries/${entryId}`)
        .expect(200);

      expect(response.body.id).toBe(entryId);
      expect(response.body.title).toBe('Public Entry');
    });

    it('should return private entry to owner', async () => {
      // Create private entry
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Private Entry',
          content: 'Private content',
          isPublic: false,
        });

      const entryId = createResponse.body.id;

      // Owner can access
      const response = await request(app.getHttpServer())
        .get(`/entries/${entryId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.id).toBe(entryId);
    });

    it('should NOT return private entry to other users', async () => {
      // Create private entry for user1
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Private Entry',
          content: 'Private content',
          isPublic: false,
        });

      const entryId = createResponse.body.id;

      // User2 cannot access
      await request(app.getHttpServer())
        .get(`/entries/${entryId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });

    it('should NOT return private entry without authentication', async () => {
      // Create private entry
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Private Entry',
          content: 'Private content',
          isPublic: false,
        });

      const entryId = createResponse.body.id;

      // Anonymous cannot access
      await request(app.getHttpServer())
        .get(`/entries/${entryId}`)
        .expect(404);
    });

    it('should return 404 for non-existent entry', async () => {
      await request(app.getHttpServer())
        .get('/entries/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('GET /entries (public list)', () => {
    it('should return only public entries', async () => {
      // Create public and private entries
      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Public 1', content: 'Content', isPublic: true });

      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Private 1', content: 'Content', isPublic: false });

      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ title: 'Public 2', content: 'Content', isPublic: true });

      const response = await request(app.getHttpServer())
        .get('/entries')
        .expect(200);

      expect(response.body.data.every((e: any) => e.isPublic === true)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('PATCH /entries/:id', () => {
    it('should update own entry', async () => {
      // Create entry
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Original Title', content: 'Original content' });

      const entryId = createResponse.body.id;

      // Update
      const response = await request(app.getHttpServer())
        .patch(`/entries/${entryId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Updated Title', content: 'Updated content' })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.content).toBe('Updated content');
    });

    it('should NOT allow other users to update', async () => {
      // Create entry for user1
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'User1 Entry', content: 'Content' });

      const entryId = createResponse.body.id;

      // User2 tries to update - should fail
      await request(app.getHttpServer())
        .patch(`/entries/${entryId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ title: 'Hacked!' })
        .expect(403);
    });

    it('should require authentication', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Entry', content: 'Content' });

      await request(app.getHttpServer())
        .patch(`/entries/${createResponse.body.id}`)
        .send({ title: 'Hacked!' })
        .expect(401);
    });

    it('should allow making entry public', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Private Entry', content: 'Content', isPublic: false });

      const response = await request(app.getHttpServer())
        .patch(`/entries/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ isPublic: true })
        .expect(200);

      expect(response.body.isPublic).toBe(true);
    });
  });

  describe('DELETE /entries/:id', () => {
    it('should delete own entry', async () => {
      // Create entry
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'To Delete', content: 'Content' });

      const entryId = createResponse.body.id;

      // Delete
      await request(app.getHttpServer())
        .delete(`/entries/${entryId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Verify deleted
      await request(app.getHttpServer())
        .get(`/entries/${entryId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });

    it('should NOT allow other users to delete', async () => {
      // Create entry for user1
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'User1 Entry', content: 'Content' });

      const entryId = createResponse.body.id;

      // User2 tries to delete - should fail
      await request(app.getHttpServer())
        .delete(`/entries/${entryId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      // Verify still exists
      const getResponse = await request(app.getHttpServer())
        .get(`/entries/${entryId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(getResponse.body.id).toBe(entryId);
    });

    it('should require authentication', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Entry', content: 'Content' });

      await request(app.getHttpServer())
        .delete(`/entries/${createResponse.body.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent entry', async () => {
      await request(app.getHttpServer())
        .delete('/entries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });
  });

  describe('GET /entries/search', () => {
    it('should search public entries by title', async () => {
      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'JavaScript Tutorial', content: 'Learn JS', isPublic: true });

      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Python Guide', content: 'Learn Python', isPublic: true });

      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Private JS', content: 'Secret', isPublic: false });

      const response = await request(app.getHttpServer())
        .get('/entries/search?q=JavaScript')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('JavaScript Tutorial');
    });

    it('should not return private entries in search', async () => {
      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ title: 'Secret Project', content: 'Secret', isPublic: false });

      const response = await request(app.getHttpServer())
        .get('/entries/search?q=Secret')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });
});
