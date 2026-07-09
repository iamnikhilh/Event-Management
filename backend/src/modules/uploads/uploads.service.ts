import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { nanoid } from 'nanoid';
import type { ReadStream } from 'fs';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>(
      'UPLOAD_DIR',
      join(process.cwd(), 'uploads'),
    );
  }

  onModuleInit(): void {
    this.ensureUploadDir();
  }

  ensureUploadDir(): void {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  assertImageFile(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed');
    }
    return file;
  }

  buildStoredFilename(originalName: string): string {
    const ext = extname(originalName).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)
      ? ext
      : '.jpg';
    return `${nanoid()}${safeExt}`;
  }

  saveUploadedFile(file: Express.Multer.File): { url: string; filename: string } {
    const validated = this.assertImageFile(file);
    this.ensureUploadDir();
    const filename = this.buildStoredFilename(validated.originalname);
    writeFileSync(join(this.uploadDir, filename), validated.buffer);
    return { url: this.toPublicPath(filename), filename };
  }

  toPublicPath(filename: string): string {
    return `/uploads/${filename}`;
  }

  resolveFilePath(filename: string): string {
    if (!SAFE_FILENAME.test(filename)) {
      throw new BadRequestException('Invalid filename');
    }
    const filePath = join(this.uploadDir, filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    return filePath;
  }

  openFile(filename: string): ReadStream {
    return createReadStream(this.resolveFilePath(filename));
  }

  mimeTypeFor(filename: string): string {
    const ext = extname(filename).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.gif':
        return 'image/gif';
      case '.svg':
        return 'image/svg+xml';
      default:
        return 'application/octet-stream';
    }
  }
}
