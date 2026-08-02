// Flat ESLint config — required by ESLint 10, which dropped support for
// `.eslintrc.json` (and the `ESLINT_USE_FLAT_CONFIG=false` escape hatch).
// `next lint` also no longer exists in Next.js 16, so `pnpm lint` now invokes
// `eslint .` directly (see package.json). eslint-config-next@16.2.6 ships a
// ready-made flat-config array; we spread it and layer project-specific
// ignores on top (audit gate finding — Vlna 3A, see decisions.md).
import nextConfig from 'eslint-config-next';
import tseslint from 'typescript-eslint';

// eslint-plugin-react@7.37.5 (pulled in by eslint-config-next@16.2.6) crashes
// under ESLint 10 when its `react/display-name` rule tries to *auto-detect*
// the installed React version: `settings.react.version === 'detect'` makes it
// call the old `context.getFilename()` API, which ESLint 10's rule-context no
// longer exposes ("contextOrFilename.getFilename is not a function" — this is
// the exact crash `.eslint-legacy.sh` was neutered to dodge). Pinning the
// version explicitly (matches package.json's `react: ^19.0.0`) skips the
// detection code path entirely instead of waiting on an upstream plugin fix.
const patchedNextConfig = nextConfig.map((entry) =>
  entry?.settings?.react
    ? { ...entry, settings: { ...entry.settings, react: { ...entry.settings.react, version: '19.0.0' } } }
    : entry,
);

const config = [
  {
    // Applied before eslint-config-next's own ignores (`.next/**`, `out/**`,
    // `build/**`, `next-env.d.ts`) — these add the rest of what this repo
    // needs excluded. `.claude/worktrees/**` in particular holds full,
    // independent git worktree checkouts (each with its own node_modules)
    // used by parallel Claude Code sessions — linting them would be slow,
    // pointless, and could pick up another session's in-progress code.
    ignores: [
      'node_modules/**',
      '.vercel/**',
      '.turbo/**',
      '.cache/**',
      'coverage/**',
      '.claude/**',
      '.workforce/**',
      'public/**',
      'pnpm-lock.yaml',
    ],
  },
  ...patchedNextConfig,
  {
    // eslint-config-next's base "next" block (see node_modules/eslint-config-next/
    // dist/index.js) parses every `**/*.{js,jsx,mjs,ts,tsx,mts,cts}` file with
    // `eslint-config-next/dist/parser.js`, which is a thin wrapper around
    // `next/dist/compiled/babel/eslint-parser` — Next.js's own vendored, frozen
    // copy of `@babel/eslint-parser`. Its bundled `eslint-scope` predates the
    // `ScopeManager#addGlobals` API that ESLint 10 core now calls unconditionally,
    // so any file that reaches this parser crashes the whole run with
    // "TypeError: scopeManager.addGlobals is not a function" — reproduced with a
    // stock `[...nextConfig]` array and zero project-specific config, i.e. this is
    // an eslint-config-next@16.2.6 / eslint@10.4.0 incompatibility, not something
    // introduced here (peer-dependency check even confirms it: eslint-plugin-import/
    // -react/-jsx-a11y all declare `eslint <=9` peer ranges, `pnpm install` warns
    // "unmet peer eslint@\"...^9\": found 10.4.0" for all three).
    //
    // `**/*.ts`/`**/*.tsx` dodge this because the later "next/typescript" block
    // (also in eslint-config-next) already re-parses them with
    // `typescript-eslint`'s parser, which has no such issue — confirmed by linting
    // `src/lib/sanitize.ts` successfully before this block existed. This repo has
    // zero plain `.js`/`.jsx` source files (100% TypeScript app code); the only
    // files that hit the broken path are root-level Node tooling
    // (`eslint.config.mjs` itself, `scripts/*.mjs`). Re-parsing those few files
    // with typescript-eslint's parser too (a strict superset that parses plain JS
    // without complaint) sidesteps the incompatibility without patching a file
    // vendored inside `next`'s own compiled output.
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { sourceType: 'module' },
    },
  },
];

export default config;
