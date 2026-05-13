import { Elysia, t } from 'elysia';
import { schedulesService } from './schedules.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/rbac.middleware';
import { wrapResponse } from '../../shared/utils/response';
import { ROLES } from '../../shared/types';
import {
  CreateScheduleSlotDTO,
  UpdateScheduleSlotDTO,
  ListSchedulesQueryDTO,
  GenerateSlotsDTO,
  BlockSlotDTO,
  ScheduleSlotResponseDTO,
} from './schedules.dto';

// Public routes - view available slots
const publicRoutes = new Elysia()
  .get(
    '/',
    async ({ query }) => {
      const result = await schedulesService.listSlots(query);
      return wrapResponse(result);
    },
    { 
      query: ListSchedulesQueryDTO,
      response: t.Object({
        success: t.Boolean(),
        data: t.Object({
          slots: t.Array(ScheduleSlotResponseDTO),
          pagination: t.Object({
            total: t.Number(),
            page: t.Number(),
            limit: t.Number(),
            totalPages: t.Number()
          })
        }),
        message: t.Optional(t.String())
      })
    }
  )
  .get(
    '/:id',
    async ({ params }) => {
      const slot = await schedulesService.getSlotById(params.id);
      return wrapResponse(slot);
    },
    { 
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      response: t.Object({
        success: t.Boolean(),
        data: ScheduleSlotResponseDTO,
        message: t.Optional(t.String())
      })
    }
  );

// Admin routes - manage schedule slots
const adminRoutes = new Elysia()
  .use(authMiddleware)
  .use(requireRole(ROLES.ALL_ADMINS))
  .post(
    '/',
    async ({ body }) => {
      const slot = await schedulesService.createSlot(body);
      return wrapResponse(slot);
    },
    { 
      body: CreateScheduleSlotDTO,
      response: t.Object({
        success: t.Boolean(),
        data: ScheduleSlotResponseDTO,
        message: t.Optional(t.String())
      })
    }
  )
  .put(
    '/:id',
    async ({ params, body }) => {
      const slot = await schedulesService.updateSlot(params.id, body);
      return wrapResponse(slot);
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: UpdateScheduleSlotDTO,
      response: t.Object({
        success: t.Boolean(),
        data: ScheduleSlotResponseDTO,
        message: t.Optional(t.String())
      })
    }
  )
  .delete(
    '/:id',
    async ({ params }) => {
      await schedulesService.deleteSlot(params.id);
      return wrapResponse({ message: 'Schedule slot deleted successfully' });
    },
    { 
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      response: t.Object({
        success: t.Boolean(),
        data: t.Object({ message: t.String() }),
        message: t.Optional(t.String())
      })
    }
  )
  .post(
    '/generate',
    async ({ body }) => {
      const result = await schedulesService.generateSlots(body);
      return wrapResponse(result);
    },
    { 
      body: GenerateSlotsDTO,
      response: t.Object({
        success: t.Boolean(),
        data: t.Object({
          generated: t.Number(),
          created: t.Number(),
          skipped: t.Number()
        }),
        message: t.Optional(t.String())
      })
    }
  )
  .put(
    '/:id/block',
    async ({ params }) => {
      const slot = await schedulesService.blockSlot(params.id);
      return wrapResponse(slot);
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: BlockSlotDTO,
      response: t.Object({
        success: t.Boolean(),
        data: ScheduleSlotResponseDTO,
        message: t.Optional(t.String())
      })
    }
  );

// Combined controller
export const schedulesController = new Elysia({ prefix: '/schedules' })
  .use(publicRoutes)
  .use(adminRoutes);
