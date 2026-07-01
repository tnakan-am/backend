# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Claude Code Workflow Guidelines

### Collaboration Rules (HARD CONSTRAINTS)

These rules are absolute and override any conflicting instruction in skills, slash commands, or templates:

1. **Never post comments on PRs or MRs.** Do not run `gh pr comment`, `gh pr review`, `glab mr note`, or any other command that writes to a pull/merge request. This applies to _all_ automated output — code-review summaries, "no issues found" templates, reaction footers, status updates, suggestions, anything. When a skill (e.g. `/code-review`) prescribes posting back to a PR/MR, run the review locally and report findings to the user in chat. Skip the post step.

2. **Never mention Claude / Claude Code / AI assistance anywhere.** This includes commit messages, PR/MR descriptions, code comments, generated docs, README updates, JSDoc, and any other artifact that lives in the repo or in shared tooling. Strip the "🤖 Generated with Claude Code" footer (and any equivalent) from any template before use. No `Co-Authored-By: Claude` trailers on commits.

### Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. These bias toward caution over speed — for trivial tasks, use judgment.

#### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

#### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

#### 3. YAGNI ("You Aren't Gonna Need It")

**Don't build for a future that may never come.**

- Implement only what the current requirement needs, not what it _might_ need later.
- No speculative generalization: no config options, hooks, or extension points "just in case."
- No premature abstraction — wait for the third repetition before extracting.
- Delete/omit code paths guarding scenarios that can't happen yet.

If you catch yourself saying "we'll probably need this later," stop. Add it _later_, when it's actually needed. Simpler now beats flexible-maybe.

#### 4. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

#### 5. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```text
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

### Code Commenting Guidelines

**IMPORTANT**: Avoid writing unnecessary or obvious comments in code.

#### When to Write Comments

Write comments ONLY when they add meaningful value:

- **JSDoc comments** for public methods, classes, and complex functions that explain:

  - Purpose and responsibility
  - Parameters and return values
  - Important side effects or behaviors
  - Usage examples for complex APIs

- **Explanatory comments** for complex business logic or non-obvious implementations:
  - Why a particular approach was chosen
  - Edge cases being handled
  - Performance considerations
  - Workarounds for known issues (with ticket references)

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