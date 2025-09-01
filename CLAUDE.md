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
- `npx typeorm migration:generate -d dist/data-source.js src/migrations/MigrationName` - Generate new migration
- `npx typeorm migration:create src/migrations/MigrationName` - Create empty migration
- Database runs on port 5433 (as noted in README)

### Docker
- `docker-compose up` - Start application with PostgreSQL
- Application runs on port 3000 by default
- PostgreSQL container uses port 5432 internally, 5433 externally

## Architecture Overview

This is a NestJS TypeScript application with the following structure:

### Core Modules
- **AppModule** (`src/app.module.ts`) - Root module with TypeORM PostgreSQL configuration
- **UserModule** (`src/users/`) - User management with CRUD operations and email verification
- **AuthModule** (`src/auth/`) - JWT-based authentication with 30-day token expiration
- **EmailModule** (`src/email/`) - Email service for user verification using nodemailer
- **AddressesModule** (`src/addresses/`) - Address management linked to users

### Database Architecture
- **TypeORM** with PostgreSQL
- **Database Configuration**: Environment-based with fallbacks in `src/data-source.ts`
- **Entities**: `Users` entity with email verification fields, `Address` entity with user relationship
- **Migrations**: Located in `src/migrations/`
- **Synchronize**: Enabled in development, disabled in production

### Authentication & Verification Flow
- JWT tokens with global configuration and 30-day expiration
- JWT secret from constants (should use environment variables in production)
- Auth guard protection for routes
- **Email Verification**: New users receive verification tokens via email
  - Users created with `verified: false` and unique `verificationToken`
  - Email sent using nodemailer service with HTML template
  - Verification endpoint: `GET /auth/verify-email?token={token}`
  - Upon verification: `verified: true`, `verifiedAt` timestamp, token cleared

### Project Structure
```
src/
├── auth/           # Authentication module (JWT, guards, controllers, registration)
├── users/          # User management with email verification methods
│   ├── dto/        # Data Transfer Objects (CreateUserDto includes address)
│   ├── entities/   # Users entity with verification fields
├── addresses/      # Address management module
│   ├── dto/        # Address DTOs
│   ├── entities/   # Address entity with user relationship
├── email/          # Email service module (nodemailer configuration)
├── migrations/     # Database migrations (users and email verification)
├── app.module.ts   # Root module with all module imports
├── data-source.ts  # TypeORM CLI configuration with all entities
└── main.ts         # Application entry point
```

### Environment Configuration
- Uses `@nestjs/config` with global configuration
- **Database**: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
  - Falls back to localhost PostgreSQL with default credentials
- **Email Service**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - Falls back to localhost SMTP configuration
- **Frontend**: `FRONTEND_URL` - Used for email verification links (defaults to http://localhost:3000)

### Development Notes
- Jest configured for unit testing with `ts-jest`
- ESLint and Prettier for code quality with automatic fixing
- TypeScript with strict configuration
- Docker setup includes health checks for both app and database
- **Migration Workflow**: Build app first (`npm run build`), then use compiled JS files for TypeORM CLI commands
- **Email Testing**: Email sending is non-blocking - registration succeeds even if email fails

## API Architecture

### Authentication Endpoints
- `POST /auth/register` - User registration with automatic email verification
- `POST /auth/login` - User authentication with email/password
- `GET /auth/profile` - Get current user profile (requires JWT token)
- `GET /auth/verify-email?token={token}` - Verify user email address

### User Management
- `POST /users` - Create user (alternative to registration)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### User Entity Structure
- Basic fields: `id`, `fullName`, `email`, `password`, `type`, `phone`
- Verification fields: `verified` (boolean), `verificationToken`, `verifiedAt`
- Relationships: One-to-many with Address entity
- User types: `customer`, `business`, `admin`