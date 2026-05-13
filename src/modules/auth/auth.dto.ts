import { t } from 'elysia';

export const RegisterDTO = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8 }),
  username: t.String({ minLength: 3 }),
  phone: t.Optional(t.String()),
});

export const LoginDTO = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String(),
});

export const RefreshDTO = t.Object({
  refreshToken: t.String(),
});

export const ChangePasswordDTO = t.Object({
  currentPassword: t.String(),
  newPassword: t.String({ minLength: 8 }),
});

export type RegisterInput = typeof RegisterDTO.static;
export type LoginInput = typeof LoginDTO.static;
export type RefreshInput = typeof RefreshDTO.static;
export type ChangePasswordInput = typeof ChangePasswordDTO.static;
