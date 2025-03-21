
# Project Structure

The project is organized into two main directories:

## Frontend

Located in `src/frontend/`:
- Contains all UI components, pages, and client-side logic
- Organized by feature/functionality
- Imports backend services as needed

## Backend

Located in `src/backend/`:
- Contains API services, utilities, and data processing logic
- Includes model definitions in `lib/types.ts`
- Separates business logic from presentation

## Shared

Common utilities and configurations are at the root level in `src/`.

## Import Paths

- Frontend components should import from backend using `@backend/...` path
- For UI components, use `@/components/ui/...` path
- For internal frontend imports, use relative paths

## Benefits of This Structure

1. Clear separation of concerns
2. Easier to understand project organization
3. Simplifies future migration to a true client-server architecture
4. Makes testing easier by separating UI from business logic
