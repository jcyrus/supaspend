import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { RegisterDto, AuthResult } from './auth.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiBody({
    description: 'Login credentials',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'john_doe' },
        password: { type: 'string', example: 'password123' },
      },
      required: ['username', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            role: { type: 'string' },
            display_name: { type: 'string' },
            avatar_url: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  login(@Request() req: any): AuthResult {
    return this.authService.login(req.user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    description: 'Registration data',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'john_doe' },
        password: { type: 'string', example: 'password123' },
        display_name: { type: 'string', example: 'John Doe' },
        role: {
          type: 'string',
          enum: ['user', 'admin', 'superadmin'],
          default: 'user',
        },
      },
      required: ['username', 'password'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Username already exists',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResult> {
    return this.authService.register(registerDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        username: { type: 'string' },
        role: { type: 'string' },
        display_name: { type: 'string' },
        avatar_url: { type: 'string' },
        created_at: { type: 'string' },
        updated_at: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  getProfile(@Request() req: any) {
    return req.user;
  }

  @Post('validate-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid token',
  })
  validateToken(@Request() req: any) {
    return {
      valid: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
      },
    };
  }
}
