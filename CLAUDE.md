# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run build` - Build the NestJS application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with file watching
- `npm run start:debug` - Start with debugging enabled
- `npm run start:prod` - Start in production mode

### Testing
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:debug` - Run tests with debugging

### Code Quality
- `npm run lint` - Run ESLint and fix issues automatically
- `npm run format` - Format code using Prettier

### Database
- `npm run migration:run` - Run TypeORM migrations
- Database runs on port 5433 (as noted in README)

### Docker
- `docker-compose up` - Start application with PostgreSQL
- Application runs on port 3000 by default
- PostgreSQL container uses port 5432 internally, 5433 externally

## Architecture Overview

This is a NestJS TypeScript application with the following structure:

### Core Modules
- **AppModule** (`src/app.module.ts`) - Root module with TypeORM PostgreSQL configuration
- **UserModule** (`src/users/`) - User management with CRUD operations  
- **AuthModule** (`src/auth/`) - JWT-based authentication with 30-day token expiration

### Database Architecture
- **TypeORM** with PostgreSQL
- **Database Configuration**: Environment-based with fallbacks in `src/data-source.ts`
- **Entities**: Currently only `Users` entity
- **Migrations**: Located in `src/migrations/`
- **Synchronize**: Enabled in development, disabled in production

### Authentication Flow
- JWT tokens with global configuration
- JWT secret from constants (should use environment variables in production)
- Auth guard protection for routes
- 30-day token expiration

### Project Structure
```
src/
├── auth/           # Authentication module (JWT, guards, controllers)
├── users/          # User management module
│   ├── dto/        # Data Transfer Objects
│   ├── entities/   # TypeORM entities
├── migrations/     # Database migrations
├── app.module.ts   # Root module with database config
├── data-source.ts  # TypeORM configuration for CLI
└── main.ts         # Application entry point
```

### Environment Configuration
- Uses `@nestjs/config` with global configuration
- Database connection configurable via environment variables:
  - `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- Falls back to localhost PostgreSQL with default credentials

### Development Notes
- Jest configured for unit testing with `ts-jest`
- ESLint and Prettier for code quality
- TypeScript with strict configuration
- Docker setup includes health checks for both app and database