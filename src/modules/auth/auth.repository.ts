import { db } from '../../database/client';

export interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
  phone?: string;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  username: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

export const authRepository = {
  async findUserByEmail(email: string): Promise<UserRow | null> {
    const rows = await db<UserRow[]>`
      SELECT id, email, password_hash, username, phone, role, avatar_url, is_active, created_at, updated_at
      FROM users
      WHERE email = ${email}
    `;
    return rows[0] || null;
  },

  async createUser(data: CreateUserData): Promise<UserRow> {
    const rows = await db<UserRow[]>`
      INSERT INTO users (email, password_hash, username, phone)
      VALUES (${data.email}, ${data.passwordHash}, ${data.username}, ${data.phone || null})
      RETURNING id, email, username, phone, role, avatar_url, is_active, created_at, updated_at
    `;
    return rows[0];
  },

  async storeRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    await db`
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES (${userId}, ${tokenHash}, ${expiresAt})
    `;
  },

  async findRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
    const rows = await db`
      SELECT id, user_id, token_hash, expires_at, created_at
      FROM refresh_tokens
      WHERE token_hash = ${tokenHash}
    `;
    return (rows[0] as RefreshTokenRow) || null;
  },

  async deleteRefreshToken(tokenHash: string) {
    await db`
      DELETE FROM refresh_tokens
      WHERE token_hash = ${tokenHash}
    `;
  },

  async deleteAllUserRefreshTokens(userId: string) {
    await db`
      DELETE FROM refresh_tokens
      WHERE user_id = ${userId}
    `;
  },

  async updatePassword(userId: string, newPasswordHash: string) {
    await db`
      UPDATE users
      SET password_hash = ${newPasswordHash}, updated_at = NOW()
      WHERE id = ${userId}
    `;
  },
};
