# VICTA — Development Guide

Read this doc before: running the project locally, writing a test, adding a route/model/page, or deploying.

---

## Prerequisites



- **Node.js 20+** — `node --version`
- **npm 10+** — `npm --version`



- Copy `.env.example` to `.env` and fill in all required values (see `docs/claude/env-vars.md`)

---

## Running Locally


```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Start dev server
npm run dev
# → http://localhost:3000
```



---

## Running Tests




### Frontend

```bash
cd frontend
npm test                   # Jest + React Testing Library (unit)
npm run test:watch         # watch mode
npm run e2e                # Playwright end-to-end
```


---

## Common Tasks




### Add a frontend page

1. Create `frontend/src/app/(dashboard)/<route>/page.tsx`
2. If the page needs data, add the API call to `frontend/src/lib/api.ts`
3. Wrap in a TanStack Query hook: `frontend/src/hooks/use<Resource>.ts`
4. Add the nav link to the sidebar/nav component

### Add a UI component

1. Check if a shadcn/ui primitive covers the need first (`npx shadcn-ui add <component>`)
2. If custom, create in `frontend/src/components/<domain>/<ComponentName>.tsx`
3. Use Tailwind for styling — no inline styles, no CSS modules
4. Export from the domain barrel: `frontend/src/components/<domain>/index.ts`

### Add a Zustand store

1. Create `frontend/src/stores/<domain>Store.ts`
2. Define the state interface and actions
3. Export a typed hook: `export const use<Domain>Store = create<State>()(...)`




---

## Deployment






### Frontend deploy

```bash
cd frontend
npm run build          # static export or server build
# Deploy dist/out/ to your hosting platform
```



