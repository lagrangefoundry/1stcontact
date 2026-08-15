---
uid: request-b18d2056
id: REQ-141
type: request
title: 'Workers-runtime test project: UATs that run inside workerd against real D1
  and R2 bindings'
created_by: xgd
created_at: '2026-08-15T20:30:39.280519+00:00'
updated_at: '2026-08-15T21:55:57.181270+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  blocked_by: []
  not_blocked_by:
  - bundle-d9226698
  dependency_eval_state:
    evaluated_at: '2026-08-15T20:31:58.367726+00:00'
    evaluated_against:
    - bundle-d9226698
  ready_since: '2026-08-15T21:38:04.123726+00:00'
  depends_on: []
---

# Workers-runtime test project

The store work that follows — site definitions in D1, asset bytes in R2 — can only be proved where it will run: **inside workerd, against real bindings**. This repository cannot do that today. This ticket makes it able to, and nothing else.

## 1. Why it does not work today

`vitest.config.mts` is a **single** config built on Astro's `getViteConfig`. That is not incidental: it wires the `.astro` transform into Vitest so behavior-module components render through the container API. The transform cannot run in workerd, and `@cloudflare/vitest-pool-workers` requires its own pool. One config cannot be both, so this is a structural change to the test setup rather than a dependency addition.

`@cloudflare/vitest-pool-workers` is also not installed here (lagrange-framework has 0.18.5).

## 2. What it is

Vitest split into **projects**:

- the existing Astro/node project, **unchanged** — same includes, same webui aliases, same timeouts;

- a new **workerd** project with `d1Databases` and `r2Buckets` bindings, reached from tests via `import { env } from 'cloudflare:test'`.

**Precedent to follow, not invent.** `lagrange-framework` already solved this exact split: its root `vitest.config.mts` composes per-component project configs, and `components/ticketing/js/vitest.config.js` is the workerd one (`cloudflareTest({ miniflare: { d1Databases: ['DB'] } })`). It hit the same wall we do — its `DocDirStore` filesystem reader cannot run in workerd — and answered it with a sibling `vitest.node.config.js`. Its 69 tests run in ~1.8s.

## 3. Deliverables

- `@cloudflare/vitest-pool-workers` added to devDependencies.

- Root config becomes `projects: [...]`. The Astro project's behaviour is what it is today — this ticket changes where tests run, never what they assert.

- A workerd project config carrying `D1` and `R2` bindings and its own `include`.

- A file-naming convention that routes a test to the right project, stated once and followed.

- One UAT per project proving it runs where it claims to.

## 4. Acceptance criteria

1. `pnpm test` runs both projects; every test green before this ticket is green after it.

2. A UAT in the workerd project reaches a D1 binding through `cloudflare:test` and applies a schema.

3. A UAT in the workerd project writes and reads back an R2 binding.

4. A test importing `node:fs` runs in the node project and is excluded from the workerd project.

5. The Astro container-render UATs still pass — the `.astro` transform is intact, proving the split did not cost the thing the single config existed for.

6. Clean `pnpm -r build` and typecheck.

## Origin

[[CHAT-25]] — putting the builder on Cloudflare. This blocks the store port and every store UAT after it, so it is first.