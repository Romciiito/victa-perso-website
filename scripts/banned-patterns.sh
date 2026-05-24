#!/usr/bin/env bash
# banned-patterns.sh — taste-skill anti-slop pre-commit guard
# Per docs/superpowers/specs/2026-05-24-design-system-v2-design.md §9
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Only check staged .tsx + .ts + .css files
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx|ts|css)$' || true)

if [ -z "$FILES" ]; then
  exit 0
fi

FAIL=0

check() {
  local pattern="$1"
  local message="$2"
  local matches
  matches=$(echo "$FILES" | xargs grep -nE "$pattern" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "✗ Banned pattern: $message"
    echo "$matches" | head -10
    echo ""
    FAIL=1
  fi
}

# Typography
check "Inter_Tight|'Inter'|\"Inter\"" "Inter font family (banned by taste-skill §7, use Geist)"

# Layout
check 'h-screen[^a-zA-Z]' "h-screen — use min-h-[100dvh] (iOS viewport bug)"

# Color — exclude CSS custom property definitions (--name: #FFFFFF is legitimate
# token declaration, not a component-level hardcode)
check_color() {
  local matches
  matches=$(echo "$FILES" | xargs grep -nE "#000000|#FFFFFF" 2>/dev/null | grep -vE "^\s*--[a-zA-Z0-9_-]+\s*:" | grep -vE ":\s+--[a-zA-Z0-9_-]+\s*:" || true)
  if [ -n "$matches" ]; then
    echo "✗ Banned pattern: Pure black/white literal — use --ink / --bg tokens"
    echo "$matches" | head -10
    echo ""
    FAIL=1
  fi
}
check_color

# Content (Jane Doe effect)
check 'John Doe|Jane Doe|Acme Corp|Lorem ipsum' "Generic placeholder content (use Czech realistic)"
check "Elevate|Seamless|Unleash|Next-Gen|Game-changer|Delve" "AI copywriting cliché (taste-skill §7 content)"

# Tailwind defaults that taste-skill bans
check 'shadow-md|shadow-lg|shadow-xl' "Tailwind shadow defaults — use --shadow-card tokens"

if [ $FAIL -eq 1 ]; then
  echo ""
  echo "Pre-commit blocked by banned patterns above."
  echo "Reference: docs/superpowers/specs/2026-05-24-design-system-v2-design.md §9"
  exit 1
fi

exit 0
