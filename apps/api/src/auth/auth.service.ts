import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  display_name?: string;
  role?: UserRole;
}

export interface JwtPayload {
  sub: string; // user id
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  access_token: string;
  user: {
    id: string;
    username: string;
    role: string;
    display_name?: string;
    avatar_url?: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    // Get user by username, explicitly select password_hash
    const user = await this.userRepository.findOne({
      where: { username },
      select: [
        'id',
        'username',
        'password_hash',
        'role',
        'display_name',
        'avatar_url',
      ],
    });

    if (!user || !user.password_hash) {
      return null;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...result } = user;
    return result;
  }

  login(user: any): AuthResult {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    // Check if username already exists
    const existingUser = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new UnauthorizedException('Username already exists');
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(registerDto.password, saltRounds);

    // Create new user
    const newUser = this.userRepository.create({
      username: registerDto.username,
      password_hash,
      display_name: registerDto.display_name,
      role: registerDto.role || UserRole.USER,
    });

    const savedUser = await this.userRepository.save(newUser);

    if (!savedUser) {
      throw new UnauthorizedException('Failed to create user');
    }

    return this.login(savedUser);
  }

  async getUserById(id: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'role',
        'display_name',
        'avatar_url',
        'created_at',
        'updated_at',
      ],
    });

    if (!user) {
      return null;
    }

    return user;
  }

  async getUserByUsername(username: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { username },
      select: [
        'id',
        'username',
        'role',
        'display_name',
        'avatar_url',
        'created_at',
        'updated_at',
      ],
    });

    if (!user) {
      return null;
    }

    return user;
  }
}
