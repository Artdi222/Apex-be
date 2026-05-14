import { Elysia, t } from 'elysia';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/rbac.middleware';
import { wrapResponse } from '../../shared/utils/response';
import { ROLES } from '../../shared/types';
import { equipmentService } from './equipment.service';
import { CreateEquipmentDTO, UpdateEquipmentDTO, ListEquipmentQueryDTO } from './equipment.dto';

export const equipmentController = new Elysia({ prefix: '/equipment' })
  // Public routes
  .get(
    '/categories',
    async () => {
      const categories = equipmentService.getCategories();
      return wrapResponse(categories);
    },
    {
      detail: { tags: ['Equipment'], summary: 'List equipment categories' },
    }
  )
  .get(
    '/',
    async ({ query }) => {
      const result = await equipmentService.listEquipment(query);
      return wrapResponse(result);
    },
    {
      query: ListEquipmentQueryDTO,
      detail: { tags: ['Equipment'], summary: 'List equipment' },
    }
  )
  .get(
    '/:id',
    async ({ params }) => {
      const equipment = await equipmentService.getEquipmentById(params.id);
      return wrapResponse(equipment);
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      detail: { tags: ['Equipment'], summary: 'Get equipment by ID' },
    }
  )
  // Protected routes
  .use(authMiddleware)
  .use(requireRole(ROLES.ALL_ADMINS))
  .post(
    '/',
    async ({ body, user }) => {
      const equipment = await equipmentService.createEquipment(body, user.id);
      return wrapResponse(equipment);
    },
    {
      body: CreateEquipmentDTO,
      detail: { tags: ['Equipment'], summary: 'Create equipment' },
    }
  )
  .put(
    '/:id',
    async ({ params, body, user }) => {
      const equipment = await equipmentService.updateEquipment(params.id, body, user.id);
      return wrapResponse(equipment);
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: UpdateEquipmentDTO,
      detail: { tags: ['Equipment'], summary: 'Update equipment' },
    }
  )
  .post(
    '/:id/images',
    async ({ params, body, user }) => {
      const equipment = await equipmentService.uploadImages(params.id, body.images, user.id);
      return wrapResponse(equipment);
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({ images: t.Files() }),
      detail: { tags: ['Equipment'], summary: 'Upload equipment images' },
    }
  )
  // Superadmin-only route
  .group('', (app) =>
    app
      .use(requireRole(ROLES.ONLY_SUPERADMIN))
      .delete(
        '/:id',
        async ({ params, user }) => {
          const result = await equipmentService.deleteEquipment(params.id, user.id);
          return wrapResponse(result);
        },
        {
          params: t.Object({ id: t.String({ format: 'uuid' }) }),
          detail: { tags: ['Equipment'], summary: 'Delete equipment' },
        }
      )
  );
