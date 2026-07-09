import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { nanoid } from 'nanoid';
import { Readable } from 'stream';
import type { ReadStream } from 'fs';

import { SUPABASE_CLIENT } from '../../database/supabase.module';

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
  private readonly storageBucket: string;
  private readonly useSupabaseStorage: boolean;

  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient | null,
  ) {
    this.uploadDir = this.configService.get<string>(
      'UPLOAD_DIR',
      join(process.cwd(), 'uploads'),
    );
    this.storageBucket = this.configService.get<string>(
      'SUPABASE_STORAGE_BUCKET',
      'event-images',
    );
    const storageMode = this.configService.get<string>('UPLOAD_STORAGE', 'auto');
    this.useSupabaseStorage =
      storageMode === 'supabase' ||
      (storageMode === 'auto' && this.supabase !== null);
  }

  onModuleInit(): void {
    if (!this.useSupabaseStorage) {
      this.ensureUploadDir();
    }
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

  async saveUploadedFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; filename: string }> {
    const validated = this.assertImageFile(file);
    const filename = this.buildStoredFilename(validated.originalname);

    if (this.useSupabaseStorage) {
      return this.saveToSupabase(validated, filename);
    }

    return this.saveToLocal(validated, filename);
  }

  private async saveToSupabase(
    file: Express.Multer.File,
    filename: string,
  ): Promise<{ url: string; filename: string }> {
    if (!this.supabase) {
      throw new BadRequestException('Supabase storage is not configured');
    }

    const { error } = await this.supabase.storage
      .from(this.storageBucket)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const { data } = this.supabase.storage
      .from(this.storageBucket)
      .getPublicUrl(filename);

    return { url: data.publicUrl, filename };
  }

  private saveToLocal(
    file: Express.Multer.File,
    filename: string,
  ): { url: string; filename: string } {
    this.ensureUploadDir();
    writeFileSync(join(this.uploadDir, filename), file.buffer);
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

  async openFile(filename: string): Promise<ReadStream | Readable> {
    if (!SAFE_FILENAME.test(filename)) {
      throw new BadRequestException('Invalid filename');
    }

    const localPath = join(this.uploadDir, filename);
    if (existsSync(localPath)) {
      return createReadStream(localPath);
    }

    if (this.supabase) {
      const { data, error } = await this.supabase.storage
        .from(this.storageBucket)
        .download(filename);

      if (!error && data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        return Readable.from(buffer);
      }
    }

    throw new NotFoundException('File not found');
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
