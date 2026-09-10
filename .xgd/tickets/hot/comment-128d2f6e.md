---
uid: comment-128d2f6e
id: COMMENT-2558
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T16:19:19.213805+00:00'
updated_at: '2026-09-10T16:19:19.213805+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e994f603
  kind: note
---

**PASS** — REPORT-3759 (`report-e994f603`), 0 violations, 0 warnings, 0 needs_review.

## What I checked

Attempt 6's fix (REPORT-3758) claimed it closed all four of REPORT-3757's findings with one capability-body rewrite. I verified that against the live ticket rather than the fix report:

- `capability-a12e557f` shows `updated_at: 2026-09-10T16:14:22Z`, `last_field_updated: body` — the edit is real.
- Bullet 1 now names revisions by number with the digest as "an audit value, not an address"; bullet 2 names the surviving draft/published split; the out-of-scope reason no longer says definitions stay canonical on the operator's machine; the framing paragraph is off the local-origin premise. Bullet 5 was re-anchored to the forward-only guarantee.
- A term sweep of the body for `naming it by its contents`, `operator's machine`, `on disk`, `locally`, `manifest`, `--dry-run` returns zero. `shareable` / `prune` / `digest` / `sha` hit only inside the new "What was retired, and why it was recorded rather than ported" section — the same house style STORY-94/95/96 use.

## Independent checks beyond the prior findings

- **Ledger re-swept** — 50 requests, 39 bugs. Nothing reconciled or drafted after BUNDLE-20 carries a delivery ask; REQ-155–166 are capture/KB/library.
- **Coverage** — REQ-149's nine ACs and seven decisions each map to exactly one story (AC-1/3/4/5/6/7/8 → STORY-94; AC-2/9, D4, D5, D7 → STORY-95); REQ-111 → STORY-95; REQ-113 → STORY-96.
- **Tier-3 implementation** — `tools/generate/src/deploy/` is gone and `publish/` is the only path; `parseRoute` (`apps/public-site/src/routes.ts:112-141`) has no draft/sha branch; the only `manifest.json` mention left is the historical seam comment at `site-store.ts:10`; `router.ts:579-593` and `:640` carry D4's redirect and D2's slug refusal.

## Recorded as info, not findings

- `tools/generate/src/cli/serve.ts:71-75` still cites the false "Cloudflare Pages serves that at `/<slug>`" premise. STORY-96 documents it as drift, so the matrix is accurate — but it has now survived three cycles and is a one-line comment fix that would let that paragraph leave the story body.
- STORY-96's `fields.updated_by` is still unset even though its body now records REQ-149 D7; the field is a scalar and setting it would displace nothing useful.

The six-attempt chain was one root cause worked outward: BUNDLE-20's 2026-08-31 reconciliation rewrote STORY-94 and STORY-95, never reached STORY-96 (attempt 5) or the capability body above them (attempt 6). Both are now consistent with REQ-149 and with the code. Read-only throughout — no tickets, tests or code modified.
