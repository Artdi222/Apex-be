import { Elysia, t } from 'elysia';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/rbac.middleware';
import { wrapResponse } from '../../shared/utils/response';
import { ROLES } from '../../shared/types';
import { usersService } from './users.service';
import {
  UpdateProfileDTO,
  ListUsersQueryDTO,
  ChangeRoleDTO,
  ChangeStatusDTO,
} from './users.dto';

export const usersController = new Elysia({ prefix: '/users' })
  .use(authMiddleware)

  // GET /users/me — Get own profile
  .get(
    '/me',
    async ({ user }) => {
      const profile = await usersService.getProfile(user.id);
      return wrapResponse(profile);
    }
  )

  // PUT /users/me — Update own profile
  .put(
    '/me',
    async ({ user, body }) => {
      const updated = await usersService.updateProfile(user.id, body);
      return wrapResponse(updated);
    },
    { body: UpdateProfileDTO }
  )

  // PUT /users/me/avatar — Upload avatar
  .put(
    '/me/avatar',
    async ({ user, body }) => {
      const updated = await usersService.uploadAvatar(user.id, body.avatar);
      return wrapResponse(updated);
    },
    {
      body: t.Object({
        avatar: t.File(),
      }),
    }
  )

  // GET /users — List all users (Admin, Superadmin)
  .use(requireRole(ROLES.ALL_ADMINS))
  .get(
    '/',
    async ({ query }) => {
      const result = await usersService.listUsers(query);
      return wrapResponse(result);
    },
    { query: ListUsersQueryDTO }
  )

  // GET /users/:id — Get user by ID (Admin, Superadmin)
  .get(
    '/:id',
    async ({ params }) => {
      const user = await usersService.getUserById(params.id);
      return wrapResponse(user);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // PUT /users/:id/status — Activate/deactivate (Admin, Superadmin)
  .put(
    '/:id/status',
    async ({ params, body }) => {
      const updated = await usersService.changeStatus(params.id, body.is_active);
      return wrapResponse(updated);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: ChangeStatusDTO,
    }
  )

  // PUT /users/:id/role — Change user role (Superadmin only)
  .use(requireRole(ROLES.ONLY_SUPERADMIN))
  .put(
    '/:id/role',
    async ({ params, body }) => {
      const updated = await usersService.changeRole(params.id, body.role);
      return wrapResponse(updated);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: ChangeRoleDTO,
    }
  );
