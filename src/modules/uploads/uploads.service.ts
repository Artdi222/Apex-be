import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { saveFile, deleteFile } from '../../shared/utils/file-upload';
import { config } from '../../config';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateImageFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new AppError(
      `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      400,
      ErrorCodes.VALIDATION_ERROR
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new AppError(
      `File size ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum allowed size of 10MB`,
      400,
      ErrorCodes.VALIDATION_ERROR
    );
  }
}

export const uploadsService = {
  /**
   * Upload a single image file.
   * Validates file type and size, saves to disk, and returns the relative URL path.
   */
  async uploadSingle(file: File, subDir?: string): Promise<string> {
    validateImageFile(file);

    const relativePath = await saveFile(file, subDir);
    return relativePath;
  },

  /**
   * Upload multiple image files.
   * Validates each file, saves all to disk, and returns an array of relative URL paths.
   */
  async uploadMultiple(files: File[], subDir?: string): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new AppError(
        'No files provided for upload',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Validate all files before saving any
    for (const file of files) {
      validateImageFile(file);
    }

    const paths: string[] = [];
    for (const file of files) {
      const relativePath = await saveFile(file, subDir);
      paths.push(relativePath);
    }

    return paths;
  },

  /**
   * Delete an uploaded file by filename.
   */
  async deleteUpload(filename: string): Promise<void> {
    if (!filename || filename.includes('..')) {
      throw new AppError(
        'Invalid filename',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    await deleteFile(filename);
  },

  /**
   * Resolve the full filesystem path for serving a file.
   * Prevents directory traversal attacks.
   */
  getFilePath(relativePath: string): string {
    if (!relativePath || relativePath.includes('..')) {
      throw new AppError(
        'Invalid file path',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    const uploadDir = resolve(config.storage.uploadDir);
    const fullPath = resolve(join(uploadDir, relativePath));

    // Prevent directory traversal
    if (!fullPath.startsWith(uploadDir)) {
      throw new AppError(
        'Invalid file path',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    if (!existsSync(fullPath)) {
      throw new AppError(
        'File not found',
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    return fullPath;
  },
};
