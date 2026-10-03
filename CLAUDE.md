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

#### 2. Simplicity First (YAGNI)

**Minimum code that solves the current problem. Nothing speculative.**

- No features beyond what was asked, and nothing for requirements that only _might_ come later.
- No config options, hooks, extension points, or other flexibility that wasn't requested.
- No premature abstraction — wait for the third repetition before extracting.
- No error handling or code paths for scenarios that can't happen.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify. If you catch yourself saying "we'll probably need this later," add it later, when it's actually needed.

#### 3. Surgical Changes

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

#### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

### Code Commenting Guidelines

Avoid unnecessary or obvious comments in code.

#### When to Write Comments

Write comments only when they add meaningful value:

- **JSDoc comments** for complex functions and non-obvious public APIs that explain:

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

### Database
- `npm run migration:run` - Run TypeORM migrations
- `npx typeorm migration:generate -d dist/data-source.js src/migrations/MigrationName` - Generate new migration
- `npx typeorm migration:create src/migrations/MigrationName` - Create empty migration
- Database runs on port 5433 (as noted in README)
- `synchronize` is on only when `NODE_ENV=development`, so entity changes reach the local DB without a migration; production needs a generated migration

### Development Notes
- **Migration Workflow**: `migration:generate` reads `dist/data-source.js`, so run `npm run build` first; `migration:run` runs from source via ts-node and needs no build
- **Email Testing**: Verification-email failures are caught and logged - registration succeeds even if the email fails to send
