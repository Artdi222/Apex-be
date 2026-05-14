import { incidentsRepository } from './incidents.repository';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { db } from '../../database/client';
import type {
  CreateIncidentInput,
  UpdateIncidentInput,
  AddUserStatementInput,
  AddWitnessInput,
  ListIncidentsQuery,
} from './incidents.dto';

function isAdmin(role: string): boolean {
  return role === 'admin' || role === 'superadmin';
}

async function getBooking(bookingId: string) {
  const rows = await db`SELECT id, user_id, status FROM bookings WHERE id = ${bookingId}`;
  return rows[0] || null;
}

export const incidentsService = {
  async create(data: CreateIncidentInput, userId: string, userRole: string) {
    if (!isAdmin(userRole)) {
      throw new AppError('Only administrators can create incident reports', 403, ErrorCodes.FORBIDDEN);
    }
    const booking = await getBooking(data.booking_id);
    if (!booking) {
      throw new AppError('Booking not found', 404, ErrorCodes.NOT_FOUND);
    }
    return incidentsRepository.create(data, userId);
  },

  async list(query: ListIncidentsQuery, userId: string, userRole: string) {
    return incidentsRepository.list(query, userId, isAdmin(userRole));
  },

  async getById(id: string, userId: string, userRole: string) {
    const incident = await incidentsRepository.findById(id);
    if (!incident) {
      throw new AppError('Incident not found', 404, ErrorCodes.NOT_FOUND);
    }
    if (!isAdmin(userRole) && incident.booking?.user_id !== userId) {
      throw new AppError('You do not have permission to view this incident', 403, ErrorCodes.FORBIDDEN);
    }
    return incident;
  },

  async update(id: string, data: UpdateIncidentInput, userId: string, userRole: string) {
    if (!isAdmin(userRole)) {
      throw new AppError('Only administrators can update incident reports', 403, ErrorCodes.FORBIDDEN);
    }
    const incident = await incidentsRepository.findById(id);
    if (!incident) {
      throw new AppError('Incident not found', 404, ErrorCodes.NOT_FOUND);
    }
    return incidentsRepository.update(id, data);
  },

  async addUserStatement(id: string, data: AddUserStatementInput, userId: string, userRole: string) {
    const incident = await incidentsRepository.findById(id);
    if (!incident) {
      throw new AppError('Incident not found', 404, ErrorCodes.NOT_FOUND);
    }
    const ownsBooking = incident.booking?.user_id === userId;
    if (!isAdmin(userRole) && !ownsBooking) {
      throw new AppError('You can only add statements to incidents on your own bookings', 403, ErrorCodes.FORBIDDEN);
    }
    if (incident.user_unable_to_respond && !isAdmin(userRole)) {
      throw new AppError('This incident is marked as user unable to respond', 400, ErrorCodes.BAD_REQUEST);
    }
    if (incident.user_statement && !isAdmin(userRole)) {
      throw new AppError('You have already added a statement to this incident', 400, ErrorCodes.BAD_REQUEST);
    }
    return incidentsRepository.addUserStatement(id, data);
  },

  async addUserPhotos(id: string, photos: string[], userId: string, userRole: string) {
    const incident = await incidentsRepository.findById(id);
    if (!incident) {
      throw new AppError('Incident not found', 404, ErrorCodes.NOT_FOUND);
    }
    if (!isAdmin(userRole) && incident.booking?.user_id !== userId) {
      throw new AppError('You can only add photos to incidents on your own bookings', 403, ErrorCodes.FORBIDDEN);
    }
    if (incident.user_unable_to_respond && !isAdmin(userRole)) {
      throw new AppError('This incident is marked as user unable to respond', 400, ErrorCodes.BAD_REQUEST);
    }
    return incidentsRepository.addUserPhotos(id, photos);
  },

  async addWitness(id: string, data: AddWitnessInput, userId: string, userRole: string) {
    if (!isAdmin(userRole)) {
      throw new AppError('Only administrators can add witness statements', 403, ErrorCodes.FORBIDDEN);
    }
    const incident = await incidentsRepository.findById(id);
    if (!incident) {
      throw new AppError('Incident not found', 404, ErrorCodes.NOT_FOUND);
    }
    return incidentsRepository.addWitness(id, data);
  },

  async getByBookingId(bookingId: string, userId: string, userRole: string) {
    const booking = await getBooking(bookingId);
    if (!booking) {
      throw new AppError('Booking not found', 404, ErrorCodes.NOT_FOUND);
    }
    if (!isAdmin(userRole) && booking.user_id !== userId) {
      throw new AppError('You do not have permission to view incidents for this booking', 403, ErrorCodes.FORBIDDEN);
    }
    return incidentsRepository.getByBookingId(bookingId);
  },
};
