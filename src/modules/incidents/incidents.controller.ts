import { Elysia, t } from 'elysia';
import { incidentsService } from './incidents.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/rbac.middleware';
import { wrapResponse } from '../../shared/utils/response';
import { ROLES } from '../../shared/types/user';
import {
  CreateIncidentDTO,
  UpdateIncidentDTO,
  AddUserStatementDTO,
  AddWitnessDTO,
  ListIncidentsQueryDTO,
} from './incidents.dto';

export const incidentsController = new Elysia({ prefix: '/incidents' })
  .use(authMiddleware)
  // --- Admin-only routes ---
  .post(
    '/',
    async ({ body, user }) => {
      const incident = await incidentsService.create(body, user.id, user.role);
      return wrapResponse(incident);
    },
    { body: CreateIncidentDTO }
  )
  .put(
    '/:id',
    async ({ params, body, user }) => {
      const incident = await incidentsService.update(params.id, body, user.id, user.role);
      return wrapResponse(incident);
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: UpdateIncidentDTO,
    }
  )
  .post(
    '/:id/witness',
    async ({ params, body, user }) => {
      const incident = await incidentsService.addWitness(params.id, body, user.id, user.role);
      return wrapResponse(incident);
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: AddWitnessDTO,
    }
  )
  // --- Authenticated routes (any role) ---
  .get(
    '/',
    async ({ query, user }) => {
      const incidents = await incidentsService.list(query, user.id, user.role);
      return wrapResponse(incidents);
    },
    { query: ListIncidentsQueryDTO }
  )
  .get(
    '/:id',
    async ({ params, user }) => {
      const incident = await incidentsService.getById(params.id, user.id, user.role);
      return wrapResponse(incident);
    },
    { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
  )
  .get(
    '/booking/:bookingId',
    async ({ params, user }) => {
      const incidents = await incidentsService.getByBookingId(params.bookingId, user.id, user.role);
      return wrapResponse(incidents);
    },
    { params: t.Object({ bookingId: t.String({ format: 'uuid' }) }) }
  )
  .post(
    '/:id/user-statement',
    async ({ params, body, user }) => {
      const incident = await incidentsService.addUserStatement(params.id, body, user.id, user.role);
      return wrapResponse(incident);
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: AddUserStatementDTO,
    }
  )
  .post(
    '/:id/user-photos',
    async ({ params, body, user }) => {
      const incident = await incidentsService.addUserPhotos(params.id, body.photos, user.id, user.role);
      return wrapResponse(incident);
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({ photos: t.Array(t.String()) }),
    }
  );
