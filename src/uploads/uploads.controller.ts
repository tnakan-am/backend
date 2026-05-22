import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';

const uploadsDir = process.env.UPLOADS_DIR || 'uploads';

function ensureDir(path: string): void {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

// Allowlist maps a trusted mime type to the extension we control.
// The saved filename's extension is derived from this map — never from the
// client-supplied originalname — so a spoofed `.html` can never reach disk.
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const user = (req as any).user as JwtPayload | undefined;
          const dir = join(process.cwd(), uploadsDir, user?.sub ?? 'anonymous');
          ensureDir(dir);
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = MIME_TO_EXT[file.mimetype];
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!MIME_TO_EXT[file.mimetype]) {
          cb(new BadRequestException('Unsupported file type'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const base =
      process.env.UPLOADS_PUBLIC_URL || 'http://localhost:3000/uploads';
    const url = `${base}/${user.sub}/${file.filename}`;
    return { url, filename: file.filename, size: file.size };
  }
}
