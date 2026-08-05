import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

/**
 * Vitest needs to resolve the same `@/*` -> `src/*` alias Next.js reads from
 * `tsconfig.json`'s `compilerOptions.paths`. Until now every test file used
 * relative imports (`../rate-limit`, etc.), so no alias config existed. Chat
 * lib modules (Vlna 5) and `src/app/api/chat/route.ts` follow the rest of the
 * codebase's convention of importing shared modules via `@/lib/...` /
 * `@/config/...` — this makes those imports resolvable under plain `vitest run`
 * (outside of Next's own webpack/turbopack build, which already understands
 * `tsconfig.json` paths natively).
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
