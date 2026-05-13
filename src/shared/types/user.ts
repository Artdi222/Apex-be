export type UserRole = 'user' | 'admin' | 'superadmin';

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
}

export const ROLES = {
  ONLY_SUPERADMIN: ['superadmin'] as UserRole[],
  ALL_ADMINS: ['admin', 'superadmin'] as UserRole[],
  EVERYONE: ['user', 'admin', 'superadmin'] as UserRole[],
};
