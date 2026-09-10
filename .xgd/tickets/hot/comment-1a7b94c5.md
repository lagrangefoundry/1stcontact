---
uid: comment-1a7b94c5
id: COMMENT-2508
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T09:47:39.481802+00:00'
updated_at: '2026-09-10T09:47:39.481802+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-89cba15c
  kind: note
---

**REPORT-3709 (`report-89cba15c`) — FAIL: 1 violation, 2 warnings, 0 needs_review.**

## What I found

The story-level cycle passed ~10 minutes before this check, so STORY-99's body and the CAP-85 body were clean working references. Coverage at the AC level is **complete** — every in-scope story bullet maps to at least one of the 36 ACs, and I found no gap. The failure is a single consistency defect.

**Violation 1 — AC-966 asserts the model REQ-119 replaced.** Its criterion says the served bytes are *"identical to the rendered artifact the platform produced … not a placeholder, **a re-generation**, or a differently-serialised copy."* Both halves are false of what ships:

- The premise that an artifact exists to serve is contradicted by its own sibling AC-1031 (*"With no rendered output anywhere on disk … the origin still answers"*) and by the story body (*"There is no rendered artifact for the workspace to serve"*).
- The exclusion "a re-generation" names the shipped mechanism — `apps/control-app/src/router.ts:576-578` renders draft/edit **on request** from the stored definition.

AC-966 was authored 2026-08-07 under REQ-115; REQ-119 superseded it on 2026-08-10 and its prose has never been revised. It is the last surviving element of the pre-REQ-119 matrix. Its test (`tests/reconciliation-builder-workspace-origin.test.ts:121-147`) repeats the stale exclusion as a comment and passes only because the suite pre-renders to disk.

Warning 2 is the same repair from the exclusivity side (AC-966's evidence is a strict subset of AC-1032's, same shape). Warning 3 is AC-1036's traversal paragraph re-running AC-978's probe — carried forward, still unrepaired.

## Two things worth flagging

- **The prior ac-level report was never routed to a fix loop.** REPORT-5A4CF7A4 (2026-08-16, 3 violations) has no `fix_structural_validation` at `level=ac` after it — the last one is 2026-08-07. Two of its three violations were dissolved incidentally by today's story-level fix (the CAP-86/CAP-87 deferrals); the third is finding 1. I re-derived it independently rather than carrying it forward on trust.
- **I recorded four `info` findings specifically to stop a future check re-opening settled decisions** — most importantly that no AC should be added here for `/framework/edit-client.js` or `/api/copy`, since doing so would convert two closed coverage findings into exclusivity violations against AC-1006 and AC-992.

Read-only throughout: no tickets, tests, or code were modified.
