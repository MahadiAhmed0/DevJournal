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

describe('Snippets (e2e)', () => {
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
      email: 'snippets-user1@snippets-test.com',
      user_metadata: { name: 'Snippet User 1' },
    });
    user1Id = mockUser1.id;
    user1Token = generateMockToken();
    mockClient.registerToken(user1Token, mockUser1);

    const mockUser2 = createMockSupabaseUser({
      email: 'snippets-user2@snippets-test.com',
      user_metadata: { name: 'Snippet User 2' },
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
    // Clean up snippets before each test
    await prisma.codeSnippet.deleteMany({
      where: {
        user: {
          email: { contains: '@snippets-test.com' },
        },
      },
    });
    // Clean up entries created for linking tests
    await prisma.entry.deleteMany({
      where: {
        user: {
          email: { contains: '@snippets-test.com' },
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.codeSnippet.deleteMany({
      where: {
        user: {
          email: { contains: '@snippets-test.com' },
        },
      },
    });
    await prisma.entry.deleteMany({
      where: {
        user: {
          email: { contains: '@snippets-test.com' },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: '@snippets-test.com' },
      },
    });
    await app.close();
  });

  describe('POST /snippets - Create snippet', () => {
    it('should create a snippet when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Hello World',
          code: 'console.log("Hello, World!");',
          language: 'javascript',
          isPublic: false,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Hello World');
      expect(response.body.code).toBe('console.log("Hello, World!");');
      expect(response.body.language).toBe('javascript');
      expect(response.body.isPublic).toBe(false);
      expect(response.body.userId).toBe(user1Id);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/snippets')
        .send({
          title: 'Unauthorized Snippet',
          code: 'print("test")',
          language: 'python',
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({})
        .expect(400);
    });

    it('should validate language is supported', async () => {
      const response = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Test',
          code: 'test',
          language: 'invalid-language',
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid programming language');
    });

    it('should create a public snippet', async () => {
      const response = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Public Snippet',
          code: 'public code',
          language: 'typescript',
          isPublic: true,
        })
        .expect(201);

      expect(response.body.isPublic).toBe(true);
    });
  });

  describe('POST /snippets - Link snippet to entry', () => {
    it('should create a snippet linked to own entry', async () => {
      // First create an entry
      const entryResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Test Entry',
          content: 'Entry for snippet linking',
        });

      const entryId = entryResponse.body.id;

      // Create snippet linked to entry
      const response = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Linked Snippet',
          code: 'const linked = true;',
          language: 'javascript',
          entryId: entryId,
        })
        .expect(201);

      expect(response.body.entryId).toBe(entryId);
    });

    it('should NOT allow linking snippet to another user\'s entry', async () => {
      // User1 creates an entry
      const entryResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'User1 Entry',
          content: 'Content',
        });

      const entryId = entryResponse.body.id;

      // User2 tries to link snippet to User1's entry
      await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Malicious Snippet',
          code: 'hacked',
          language: 'javascript',
          entryId: entryId,
        })
        .expect(403);
    });

    it('should return 404 for non-existent entry', async () => {
      await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Orphan Snippet',
          code: 'orphan',
          language: 'javascript',
          entryId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);
    });
  });

  describe('GET /snippets - Public snippets visible to all', () => {
    it('should return only public snippets without authentication', async () => {
      // Create public and private snippets
      await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Public Snippet',
          code: 'public',
          language: 'javascript',
          isPublic: true,
        });

      await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Private Snippet',
          code: 'private',
          language: 'javascript',
          isPublic: false,
        });

      const response = await request(app.getHttpServer())
        .get('/snippets')
        .expect(200);

      expect(response.body.every((s: any) => s.isPublic === true)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Public Snippet');
    });

    it('should include user info with public snippets', async () => {
      await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Public With User',
          code: 'code',
          language: 'python',
          isPublic: true,
        });

      const response = await request(app.getHttpServer())
        .get('/snippets')
        .expect(200);

      expect(response.body[0]).toHaveProperty('user');
      expect(response.body[0].user).toHaveProperty('username');
    });
  });

  describe('GET /snippets/:id - Private snippet visibility', () => {
    it('should return public snippet without authentication', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Public Snippet',
          code: 'public code',
          language: 'typescript',
          isPublic: true,
        });

      const snippetId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/snippets/${snippetId}`)
        .expect(200);

      expect(response.body.id).toBe(snippetId);
      expect(response.body.title).toBe('Public Snippet');
    });

    it('should return private snippet to owner', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Private Snippet',
          code: 'secret code',
          language: 'python',
          isPublic: false,
        });

      const snippetId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.id).toBe(snippetId);
    });

    it('should NOT return private snippet to other users', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Private Snippet',
          code: 'secret',
          language: 'rust',
          isPublic: false,
        });

      const snippetId = createResponse.body.id;

      await request(app.getHttpServer())
        .get(`/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });

    it('should NOT return private snippet without authentication', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Private Snippet',
          code: 'secret',
          language: 'go',
          isPublic: false,
        });

      const snippetId = createResponse.body.id;

      await request(app.getHttpServer())
        .get(`/snippets/${snippetId}`)
        .expect(404);
    });
  });

  describe('GET /snippets?language= - Filter by language', () => {
    beforeEach(async () => {
      // Create snippets with different languages
      await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'TypeScript Snippet',
          code: 'const x: string = "hello";',
          language: 'typescript',
          isPublic: true,
        });

      await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Python Snippet',
          code: 'x = "hello"',
          language: 'python',
          isPublic: true,
        });

      await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Another TypeScript',
          code: 'interface User { name: string }',
          language: 'typescript',
          isPublic: true,
        });
    });

    it('should filter snippets by language', async () => {
      const response = await request(app.getHttpServer())
        .get('/snippets?language=typescript')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every((s: any) => s.language === 'typescript')).toBe(true);
    });

    it('should return empty array for language with no snippets', async () => {
      const response = await request(app.getHttpServer())
        .get('/snippets?language=ruby')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should return all public snippets without language filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/snippets')
        .expect(200);

      expect(response.body).toHaveLength(3);
    });
  });

  describe('GET /snippets/my - Get own snippets', () => {
    it('should return all user snippets including private', async () => {
      await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Public Snippet',
          code: 'public',
          language: 'javascript',
          isPublic: true,
        });

      await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Private Snippet',
          code: 'private',
          language: 'javascript',
          isPublic: false,
        });

      // User2 creates a snippet
      await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'User2 Snippet',
          code: 'user2',
          language: 'python',
          isPublic: true,
        });

      const response = await request(app.getHttpServer())
        .get('/snippets/my')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every((s: any) => s.userId === user1Id)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/snippets/my')
        .expect(401);
    });
  });

  describe('PATCH /snippets/:id - Prevent editing others\' snippets', () => {
    it('should update own snippet', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Original Title',
          code: 'original',
          language: 'javascript',
        });

      const snippetId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Updated Title',
          code: 'updated code',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.code).toBe('updated code');
    });

    it('should NOT allow other users to update', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'User1 Snippet',
          code: 'code',
          language: 'javascript',
        });

      const snippetId = createResponse.body.id;

      await request(app.getHttpServer())
        .patch(`/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ title: 'Hacked!' })
        .expect(403);
    });

    it('should require authentication', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Snippet',
          code: 'code',
          language: 'javascript',
        });

      await request(app.getHttpServer())
        .patch(`/snippets/${createResponse.body.id}`)
        .send({ title: 'Hacked!' })
        .expect(401);
    });
  });

  describe('DELETE /snippets/:id - Prevent deleting others\' snippets', () => {
    it('should delete own snippet', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'To Delete',
          code: 'delete me',
          language: 'javascript',
        });

      const snippetId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Verify deleted
      await request(app.getHttpServer())
        .get(`/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });

    it('should NOT allow other users to delete', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'User1 Snippet',
          code: 'code',
          language: 'javascript',
        });

      const snippetId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      // Verify still exists
      const getResponse = await request(app.getHttpServer())
        .get(`/snippets/${snippetId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(getResponse.body.id).toBe(snippetId);
    });

    it('should require authentication', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/snippets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Snippet',
          code: 'code',
          language: 'javascript',
        });

      await request(app.getHttpServer())
        .delete(`/snippets/${createResponse.body.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent snippet', async () => {
      await request(app.getHttpServer())
        .delete('/snippets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });
  });
});
