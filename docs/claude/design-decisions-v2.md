# Design Decisions v2 (D-008)

> **Status**: ACTIVE — replaces `docs/claude/design-decisions.md` (which documented D-001).
> The legacy file is preserved for historical reference until PR 7 cleanup.

## Quick reference

- **Spec**: `docs/superpowers/specs/2026-05-24-design-system-v2-design.md`
- **Plans**: `docs/superpowers/plans/2026-05-24-design-system-v2-*.md`
- **Mockups**: `docs/design-exploration/2026-05-24-soft-skill-vibes/`
- **D-008 decisions.md entry**: appended in PR 7 (cleanup PR)

## Decisions overview

| Token | D-001 (locked 2026-05-06) | D-008 (locked 2026-05-24) |
|-------|---------------------------|---------------------------|
| Sans font | Inter Tight | **Geist** |
| Mono font | Geist Mono | Geist Mono |
| Accent font | none | **Newsreader italic** (selective) |
| Light bg | `#FAFAFA` | **`#F4F5F7`** |
| Light accent | `#3730A3` indigo | **`#1F2937` slate** |
| Dark accent | `#7367E5` indigo | **`#DCD7FF` lavender** |
| Background | 40×40 grid 4% | **Radial mesh orbs + noise** |
| Card radius | 8px | **22px inner / 28px outer (Double-Bezel)** |
| CTA buttons | rounded 6px | **Pill 999px with Button-in-Button arrow** |
| Headline weight | 500 | **600** |
| Layout grammar | Single-col left | **Editorial Split + Asymmetrical Bento** |

## When to read this

- Adding a new page component → see spec §5 layout grammar table
- Touching colors → see spec §3.1, never hardcode hex
- Touching shadows → see spec §3 ambient shadow tokens
- CTA design → see spec §4.1 Button refactor + soft-skill §4.B
- Anything that smells generic → see spec §9 banned patterns list

## Locked items (do not change without D-### successor)

- Geist as sans (no Inter Tight return)
- Slate accent light / lavender dark (no indigo return)
- Editorial Split + Asymmetrical Bento as layout grammar
- Variant C (visual canvas) for hero right column
