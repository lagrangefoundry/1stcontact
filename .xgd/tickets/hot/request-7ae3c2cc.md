---
uid: request-7ae3c2cc
id: REQ-148
type: request
title: 'Behavior modules render in workerd: contact-form precompiled'
created_by: xgd
created_at: '2026-08-15T20:34:22.601169+00:00'
updated_at: '2026-08-15T20:34:22.601169+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: low
  story_points: 8
  auto_merge_back: true
  needs_review: true
  depends_on:
  - REQ-145
---

# Behavior modules render in workerd: `contact-form` precompiled

> **Status: draft.** Last in the sequence, and separable — nothing else waits on it.

`render.ts` imports `astro/container` lazily, so a pure-L1 site already renders in workerd
([[REQ-145]]). A site using a **behavior module** does not: the container API needs the
Vite/Astro transform to compile `.astro` sources, and workerd has no such transform.

## 1. Scope is one module

Across all three sites in `storage/sites/`, exactly one behavior module is in use:
`contact-form`, at 4 instances. `carousel` exists in the catalog but appears in no site. So this
is not "port the Astro catalog" — it is one module plus the mechanism, with `carousel` following
for free once the mechanism exists.

## 2. Two things to move to build time

- `packages/framework/src/modules/registry.ts` statically imports `./contact-form/index.astro`.
  The compiled render function must be produced at **build time** and bundled into the Worker.
  Astro's Cloudflare adapter does this for whole sites, so the mechanism is proven; the question
  is applying it to the module catalog alone.
- `modules/styles.ts` reads `index.astro` from disk **at runtime** with `readFileSync` to fold
  its `<style>` block into the generated CSS. That folding moves into the build.

## 3. Constraint that must not be lost

[[DOC-25]] and `CLAUDE.md`: a conforming behavior module ships **zero CSS**, save a declared set
of invariant elements pinned by obligation rather than taste — the honeypot must stay invisible,
the Turnstile mount must sit where the widget expects it. Precompilation must not become a route
by which module CSS re-enters, and the residual stylesheets being dismantled under REQ-96 must
not be entrenched by being baked into a bundle.

## 4. Acceptance criteria (provisional)

1. A site using `contact-form` renders in workerd, byte-identical to the Node render.
2. No `.astro` file is read at request time; no Vite transform runs in the Worker.
3. `carousel` renders through the same mechanism with no new per-module code, proving it is a
   mechanism and not a special case.
4. The module conformance harness ([[DOC-20]]) passes against precompiled modules.
5. Module CSS is no larger than today's — precompilation does not entrench what REQ-96 is removing.

## Origin

[[CHAT-25]]. The only remaining thing that needs Node in the render path.
