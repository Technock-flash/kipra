import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '@config/database';
import { redisHelpers } from '@config/redis';
import { AppError } from '@middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const generateTokens = (payload: TokenPayload): AuthTokens => {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};

export const registerUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}) => {
  if (data.role === UserRole.MEMBER) {
    throw new AppError('Member portal accounts must be created by an administrator', 403);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError('User already exists with this email', 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role || UserRole.LEADER,
      status: UserStatus.ACTIVE,
    },
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
  };
};

export const loginUser = async (email: string, password: string, ipAddress?: string) => {
  // Check rate limiting
  if (ipAddress) {
    const isLocked = await redisHelpers.isLockedOut(ipAddress);
    if (isLocked) {
      throw new AppError('Too many failed attempts. Account locked for 30 minutes.', 429);
    }
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    if (ipAddress) {
      await redisHelpers.incrementLoginAttempts(ipAddress);
    }
    throw new AppError('Invalid email or password', 401);
  }

  if (user.deletedAt) {
    throw new AppError('Account not found', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    if (ipAddress) {
      const attempts = await redisHelpers.incrementLoginAttempts(ipAddress);
      if (attempts >= 5) {
        await redisHelpers.setLockout(ipAddress);
        throw new AppError('Too many failed attempts. Account locked for 30 minutes.', 429);
      }
    }
    throw new AppError('Invalid email or password', 401);
  }

  // Reset login attempts on success
  if (ipAddress) {
    await redisHelpers.setLoginAttempts(ipAddress, 0);
  }

  // Check if 2FA is required
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    return {
      requiresTwoFactor: true,
      userId: user.id,
      email: user.email,
    };
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
  });

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Store refresh token in Redis
  await redisHelpers.setRefreshToken(user.id, tokens.refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
      linkedMemberId: user.linkedMemberId,
    },
    tokens,
  };
};

export const verifyTwoFactor = async (userId: string, token: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.twoFactorSecret) {
    throw new AppError('Invalid 2FA setup', 400);
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 2,
  });

  if (!verified) {
    throw new AppError('Invalid authentication code', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  await redisHelpers.setRefreshToken(user.id, tokens.refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
      linkedMemberId: user.linkedMemberId,
    },
    tokens,
  };
};

export const setupTwoFactor = async (userId: string, enable: boolean) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (enable) {
    const secret = speakeasy.generateSecret({
      name: `KiPRA:${user.email}`,
      length: 32,
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: secret.base32,
      },
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { message: 'Two-factor authentication disabled' };
  }
};

export const confirmTwoFactorSetup = async (userId: string, token: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.twoFactorSecret) {
    throw new AppError('2FA not initialized', 400);
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 2,
  });

  if (!verified) {
    throw new AppError('Invalid verification code', 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });

  return { message: 'Two-factor authentication enabled successfully' };
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Verify token in Redis
    const storedToken = await redisHelpers.getRefreshToken(decoded.userId);
    if (storedToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new AppError('User not found or inactive', 401);
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update refresh token in Redis
    await redisHelpers.setRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
};

export const logoutUser = async (userId: string, token: string): Promise<void> => {
  // Remove refresh token from Redis
  await redisHelpers.deleteRefreshToken(userId);
  
  // Blacklist access token (it will expire naturally, but this adds extra security)
  await redisHelpers.blacklistToken(token, 15 * 60); // 15 minutes
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  // Invalidate all refresh tokens
  await redisHelpers.deleteRefreshToken(userId);

  return { message: 'Password changed successfully. Please login again.' };
};

