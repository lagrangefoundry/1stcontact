---
uid: comment-667e2abf
id: COMMENT-1297
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T12:04:07.513152+00:00'
updated_at: '2026-08-20T12:04:07.513152+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c2092e9d
  kind: note
---

Report created and verified: **REPORT-2427** (`report-c2092e9d`) — **FAIL**, 2 violations / 1 warning / 0 needs_review.

## What this cycle did

Attempt 10's five fixes are **verified landed** in both story bodies (re-read via `xgd ticket get --json`, not taken from the fix report's summary). None of this cycle's findings is a repeat.

I ran the sweep the prior report recommended but no cycle had executed — enumerating every reported field on the capability's 11 public return types (~45 fields) against the matrix — plus a new capability-body-vs-story-tree scope reconciliation.

## Findings

**1. violation / coverage / STORY-84** — The fold derives a *fourth* config fact the story's enumeration omits: `labelMode`, read off the a11y tree's `nameSource` (`forms.ts:242`, documented `:53-62`). REQ-88's Round-9 pass (in BUNDLE-10, free_and_reconciled) asked for it explicitly — "Carried as `labelMode` through fold → config → render" — and framed it as a *geometry* defect, not styling: the module's unwanted label rows cost +25/+44/+63px of progressive drift down the three fields. Tested at `tests/req88-form-labelling-and-submit.test.ts:141`/`:256`; zero derivation hits across all 31 story bodies (STORY-82's two hits are the config-field side only).

**2. violation / consistency / capability body CAP-71** — The Scope list stops at the fold, the three analytic probes and recovery, while STORY-86 owns an entire further boundary: REQ-94's cross-gate reconciliation (`cli/gate.ts`, the `1c gate` verb — perceptual floor, reference coverage, five named verdicts). No capability body of the 26 claims it, and CAP-63's ownership rule names only `repro`/`l1-gate`/`refold` as CAP-71's — the `gate` verb is unowned at capability level. This is the element every prior cycle logged as "aligned" without checking its scope list against the tree beneath it.

**3. warning / coverage / STORY-84** — `submitLabel` (`fold.ts:2279` → `repro.ts:162`) carries the captured button's words as behavioural copy; the story expresses only the geometric half of that same REQ-88 fix.

## Root cause of the ten-cycle tail

REQ-88's substance is split between its own ticket and `## Round-5…Round-10` sections nested under `## REQ-88:` in BUNDLE-10. Prior cycles read the ticket and the bundle's `## BUG-N:` sections but not the round-pass sections — which is why findings 1 and 3 survived ten attempts. That's recorded in the report's ledger note.

One operational note: `xgd report create` printed `Push failed (may be offline)` — the sandbox has no network. The ticket was created and committed locally and reads back correctly; it will need a push from an environment with remote access.
