import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SupabaseService } from '../../src/common/supabase/supabase.service';
import { GeminiService } from '../../src/ai/gemini.service';
import {
  createMockSupabaseUser,
  createMockSupabaseService,
  generateMockToken,
  MockSupabaseClient,
} from '../helpers';

describe('AI Summarization (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mockSupabaseService: ReturnType<typeof createMockSupabaseService>;
  let mockClient: MockSupabaseClient;
  let mockGeminiService: { generateSummary: jest.Mock; isAvailable: jest.Mock };

  // Test users
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  const MOCK_SUMMARY = 'This is a mock AI-generated summary of the entry content.';

  beforeAll(async () => {
    mockSupabaseService = createMockSupabaseService();
    mockClient = mockSupabaseService.client;

    // Create mock Gemini service
    mockGeminiService = {
      generateSummary: jest.fn().mockResolvedValue(MOCK_SUMMARY),
      isAvailable: jest.fn().mockReturnValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .overrideProvider(GeminiService)
      .useValue(mockGeminiService)
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
      email: 'ai-user1@ai-test.com',
      user_metadata: { name: 'AI User 1' },
    });
    user1Id = mockUser1.id;
    user1Token = generateMockToken();
    mockClient.registerToken(user1Token, mockUser1);

    const mockUser2 = createMockSupabaseUser({
      email: 'ai-user2@ai-test.com',
      user_metadata: { name: 'AI User 2' },
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
    // Reset mock calls
    mockGeminiService.generateSummary.mockClear();
    mockGeminiService.generateSummary.mockResolvedValue(MOCK_SUMMARY);

    // Clean up entries before each test
    await prisma.entry.deleteMany({
      where: {
        user: {
          email: { contains: '@ai-test.com' },
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.entry.deleteMany({
      where: {
        user: {
          email: { contains: '@ai-test.com' },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: '@ai-test.com' },
      },
    });
    await app.close();
  });

  describe('POST /entries/:id/summarize', () => {
    it('should generate summary for own entry', async () => {
      // Create an entry
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Test Entry for Summary',
          content: 'This is a long content that needs to be summarized. It contains important information about software development practices and best practices for writing clean code.',
        });

      const entryId = createResponse.body.id;

      // Summarize the entry
      const response = await request(app.getHttpServer())
        .post(`/entries/${entryId}/summarize`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(201);

      // Verify mock was called with the entry content
      expect(mockGeminiService.generateSummary).toHaveBeenCalledTimes(1);
      expect(mockGeminiService.generateSummary).toHaveBeenCalledWith(
        'This is a long content that needs to be summarized. It contains important information about software development practices and best practices for writing clean code.',
      );

      // Verify summary is returned
      expect(response.body.summary).toBe(MOCK_SUMMARY);
    });

    it('should save summary to Entry.summary', async () => {
      // Create an entry
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Entry to Persist Summary',
          content: 'Content that will be summarized and persisted.',
        });

      const entryId = createResponse.body.id;

      // Initially, summary should be null
      expect(createResponse.body.summary).toBeNull();

      // Summarize
      await request(app.getHttpServer())
        .post(`/entries/${entryId}/summarize`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(201);

      // Verify summary is persisted by fetching the entry again
      const getResponse = await request(app.getHttpServer())
        .get(`/entries/${entryId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(getResponse.body.summary).toBe(MOCK_SUMMARY);
    });

    it('should return updated entry with summary', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Summary Response Test',
          content: 'Test content for summary response.',
        });

      const entryId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .post(`/entries/${entryId}/summarize`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(201);

      // Verify full entry is returned with summary
      expect(response.body).toHaveProperty('id', entryId);
      expect(response.body).toHaveProperty('title', 'Summary Response Test');
      expect(response.body).toHaveProperty('content', 'Test content for summary response.');
      expect(response.body).toHaveProperty('summary', MOCK_SUMMARY);
      expect(response.body).toHaveProperty('userId', user1Id);
    });

    it('should NOT allow other users to summarize (403 Forbidden)', async () => {
      // User1 creates an entry
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'User1 Private Entry',
          content: 'This is User1\'s private content.',
          isPublic: false,
        });

      const entryId = createResponse.body.id;

      // User2 tries to summarize User1's entry
      await request(app.getHttpServer())
        .post(`/entries/${entryId}/summarize`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      // Verify Gemini was NOT called
      expect(mockGeminiService.generateSummary).not.toHaveBeenCalled();
    });

    it('should NOT allow summarizing public entry by non-owner (403 Forbidden)', async () => {
      // User1 creates a public entry
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'User1 Public Entry',
          content: 'This is a public entry.',
          isPublic: true,
        });

      const entryId = createResponse.body.id;

      // User2 tries to summarize User1's public entry (should fail)
      await request(app.getHttpServer())
        .post(`/entries/${entryId}/summarize`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(mockGeminiService.generateSummary).not.toHaveBeenCalled();
    });

    it('should require authentication (401 Unauthorized)', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Entry for Unauth Test',
          content: 'Content',
        });

      await request(app.getHttpServer())
        .post(`/entries/${createResponse.body.id}/summarize`)
        .expect(401);
    });

    it('should return 404 for non-existent entry', async () => {
      await request(app.getHttpServer())
        .post('/entries/00000000-0000-0000-0000-000000000000/summarize')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });

    it('should regenerate summary when called again', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Regenerate Summary Test',
          content: 'Content for regeneration test.',
        });

      const entryId = createResponse.body.id;

      // First summarization
      const firstSummary = 'First AI summary.';
      mockGeminiService.generateSummary.mockResolvedValueOnce(firstSummary);

      const firstResponse = await request(app.getHttpServer())
        .post(`/entries/${entryId}/summarize`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(201);

      expect(firstResponse.body.summary).toBe(firstSummary);

      // Second summarization with different summary
      const secondSummary = 'Second AI summary - regenerated.';
      mockGeminiService.generateSummary.mockResolvedValueOnce(secondSummary);

      const secondResponse = await request(app.getHttpServer())
        .post(`/entries/${entryId}/summarize`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(201);

      expect(secondResponse.body.summary).toBe(secondSummary);
      expect(mockGeminiService.generateSummary).toHaveBeenCalledTimes(2);
    });

    it('should handle Gemini API errors gracefully', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Error Test Entry',
          content: 'Content for error test.',
        });

      const entryId = createResponse.body.id;

      // Mock Gemini to throw an error
      mockGeminiService.generateSummary.mockRejectedValueOnce(
        new Error('Failed to generate summary. Please try again later.'),
      );

      // Should return 500 error
      await request(app.getHttpServer())
        .post(`/entries/${entryId}/summarize`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(500);
    });
  });
});
