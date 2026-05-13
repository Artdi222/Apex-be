import { Elysia, t } from 'elysia';
import { vehiclesService } from './vehicles.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/rbac.middleware';
import { wrapResponse } from '../../shared/utils/response';
import { ROLES } from '../../shared/types';
import {
  CreateVehicleDTO,
  UpdateVehicleModelDTO,
  UpdateVehicleInstanceDTO,
  ListVehiclesQueryDTO,
} from './vehicles.dto';

// Public routes (no auth required)
const publicRoutes = new Elysia()
  .get(
    '/',
    async ({ query }) => {
      const result = await vehiclesService.listVehicleModels(query);
      return wrapResponse(result);
    },
    { 
      query: ListVehiclesQueryDTO
    }
  )
  .get(
    '/:id',
    async ({ params }) => {
      const vehicle = await vehiclesService.getModelDetails(params.id);
      return wrapResponse(vehicle);
    },
    { 
      params: t.Object({ id: t.String({ format: 'uuid' }) })
    }
  );

// Admin routes (Admin + Superadmin)
const adminRoutes = new Elysia()
  .use(authMiddleware)
  .use(requireRole(ROLES.ALL_ADMINS))
  // Create Model + Initial Instances (Bulk)
  .post(
    '/',
    async ({ body }) => {
      const vehicle = await vehiclesService.createVehicleWithStock(body);
      return wrapResponse(vehicle);
    },
    { body: CreateVehicleDTO }
  )
  // Update Model Details
  .put(
    '/:id',
    async ({ params, body }) => {
      const vehicle = await vehiclesService.updateVehicleModel(params.id, body);
      return wrapResponse(vehicle);
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: UpdateVehicleModelDTO,
    }
  )
  // Update Specific Car Instance
  .put(
    '/instances/:id',
    async ({ params, body }) => {
      const instance = await vehiclesService.updateVehicleInstance(params.id, body);
      return wrapResponse(instance);
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: UpdateVehicleInstanceDTO,
    }
  );

// Superadmin-only routes
const superadminRoutes = new Elysia()
  .use(authMiddleware)
  .use(requireRole(ROLES.ONLY_SUPERADMIN))
  // Delete whole model
  .delete(
    '/:id',
    async ({ params }) => {
      await vehiclesService.deleteVehicleModel(params.id);
      return wrapResponse({ message: 'Vehicle model deleted successfully' });
    },
    { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
  )
  // Delete specific instance
  .delete(
    '/instances/:id',
    async ({ params }) => {
      await vehiclesService.deleteVehicleInstance(params.id);
      return wrapResponse({ message: 'Vehicle instance deleted successfully' });
    },
    { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
  );

// Combined controller
export const vehiclesController = new Elysia({ prefix: '/vehicles' })
  .use(publicRoutes)
  .use(adminRoutes)
  .use(superadminRoutes);
