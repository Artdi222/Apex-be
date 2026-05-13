import { t } from 'elysia';

export const UserRoleEnum = t.Union([
  t.Literal('user'),
  t.Literal('admin'),
  t.Literal('superadmin'),
]);

export const UpdateProfileDTO = t.Object({
  username: t.Optional(t.String({ minLength: 3 })),
  phone: t.Optional(t.String()),
});

export const ListUsersQueryDTO = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
  search: t.Optional(t.String()),
  role: t.Optional(UserRoleEnum),
});

export const ChangeRoleDTO = t.Object({
  role: UserRoleEnum,
});

export const ChangeStatusDTO = t.Object({
  is_active: t.Boolean(),
});

export type UpdateProfileInput = typeof UpdateProfileDTO.static;
export type ListUsersQuery = typeof ListUsersQueryDTO.static;
export type ChangeRoleInput = typeof ChangeRoleDTO.static;
export type ChangeStatusInput = typeof ChangeStatusDTO.static;
