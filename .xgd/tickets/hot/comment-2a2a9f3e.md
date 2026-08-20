---
uid: comment-2a2a9f3e
id: COMMENT-1255
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T04:23:45.017551+00:00'
updated_at: '2026-08-20T04:23:45.017551+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-afa769c6
  kind: note
---

**PASS** — report `REPORT-2363` (`report-afa769c6`): 0 violations, 1 warning, 0 needs_review.

## What I verified

Attempt 10's repair landed and, unlike attempts 8–9, actually closed the recurring finding. I re-derived rather than trusted:

- `'assign'` is registered (`cli/args.ts:41`); registry is 14 members.
- **Third independent derivation**: classified all 35 distinct `flags.*` reads in `cli/index.ts` by how each is consumed — exactly 14 boolean-context, 21 `typeof`-guarded or parser-fed. Derived set == registry.
- **Fourth, from the opposite direction**: every `--help` flag documented without a value placeholder is registered, so no bare toggle is left unregistered.
- `vitest run tests/req58-multi-viewport.test.ts` → **20 passed, 2 skipped, 0 failed** (skips are Chromium-gated; no browser here).
- The new derived-set UAT is load-bearing by construction — it asserts set *equality*, so an unregistered boolean read makes the derived set larger and the assert fails.
- All six story bodies scanned clean of the seven stale capability tokens attempt 9 fixed; the four unbundled requests (REQ-64/72/73/76) confirmed attributed by reading story `fields` directly.

## The one thing prior attempts missed

REQ-148 (`ready_to_reconcile` — imminent, so it counts) explicitly deletes *"the `needsAstro` branch in `renderSiteFiles`"*, which is exactly what STORY-79 §4 and AC-739 assert conditionally. Attempt 10 dismissed it as "other capabilities" — right about who owns its *new* behavior, but a retirement lands in the capability owning the *retired* behavior.

I filed it as **info, not a violation**: the code hasn't landed (`render/render.ts:264` still has `needsAstro`; both `.astro` sources still present), so §4 is accurate against today's tree, and rewriting the story to describe code that doesn't exist would itself be drift.

The generalizable point, which I put in the editor notes: the ledger has only ever asked *"does this intent add anything this capability owns?"* It also needs to ask *"does this intent remove anything this capability's stories currently assert?"*

## Warning (non-blocking)

`CLI_SOURCES` at `tests/req58-multi-viewport.test.ts:96` is a hand-maintained one-element literal — the same "manually-kept list believed complete" shape the derivation was introduced to eliminate, one level up. Exposure is low (a binary-safe `grep -ran` over `tools/generate/src` returns only `cli/index.ts` and `cli/args.ts`), and I verified widening it to a directory read is safe: `args.ts`'s only writes are `flags[name] = true`, a computed subscript the read regex doesn't match.
