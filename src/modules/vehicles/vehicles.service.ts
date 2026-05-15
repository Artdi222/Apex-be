import { vehiclesRepository } from './vehicles.repository';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { getPagination, getPaginationMeta } from '../../shared/utils/pagination';
import { settingsService } from '../settings/settings.service';
import type { CreateVehicleInput, ListVehiclesQuery, UpdateVehicleModelInput, UpdateVehicleInstanceInput } from './vehicles.dto';

export const vehiclesService = {
  async listVehicleModels(params: ListVehiclesQuery) {
    const { page, limit, offset } = getPagination(params);

    const [models, total] = await Promise.all([
      vehiclesRepository.findAllModels({ ...params, limit, offset }),
      vehiclesRepository.countModels(params),
    ]);

    const pagination = getPaginationMeta(total, page, limit);

    return { models, pagination };
  },

  async getModelDetails(id: string) {
    const model = await vehiclesRepository.findModelById(id);
    if (!model) {
      throw new AppError('Vehicle model not found', 404, ErrorCodes.NOT_FOUND);
    }

    const instances = await vehiclesRepository.findInstancesByModelId(id);
    return { ...model, instances };
  },

  async createVehicleWithStock(data: CreateVehicleInput, userId: string) {
    const { initial_stock = 1, ...modelData } = data;
    const model = await vehiclesRepository.createModel(modelData);
    const instances = [];
    for (let i = 1; i <= initial_stock; i++) {
      const internalId = `${model.name.replace(/\s+/g, '-').toUpperCase()}-${i.toString().padStart(3, '0')}`;
      const instance = await vehiclesRepository.createInstance(model.id, internalId);
      instances.push(instance);
    }

    await settingsService.createAuditLog({
      user_id: userId,
      action: 'create_vehicle_model',
      entity: 'vehicle_models',
      entity_id: model.id,
    });

    return { ...model, instances };
  },

  async updateVehicleModel(id: string, data: UpdateVehicleModelInput, userId: string) {
    const model = await vehiclesRepository.updateModel(id, data);
    if (!model) {
      throw new AppError('Vehicle model not found', 404, ErrorCodes.NOT_FOUND);
    }

    await settingsService.createAuditLog({
      user_id: userId,
      action: 'update_vehicle_model',
      entity: 'vehicle_models',
      entity_id: id,
    });

    return model;
  },

  async updateVehicleInstance(id: string, data: UpdateVehicleInstanceInput, userId: string) {
    const instance = await vehiclesRepository.updateInstance(id, data);
    if (!instance) {
      throw new AppError('Vehicle instance not found', 404, ErrorCodes.NOT_FOUND);
    }

    await settingsService.createAuditLog({
      user_id: userId,
      action: 'update_vehicle_instance',
      entity: 'vehicle_instances',
      entity_id: id,
    });

    return instance;
  },

  async deleteVehicleModel(id: string, userId: string) {
    const deleted = await vehiclesRepository.deleteModel(id);
    if (!deleted) {
      throw new AppError('Vehicle model not found', 404, ErrorCodes.NOT_FOUND);
    }

    await settingsService.createAuditLog({
      user_id: userId,
      action: 'delete_vehicle_model',
      entity: 'vehicle_models',
      entity_id: id,
    });

    return deleted;
  },

  async deleteVehicleInstance(id: string, userId: string) {
    const deleted = await vehiclesRepository.deleteInstance(id);
    if (!deleted) {
      throw new AppError('Vehicle instance not found', 404, ErrorCodes.NOT_FOUND);
    }

    await settingsService.createAuditLog({
      user_id: userId,
      action: 'delete_vehicle_instance',
      entity: 'vehicle_instances',
      entity_id: id,
    });

    return deleted;
  }
};
