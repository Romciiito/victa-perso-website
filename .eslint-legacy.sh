#!/usr/bin/env sh
# Pre-commit ESLint runner — invoked by lint-staged (see package.json
# "lint-staged" block) with the staged file paths as arguments.
#
# History: this script was a deliberate no-op from 2026-05-26 to 2026-08-02
# because three converging dependabot bumps broke every linting entrypoint on
# this project at once:
#
#   1. ESLint 10 dropped support for .eslintrc.json and the
#      ESLINT_USE_FLAT_CONFIG=false escape hatch.
#   2. Next.js 16 removed `next lint` (script `pnpm lint` errored out
#      treating "lint" as a directory argument).
#   3. eslint-plugin-react@7.37.5 (pulled in by eslint-config-next@16.2) —
#      crashes inside ESLint 10's rule-context API when auto-detecting the
#      React version ("contextOrFilename.getFilename is not a function").
#
# Fixed 2026-08-02 (audit Vlna 3A): flat config lives in eslint.config.mjs,
# `pnpm lint` runs `eslint . --max-warnings 0` directly, and the React-version
# auto-detect crash is dodged by pinning `settings.react.version` explicitly
# instead of `'detect'` (see eslint.config.mjs for the full writeup, including
# a second, separate parser crash on plain .mjs/.js files that had to be
# worked around the same way). This script now runs ESLint for real again.
exec pnpm exec eslint --max-warnings 0 "$@"
