import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../../database/database.constants';
import { Database } from '../../database/database.types';
import { User, users } from '../../database/schema';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const existingUser = await this.findUserByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const [newUser] = await this.db
      .insert(users)
      .values({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        passwordHash,
        role: 'organizer',
      })
      .returning();

    const tokens = await this.createTokens(newUser);
    await this.storeRefreshTokenHash(newUser.id, tokens.refreshToken);

    return {
      user: this.toPublicUser(newUser),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.findUserByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.createTokens(user);
    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: this.toPublicUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const user = await this.findUserById(payload.sub);

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const refreshTokenMatches = await bcrypt.compare(
      dto.refreshToken,
      user.refreshTokenHash,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokens = await this.createTokens(user);
    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    await this.db
      .update(users)
      .set({ refreshTokenHash: null, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { message: 'Logged out' };
  }

  async me(userId: string) {
    const user = await this.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user);
  }

  async forgotPassword(_dto: ForgotPasswordDto) {
    return {
      message: 'If that email exists, a reset link was sent.',
    };
  }

  async findUserById(userId: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user;
  }

  private async findUserByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    return user;
  }

  private async createTokens(user: User) {
    const payload: AuthenticatedUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.parseExpiresIn(
          this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.parseExpiresIn(
          this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
        ),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<AuthenticatedUser> {
    try {
      return await this.jwtService.verifyAsync<AuthenticatedUser>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async storeRefreshTokenHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.db
      .update(users)
      .set({ refreshTokenHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  private parseExpiresIn(value: string): number {
    const match = value.trim().match(/^(\d+)([smhd]?)$/i);

    if (!match) {
      return 900;
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'd':
        return amount * 24 * 60 * 60;
      case 'h':
        return amount * 60 * 60;
      case 'm':
        return amount * 60;
      case 's':
      case '':
        return amount;
      default:
        return amount;
    }
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };
  }
}
