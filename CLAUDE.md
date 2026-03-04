# StockPot

AI-powered kitchen companion — React Native mobile app with a NestJS backend.

## Project Structure

- `/` — React Native app (iOS/Android)
- `/server/` — NestJS backend API

## Package Managers

- **App (root `/`):** Use `npm`. Do NOT use pnpm — Metro bundler cannot resolve pnpm's symlinked node_modules.
- **Server (`/server/`):** Use `pnpm`.

After installing native dependencies in the app, run `cd ios && pod install`.

## Tech Stack

### App
- React Native 0.84 + React 19
- TypeScript
- NativeWind v4 + Tailwind CSS 3 for styling
- React Navigation (native-stack)
- TanStack Query for data fetching/mutations
- react-native-keychain for secure token storage (iOS Keychain / Android Keystore)
- Lucide React Native for icons
- Design tokens in `theme/colors.js`

### Server
- NestJS 11
- TypeORM + PostgreSQL
- Passport + JWT auth (access + refresh tokens)
- class-validator for DTO validation
- Docker Compose for local Postgres

## Key Conventions

- Styling: Use NativeWind `className` props, not inline `StyleSheet`. Always use Tailwind classes for fontWeight (`font-bold`, `font-semibold`, etc.), letterSpacing (`tracking-tight`, `tracking-[0.5px]`), textTransform (`uppercase`), and opacity (`opacity-50`). Use inline `style` only for truly dynamic values (e.g. computed backgroundColor). Never introduce `react-native/no-inline-styles` lint warnings — fix them with Tailwind classes.
- API layer: Use `services/api.ts` (`api.get`/`api.post`) — not raw `fetch`. Route paths come from `services/routes.ts`.
- Data fetching: Use TanStack Query (`useQuery`/`useMutation`). Query keys come from `services/queryKeys.ts`.
- Auth state: Managed by `contexts/AuthContext.tsx` — use `useAuth()` hook for `isAuthenticated`, `saveTokens`, `clearTokens`.
- Components: Shared UI in `components/` (Button, TextInputRow, Divider).
- Navigation: `RootNavigator.tsx` conditionally renders auth screens vs app screens based on `isAuthenticated`.

## Code Reuse

Before writing new code, always search for existing patterns, utilities, and components that can be reused. Never duplicate logic that already exists.

- **Server utilities:** Check `server/src/utils/` first — AI response parsing (`ai-response.ts`), shelf life validation (`shelf-life.ts`), MIME normalization (`mime.ts`), recipe building (`recipe-builder.ts`). Also check `server/src/pantry/unit-conversion.ts` for `buildPantryMap` and conversion helpers.
- **Client components:** Check `components/` for shared UI (Button, TextInputRow, ScreenHeader, EmptyState, LoadingScreen, ErrorState, SectionHeader, InfoBanner, Divider, MacroProgressBar, PantryStatusIcon). Use these instead of building one-off equivalents.
- **Client hooks:** Check `hooks/` for existing query/mutation hooks before creating new ones.
- **Shared types:** Use `shared/enums.ts` (`@shared/enums`) for enums and types shared between client and server. Add new shared types there, not in individual files. Always use enum values (e.g. `PantryStatus.None`) instead of string literals (e.g. `'none'`) — in source code, return types, and tests.
- **Never use `any` casts.** Use generics instead (e.g., `parseObjectFromAI<Record<string, string>>()` not `parseObjectFromAI() as Record<string, string>`).
- When unsure whether a pattern exists, search the codebase before writing new code. If you find a similar pattern used elsewhere, follow it exactly.

## Testing

After making changes, always check if tests need to be added or updated. Follow existing test patterns in the codebase (see `*.spec.ts` files). Run `cd server && pnpm test` to verify all server tests pass before considering work complete.

## Git

Never commit or push without first confirming with the user. Always ask before running `git commit`, `git push`, or creating branches/PRs.

## Running Locally

```bash
# Start Postgres
docker compose up -d

# Start server
cd server && pnpm start:dev

# Start Metro (from project root)
npm start

# Build & run on device/simulator
npm run ios
```

## Config

- `config.ts` — API base URL (switches between local IP for dev and Railway URL for prod)
- `server/.env` — Backend environment variables (DB connection, JWT secret)
