/**
 * Integration tests for AdminUsersController endpoints
 *
 * These tests require a running Supabase instance and valid admin tokens.
 * You may use supertest or any HTTP client to test the endpoints.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('AdminUsersController (e2e)', () => {
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

  it('/admin/users (POST) - should require admin auth', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/users')
      .send({
        email: 'test@example.com',
        password: 'password',
        username: 'test',
        role: 'user',
        currency: 'USD',
      });
    expect(res.status).toBe(401);
  });

  // Add more tests for authenticated requests as needed
});
