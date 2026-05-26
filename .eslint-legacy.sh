#!/usr/bin/env sh
# Pre-commit ESLint runner — currently a no-op.
#
# Reason (2026-05-26): Three converging dependabot bumps broke every linting
# entrypoint on this project and a proper fix is its own multi-package surgery
# that should not block urgent design / form / content commits:
#
#   1. ESLint 10 dropped support for .eslintrc.json and the
#      ESLINT_USE_FLAT_CONFIG=false escape hatch.
#   2. Next.js 16 removed `next lint` (script `pnpm lint` errors out
#      treating "lint" as a directory argument).
#   3. eslint-plugin-react@7.37.5 — pulled in by eslint-config-next 16.2 —
#      crashes inside ESLint 10's rule-context API
#      ("contextOrFilename.getFilename is not a function").
#
# TypeScript type-checks still run (Vercel + local `npx tsc --noEmit`) and
# Next.js production build runs full TS validation, so the safety net isn't
# completely gone. A flat-config migration + plugin version pinning is
# tracked as a follow-up.
exit 0
