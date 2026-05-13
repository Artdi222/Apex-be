import { usersRepository } from './users.repository';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { getPagination, getPaginationMeta } from '../../shared/utils/pagination';
import { saveFile, deleteFile } from '../../shared/utils/file-upload';
import type { UpdateProfileInput, ListUsersQuery } from './users.dto';
import type { UserRole } from '../../shared/types';

export const usersService = {
  async getProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
    }
    return user;
  },

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
    }

    const updated = await usersRepository.updateProfile(userId, data);
    return updated;
  },

  async uploadAvatar(userId: string, file: File) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Delete old avatar if exists
    if (user.avatar_url) {
      await deleteFile(user.avatar_url).catch(() => {});
    }

    const avatarPath = await saveFile(file, 'avatars');
    const updated = await usersRepository.updateAvatar(userId, avatarPath);
    return updated;
  },

  async listUsers(params: ListUsersQuery) {
    const { page, limit, offset } = getPagination(params);

    const { rows, total } = await usersRepository.findAll({
      limit,
      offset,
      search: params.search,
      role: params.role as UserRole | undefined,
    });

    const meta = getPaginationMeta(total, page, limit);

    return { users: rows, meta };
  },

  async getUserById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
    }
    return user;
  },

  async changeRole(id: string, role: UserRole) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
    }

    const updated = await usersRepository.updateRole(id, role);
    return updated;
  },

  async changeStatus(id: string, isActive: boolean) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404, ErrorCodes.NOT_FOUND);
    }

    const updated = await usersRepository.updateStatus(id, isActive);
    return updated;
  },
};
