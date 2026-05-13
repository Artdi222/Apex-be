import { db } from '../../database/client';
import type { UserRole } from '../../shared/types';

export interface UpdateProfileData {
  username?: string;
  phone?: string;
}

export interface FindAllParams {
  limit: number;
  offset: number;
  search?: string;
  role?: UserRole;
}

export const usersRepository = {
  async findById(id: string) {
    const rows = await db`
      SELECT id, email, username, phone, role, avatar_url, is_active, created_at, updated_at
      FROM users
      WHERE id = ${id}
    `;
    return rows[0] || null;
  },

  async findAll(params: FindAllParams) {
    const { limit, offset, search, role } = params;

    const conditions: string[] = [];
    const countConditions: string[] = [];

    const rows = await db`
      SELECT id, email, username, phone, role, avatar_url, is_active, created_at, updated_at
      FROM users
      WHERE 1=1
        ${search ? db`AND (email ILIKE ${'%' + search + '%'} OR username ILIKE ${'%' + search + '%'})` : db``}
        ${role ? db`AND role = ${role}` : db``}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countResult = await db`
      SELECT COUNT(*)::int AS total
      FROM users
      WHERE 1=1
        ${search ? db`AND (email ILIKE ${'%' + search + '%'} OR username ILIKE ${'%' + search + '%'})` : db``}
        ${role ? db`AND role = ${role}` : db``}
    `;

    return {
      rows,
      total: countResult[0].total,
    };
  },

  async updateProfile(id: string, data: UpdateProfileData) {
    const rows = await db`
      UPDATE users
      SET
        username = COALESCE(${data.username ?? null}, username),
        phone = COALESCE(${data.phone ?? null}, phone),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, username, phone, role, avatar_url, is_active, created_at, updated_at
    `;
    return rows[0] || null;
  },

  async updateAvatar(id: string, avatarUrl: string) {
    const rows = await db`
      UPDATE users
      SET avatar_url = ${avatarUrl}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, username, phone, role, avatar_url, is_active, created_at, updated_at
    `;
    return rows[0] || null;
  },

  async updateRole(id: string, role: UserRole) {
    const rows = await db`
      UPDATE users
      SET role = ${role}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, username, phone, role, avatar_url, is_active, created_at, updated_at
    `;
    return rows[0] || null;
  },

  async updateStatus(id: string, isActive: boolean) {
    const rows = await db`
      UPDATE users
      SET is_active = ${isActive}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, username, phone, role, avatar_url, is_active, created_at, updated_at
    `;
    return rows[0] || null;
  },
};
