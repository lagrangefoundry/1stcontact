---
uid: comment-f2ceca02
id: COMMENT-838
type: comment
title: Claude response for review report
created_by: xgd
created_at: '2026-08-08T00:21:18.014400+00:00'
updated_at: '2026-08-08T00:21:18.014400+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8ea06ca0
  kind: note
---

# STORY-99 Review: **FAIL** — `report-8ea06ca0` (REPORT-1671)

## What passes

The BUG-32 rename itself is done well. The scope has exactly one definition (`tools/generate/src/cli/webui.ts:104`), `builder.ts` composes both former hardcoded literals from it, the bounded browser-source exception is held in step by a real cross-surface UAT rather than trusted, and the identity/wiring evidence is unconditional — so a half-completed rename fails loudly instead of skipping green. Lint 0/0, build clean, 23/23 AC UATs pass (re-run and confirmed locally, `skipped: 0`, which is the point).

I verified the two things most likely to be quietly hollow:
- **AC-975 really measures a browser** — system Chrome 151 launches on this machine, so the test executed rather than warn-and-returning.
- **AC-961's identity check is a live discriminator** — both `@gendevlabs` and `@lagrangefoundry` are still populated in the shared store, so the `package.json.name` assertion is what actually rejects the leftover.

## The fail cause — AC-977

Every JSON response the origin returns is served **cacheable**. `json()` at `builder.ts:131-139` writes only `content-type` and `content-length`. Confirmed against a live origin:

```
GET /api/sites   -> 200 application/json   (no cache-control)
GET /api/assets  -> 200 application/json   (no cache-control)
GET /            -> 200  cache-control: no-store, must-revalidate
GET /preview/…/  -> 200  cache-control: no-store, must-revalidate
```

The AC is categorical: *"There is no exempt response."* `/api/sites` populates the site selector, so a cached listing hides a newly created site behind a workspace that looks like it's working — precisely the symptom the criterion exists to prevent. The in-code comment at `builder.ts:169-173` asserts the opposite and is wrong: `json()` doesn't go through `sendFile`.

The UAT probes the document, browser source, components and rendered pages — no API route — so the violating implementation passes it. Fix is `json()` + adding the API class to the probe set.

## Warnings (not blocking)

- **TAS/design docs contradict the code.** `report-62f5dd5e`, `doc-c49667b3` and the story all say the store is *"never stubbed, aliased, or vendored"* and prescribe a worktree-parent install; `vitest.config.mts:47` now aliases. I couldn't construct a silent-green from it — the aliases derive from `webuiPackageDir` and point at the real out-of-repo store, and a one-sided rename still fails loudly in both directions — so this is an unreconciled divergence, not an evidence hole. But three active artifacts assert the opposite of what ships.
- **Six red tests in adjacent suites.** Pre-existing, not caused by this branch (behavioural code untouched; the old scope still resolves on main, so those suites already ran and failed there). One of them asserts AC-971's behaviour, so I traced it: `toolbar.js:101` re-renders on `site`, replacing the anchor, and the REQ-115 test holds a captured handle across that. `panel.js` emits `src` before `site`, so the replacement anchor is built correct — the live control satisfies AC-971; the failure is a stale-DOM-handle defect in the older suite. Worth a follow-up ticket regardless.
- **Ticket body misrecords `index.html`** — it says "scope updated"; the change deletes it. Deletion is the correct call (a committed copy of the generator's output is a second definition site) and nothing read it, but the record should match.
