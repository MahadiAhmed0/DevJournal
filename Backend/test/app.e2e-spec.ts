import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('App (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same pipes as in main.ts
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

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/ (GET) should return 404 (no root route)', () => {
      return request(app.getHttpServer()).get('/').expect(404);
    });
  });

  describe('Public Endpoints', () => {
    it('/entries (GET) should return public entries', () => {
      return request(app.getHttpServer())
        .get('/entries')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/tags (GET) should return all tags', () => {
      return request(app.getHttpServer())
        .get('/tags')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/snippets (GET) should return public snippets', () => {
      return request(app.getHttpServer())
        .get('/snippets')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Protected Endpoints', () => {
    it('/entries (POST) should require authentication', () => {
      return request(app.getHttpServer())
        .post('/entries')
        .send({ title: 'Test', content: 'Test content' })
        .expect(401);
    });

    it('/entries/my (GET) should require authentication', () => {
      return request(app.getHttpServer()).get('/entries/my').expect(401);
    });

    it('/snippets (POST) should require authentication', () => {
      return request(app.getHttpServer())
        .post('/snippets')
        .send({ title: 'Test', code: 'console.log()', language: 'javascript' })
        .expect(401);
    });

    it('/snippets/my (GET) should require authentication', () => {
      return request(app.getHttpServer()).get('/snippets/my').expect(401);
    });

    it('/users/me (GET) should require authentication', () => {
      return request(app.getHttpServer()).get('/users/me').expect(401);
    });
  });
});
