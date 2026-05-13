import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { getPagination, getPaginationMeta } from '../../shared/utils/pagination';
import { saveFile } from '../../shared/utils/file-upload';
import { equipmentRepository } from './equipment.repository';
import type { CreateEquipmentInput, UpdateEquipmentInput, ListEquipmentQuery } from './equipment.dto';

const EQUIPMENT_CATEGORIES = ['helmet', 'suit', 'gloves', 'shoes', 'hans_device', 'other'] as const;

export const equipmentService = {
  async listEquipment(query: ListEquipmentQuery) {
    const { page, limit, offset } = getPagination(query);

    const filters = {
      category: query.category,
      size: query.size,
      status: query.status,
      search: query.search,
    };

    const [items, total] = await Promise.all([
      equipmentRepository.findAll({ ...filters, limit, offset }),
      equipmentRepository.count(filters),
    ]);

    const meta = getPaginationMeta(total, page, limit);

    return { items, meta };
  },

  async getEquipmentById(id: string) {
    const equipment = await equipmentRepository.findById(id);

    if (!equipment) {
      throw new AppError('Equipment not found', 404, ErrorCodes.NOT_FOUND);
    }

    return equipment;
  },

  getCategories() {
    return EQUIPMENT_CATEGORIES;
  },

  async createEquipment(data: CreateEquipmentInput) {
    const input = {
      ...data,
      available_quantity: data.available_quantity ?? data.stock_quantity,
    };

    if (input.available_quantity > input.stock_quantity) {
      throw new AppError(
        'Available quantity cannot exceed stock quantity',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    return equipmentRepository.create(input);
  },

  async updateEquipment(id: string, data: UpdateEquipmentInput) {
    const existing = await equipmentRepository.findById(id);

    if (!existing) {
      throw new AppError('Equipment not found', 404, ErrorCodes.NOT_FOUND);
    }

    const stockQty = data.stock_quantity ?? existing.stock_quantity;
    const availableQty = data.available_quantity ?? existing.available_quantity;

    if (availableQty > stockQty) {
      throw new AppError(
        'Available quantity cannot exceed stock quantity',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    const updated = await equipmentRepository.update(id, data);

    if (!updated) {
      throw new AppError('Failed to update equipment', 500, ErrorCodes.INTERNAL_ERROR);
    }

    return updated;
  },

  async deleteEquipment(id: string) {
    const existing = await equipmentRepository.findById(id);

    if (!existing) {
      throw new AppError('Equipment not found', 404, ErrorCodes.NOT_FOUND);
    }

    const deleted = await equipmentRepository.delete(id);

    if (!deleted) {
      throw new AppError('Failed to delete equipment', 500, ErrorCodes.INTERNAL_ERROR);
    }

    return { message: 'Equipment deleted successfully' };
  },

  async uploadImages(id: string, files: File[]) {
    const existing = await equipmentRepository.findById(id);

    if (!existing) {
      throw new AppError('Equipment not found', 404, ErrorCodes.NOT_FOUND);
    }

    const uploadedPaths: string[] = [];

    for (const file of files) {
      const path = await saveFile(file, 'equipment');
      uploadedPaths.push(path);
    }

    const currentImages = Array.isArray(existing.images) ? existing.images : [];
    const updatedImages = [...currentImages, ...uploadedPaths];

    const updated = await equipmentRepository.updateImages(id, updatedImages);

    if (!updated) {
      throw new AppError('Failed to update equipment images', 500, ErrorCodes.INTERNAL_ERROR);
    }

    return updated;
  },
};
