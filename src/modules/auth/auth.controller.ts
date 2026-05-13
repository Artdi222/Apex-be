import { Elysia } from 'elysia';
import { RegisterDTO, LoginDTO, RefreshDTO, ChangePasswordDTO } from './auth.dto';
import { authService } from './auth.service';
import { jwtPlugin } from '../../shared/plugins/jwt.plugin';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { wrapResponse } from '../../shared/utils/response';

// Public auth routes (no JWT required)
const publicRoutes = new Elysia()
  .use(jwtPlugin)
  .post(
    '/register',
    async ({ body, jwt }) => {
      const result = await authService.register(body, jwt);
      return wrapResponse(result);
    },
    { body: RegisterDTO }
  )
  .post(
    '/login',
    async ({ body, jwt }) => {
      const result = await authService.login(body, jwt);
      return wrapResponse(result);
    },
    { body: LoginDTO }
  )
  .post(
    '/refresh',
    async ({ body, jwt }) => {
      const result = await authService.refresh(body.refreshToken, jwt);
      return wrapResponse(result);
    },
    { body: RefreshDTO }
  );

// Protected auth routes (JWT required)
const protectedRoutes = new Elysia()
  .use(authMiddleware)
  .post(
    '/logout',
    async ({ body }) => {
      await authService.logout(body.refreshToken);
      return wrapResponse({ message: 'Logged out successfully' });
    },
    { body: RefreshDTO }
  )
  .post(
    '/changePassword',
    async ({ body, user }) => {
      await authService.changePassword(user.id, body.currentPassword, body.newPassword);
      return wrapResponse({ message: 'Password changed successfully' });
    },
    { body: ChangePasswordDTO }
  );

export const authController = new Elysia({ prefix: '/auth' })
  .use(publicRoutes)
  .use(protectedRoutes);
