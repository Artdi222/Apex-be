import { authRepository, type UserRow } from './auth.repository';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import { generateRandomToken } from '../../shared/utils/token';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { db } from '../../database/client';
import type { RegisterInput, LoginInput } from './auth.dto';

interface TokenSigner {
  sign(payload: Record<string, unknown>): Promise<string>;
}

/**
 * Hash refresh token with SHA-256 for deterministic lookup.
 * Unlike passwords, refresh tokens are high-entropy random strings,
 * so a fast hash is sufficient and allows direct DB lookups.
 */
function hashRefreshToken(token: string): string {
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(token);
  return hasher.digest('hex');
}

async function generateTokenPair(
  user: { id: string; email: string; role: string },
  jwt: TokenSigner
) {
  const accessToken = await jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRandomToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await authRepository.storeRefreshToken(user.id, refreshTokenHash, expiresAt);

  return { accessToken, refreshToken };
}

async function getUserById(userId: string): Promise<UserRow | null> {
  const rows = await db`
    SELECT id, email, password_hash, username, phone, role, avatar_url, is_active, created_at, updated_at
    FROM users
    WHERE id = ${userId}
  `;
  return (rows[0] as UserRow) || null;
}

export const authService = {
  async register(data: RegisterInput, jwt: TokenSigner) {
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email already registered', 409, ErrorCodes.CONFLICT);
    }

    const passwordHash = await hashPassword(data.password);

    const user = await authRepository.createUser({
      email: data.email,
      username: data.username,
      passwordHash,
      phone: data.phone,
    });

    const tokens = await generateTokenPair(user, jwt);

    return {
      user,
      ...tokens,
    };
  },

  async login(data: LoginInput, jwt: TokenSigner) {
    const user = await authRepository.findUserByEmail(data.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401, ErrorCodes.UNAUTHORIZED);
    }

    const isPasswordValid = await verifyPassword(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, ErrorCodes.UNAUTHORIZED);
    }

    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403, ErrorCodes.FORBIDDEN);
    }

    const tokens = await generateTokenPair(user, jwt);

    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  },

  async refresh(refreshToken: string, jwt: TokenSigner) {
    const tokenHash = hashRefreshToken(refreshToken);
    const storedToken = await authRepository.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw new AppError('Invalid refresh token', 401, ErrorCodes.UNAUTHORIZED);
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      await authRepository.deleteRefreshToken(tokenHash);
      throw new AppError('Refresh token expired', 401, ErrorCodes.UNAUTHORIZED);
    }

    const user = await getUserById(storedToken.user_id);
    if (!user) {
      throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403, ErrorCodes.FORBIDDEN);
    }

    // Invalidate the old refresh token (rotation for security)
    await authRepository.deleteRefreshToken(tokenHash);

    // Issue a brand-new token pair (fresh access + fresh refresh with new 7-day expiry)
    const tokens = await generateTokenPair(user, jwt);

    return tokens;
  },

  async logout(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    await authRepository.deleteRefreshToken(tokenHash);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await getUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
    }

    const isPasswordValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401, ErrorCodes.UNAUTHORIZED);
    }

    const newPasswordHash = await hashPassword(newPassword);
    await authRepository.updatePassword(userId, newPasswordHash);

    // Invalidate all refresh tokens to force re-login on other devices
    await authRepository.deleteAllUserRefreshTokens(userId);
  },
};
