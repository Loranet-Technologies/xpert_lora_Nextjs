<!--
Sync Impact Report:
Version: 1.0.0 (initial creation)
Modified Principles: N/A (initial creation)
Added Sections: Core Principles, Technology Stack, Security Requirements, Development Workflow
Removed Sections: N/A
Templates Status:
  ✅ spec-template.md - No updates needed (already supports user stories, requirements)
  ✅ plan-template.md - No updates needed (already has Constitution Check section)
  ✅ tasks-template.md - No updates needed (already supports optional tests)
Follow-up TODOs: None
-->

# Xpert LoRa Constitution

## Core Principles

### I. Type Safety First (NON-NEGOTIABLE)

All code MUST be written in TypeScript with strict type checking enabled. Type definitions MUST be explicit and avoid `any` types except where absolutely necessary (with justification). Type safety violations block feature completion. Rationale: Prevents runtime errors, improves developer experience, enables better IDE support, and catches integration issues early.

### II. API Contract Consistency

All external API integrations (ERPNext, Keycloak, Backend API) MUST have clearly defined contracts documented in feature specifications. API route handlers MUST validate request/response types. Changes to API contracts require coordination and versioning. Rationale: Ensures reliable integration with external services and prevents breaking changes.

### III. Security by Default

Authentication and authorization MUST be implemented using Keycloak integration. All API routes MUST validate authentication tokens. Sensitive operations MUST enforce role-based access control. Environment variables MUST be used for all configuration secrets (never hardcoded). Rationale: Protects user data and system integrity in a multi-tenant LoRaWAN management system.

### IV. Component Reusability

UI components MUST be built using shadcn/ui patterns and placed in `components/ui/` for shared components. Feature-specific components MUST be organized by domain. Components MUST be self-contained with clear prop interfaces. Rationale: Maintains consistent UI/UX, reduces duplication, and accelerates feature development.

### V. Environment Configuration

All environment-dependent configuration MUST use Next.js environment variables with `NEXT_PUBLIC_` prefix for client-side access. Configuration MUST be centralized in `lib/config/` modules. Default values MUST be provided for development. Production deployments MUST validate required environment variables at startup. Rationale: Enables safe deployment across environments and prevents configuration errors.

### VI. Testing Discipline (OPTIONAL but RECOMMENDED)

When tests are included in feature specifications, they MUST be written before implementation (TDD). Integration tests MUST verify API contract compliance. Component tests MUST validate user interactions. Tests are OPTIONAL per feature but REQUIRED for security-critical paths (authentication, authorization, data validation). Rationale: Ensures reliability and prevents regressions, especially for critical authentication and data management flows.

## Technology Stack Requirements

**Framework**: Next.js 15+ (App Router)  
**Language**: TypeScript 5+ with strict mode  
**UI Library**: React 19+  
**Styling**: Tailwind CSS 4+  
**Component Library**: shadcn/ui (Radix UI primitives)  
**State Management**: TanStack Query (React Query) for server state  
**Authentication**: NextAuth.js with Keycloak provider  
**Build Tool**: Turbopack (Next.js default)  
**Deployment**: Docker containerization required for production

## Security Requirements

- All API routes MUST validate authentication via Keycloak JWT tokens
- Role-based access control (RBAC) MUST be enforced at both UI and API levels
- Environment variables containing secrets MUST NOT be committed to version control
- API responses MUST NOT expose sensitive internal system details
- CORS MUST be properly configured for production environments
- HTTPS MUST be used in production (enforced via deployment configuration)

## Development Workflow

### Code Review Requirements

- All PRs MUST pass TypeScript compilation without errors
- All PRs MUST pass ESLint checks
- API route changes MUST include documentation of contract changes
- Security-sensitive changes (auth, permissions, data access) MUST be explicitly reviewed

### Quality Gates

- Type safety: Zero `any` types without explicit justification
- Build: Production build MUST succeed without errors
- Linting: Zero ESLint errors (warnings acceptable with justification)
- Environment: All required environment variables MUST be documented

### Deployment Process

- Production deployments MUST use Docker containers
- Environment variables MUST be validated before container startup
- Database migrations (if applicable) MUST be tested in staging
- Rollback procedures MUST be documented for each deployment

## Governance

This constitution supersedes all other development practices and coding standards. Amendments to principles require:

1. Documentation of the rationale for change
2. Impact assessment on existing features
3. Update to this constitution with version increment:
   - **MAJOR**: Backward-incompatible principle changes or removals
   - **MINOR**: New principles or significant expansions
   - **PATCH**: Clarifications, wording improvements, non-semantic updates
4. Propagation of changes to affected templates and documentation

All PRs and code reviews MUST verify compliance with constitution principles. Complexity beyond these principles MUST be justified in feature specifications with explicit rationale for why simpler alternatives are insufficient.

**Version**: 1.0.0 | **Ratified**: 2026-01-14 | **Last Amended**: 2026-01-14
