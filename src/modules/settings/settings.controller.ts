import { Elysia, t } from 'elysia';
import { settingsService } from './settings.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/rbac.middleware';
import { wrapResponse } from '../../shared/utils/response';
import { ROLES } from '../../shared/types/user';

export const settingsController = new Elysia({ prefix: '/settings' })
  // GET /settings/public — Get only public settings (unauthenticated)
  .get(
    '/public',
    async () => {
      const settings = await settingsService.getPublicSettings();
      return wrapResponse(settings);
    }
  )

  .use(authMiddleware)
  .use(requireRole(ROLES.ONLY_SUPERADMIN))

  // GET /settings — Get all settings
  .get(
    '/',
    async () => {
      const settings = await settingsService.getAllSettings();
      return wrapResponse(settings);
    }
  )

  // GET /settings/:key — Get single setting
  .get(
    '/:key',
    async ({ params }) => {
      const setting = await settingsService.getSetting(params.key);
      return wrapResponse(setting);
    },
    {
      params: t.Object({ key: t.String() }),
    }
  )

  // PUT /settings/:key — Update single setting
  .put(
    '/:key',
    async ({ params, body, user }) => {
      const setting = await settingsService.updateSetting(params.key, body.value, user.id);
      return wrapResponse(setting);
    },
    {
      params: t.Object({ key: t.String() }),
      body: t.Object({ value: t.Any() }),
    }
  )

  // PUT /settings — Bulk update settings
  .put(
    '/',
    async ({ body, user }) => {
      const results = await settingsService.bulkUpdateSettings(body.settings, user.id);
      return wrapResponse(results);
    },
    {
      body: t.Object({
        settings: t.Array(
          t.Object({
            key: t.String(),
            value: t.Any(),
          })
        ),
      }),
    }
  )

  // DELETE /settings/:key — Delete a custom setting
  .delete(
    '/:key',
    async ({ params, user }) => {
      const deleted = await settingsService.deleteSetting(params.key, user.id);
      return wrapResponse(deleted);
    },
    {
      params: t.Object({ key: t.String() }),
    }
  )

  // GET /settings/audit-logs — Get audit logs (also available to admins)
  .get(
    '/audit-logs',
    async ({ query }) => {
      const logs = await settingsService.getAuditLogs({
        page: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 20,
        user_id: query.user_id,
        action: query.action,
        entity: query.entity,
      });
      return wrapResponse(logs);
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        user_id: t.Optional(t.String()),
        action: t.Optional(t.String()),
        entity: t.Optional(t.String()),
      }),
    }
  );
