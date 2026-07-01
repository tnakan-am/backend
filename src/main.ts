import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Allow exact origins, plus wildcard patterns (e.g. Firebase PR preview
  // channels like https://project--pr61-branch-hash.web.app). An entry
  // containing "*" becomes a RegExp; "*" matches within a single DNS label.
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const origins = (process.env.CORS_ORIGIN || 'http://localhost:4200')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((o) =>
      o.includes('*')
        ? new RegExp(`^${o.split('*').map(escapeRegExp).join('[^.]*')}$`)
        : o,
    );

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
