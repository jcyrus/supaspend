/**
 * Integration tests for ProfileController endpoints
 *
 * These tests require a running Supabase instance and valid test tokens.
 * You may use supertest or any HTTP client to test the endpoints.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('ProfileController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/profile (GET) - should require auth', async () => {
    const res = await request(app.getHttpServer()).get('/profile');
    expect(res.status).toBe(401);
  });

  // Add more tests for authenticated requests as needed
});
