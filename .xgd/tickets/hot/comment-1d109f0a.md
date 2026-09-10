---
uid: comment-1d109f0a
id: COMMENT-2527
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T12:11:11.781075+00:00'
updated_at: '2026-09-10T12:11:11.781075+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-95952096
  kind: note
---

Report filed: **REPORT-3728** (`report-95952096`) — `result: fail`, 1 violation, 1 warning, 0 needs_review.

## What I found

The AC level has largely converged. I read all 108 ACs across the 7 stories and re-verified every prior finding against live ticket bodies and against code on this branch rather than trusting the fix reports.

**Repaired since REPORT-2093 (4 of 6):**
- **AC-718** — all four drifts gone: no runtime-type "capability" anywhere, single required `form` slot with `submit` as a `control`, current config set, `labelMode` reframed as a captured a11y fact. Verified against `contact-form/meta.ts`.
- **AC-719** — "named overlay role" → "reference to a site palette entry", now agreeing with AC-935/AC-928.
- **The REQ-93 `ac-add`** — AC-1623 (page-level binding) and AC-1624 (`mountInL1`) were authored this cycle. I checked them against code, not against the story text: all five rejections *and every error path* in AC-1623 match `schema.ts:569-635` exactly, and it correctly records the orphan seam as legal — so the cascade attempt 8 was written to prevent did not materialise. AC-1624 matches `harness.ts:105-145`.
- **The `steps` warning** — REQ-137 moved `bundled` → `free_and_reconciled` since the last cycle, and AC-928/AC-1144/AC-1145 were updated to meet it.

**The one violation** is the other half of REPORT-2093's finding 3, which was never applied. The `ac-add` landed; the `ac-edit` on **AC-723** did not (`updated_at` still 2026-08-09). It still says a slot leaf's placeholder is "an empty element" unconditionally — false under REQ-93, since `render.ts:2164` emits `<div … data-l1-slot="…">${mounted}</div>`. The contradiction is now *inside one story*: the new AC-1622 explicitly scopes the placeholder to the unmounted state and attributes it to AC-723, which doesn't carry that qualification. One clause, not a rewrite — and I flagged in the notes that the fix must not go the other way (AC-1622 is the newer, correct element).

**The one warning** is AC-716's two clauses duplicating AC-928 and AC-931 within STORY-80 — unchanged for a fourth cycle, nothing false, nothing blocked. I recorded it for the ledger rather than as a queue item.

One thing worth flagging: the three new ACs are `pending` while all others are `active`. I checked — that's the ticket type's creation default, and `structural_validation.py:132` enumerates ACs with no status filter, so they aren't exempted from downstream coverage. Recorded as info since the prior cycle read `pending` as a staleness signal.
