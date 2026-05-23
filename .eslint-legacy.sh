#!/usr/bin/env sh
# Wrapper for lint-staged: runs ESLint in legacy config mode (ESLint 9 migration)
# ESLINT_USE_FLAT_CONFIG=false lets ESLint 9 read .eslintrc.json
# --resolve-plugins-relative-to=. scopes plugin resolution to current worktree
# (avoids duplicate-plugin error when parent dir also has node_modules)
ESLINT_USE_FLAT_CONFIG=false ./node_modules/.bin/eslint --resolve-plugins-relative-to=. --max-warnings 0 "$@"
