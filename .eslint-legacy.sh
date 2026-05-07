#!/usr/bin/env sh
# Wrapper for lint-staged: runs ESLint in legacy config mode (ESLint 9 migration)
# ESLINT_USE_FLAT_CONFIG=false lets ESLint 9 read .eslintrc.json
ESLINT_USE_FLAT_CONFIG=false ./node_modules/.bin/eslint --max-warnings 0 "$@"
