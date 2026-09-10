---
uid: comment-3dabcd70
id: COMMENT-2446
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T03:20:06.323016+00:00'
updated_at: '2026-09-10T03:20:06.323016+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-41ef7a56
  kind: note
---

**PASS** — `REPORT-3647` (`report-41ef7a56`). 0 violations, 0 warnings, 0 needs-review.

**What I checked (level=uat, attempt 2):**

- **Ledger**: single-origin. CAP-105 → one story (STORY-123, `feature`) → `bundle-b3b7c399` carrying REQ-152 (`free_and_reconciled`, merged `eef7a8b4`). No `updated_by` chain on the capability, story, or any of the nine ACs; REQ-151 is upstream-only (CAP-104). No retired/abandoned intent touches the tree, and no story/AC text names an abandoned vehicle ticket, so Step 2.5 didn't trigger.

- **Coverage**: nine active ACs, nine matrix-keyed UATs in `tests/reconciliation-money-time-formatting-seam.test.ts`, one per AC. I ran it: **9 passed / 9**.

- **Consistency**: read every test body against its AC's Verification clause. Each exercises the real entry points (`formatMoney`/`formatDateTime`, `renderSiteFiles`, `renderL1Page`) against real ICU output, with fixed instant literals so nothing is date-dependent.

- **Exclusivity**: the duplicate FC suite is gone, and nothing under `tests/`, `packages/`, `tools/`, `apps/`, `vitest.config.ts` or `package.json` still references `REQ-152_intl_seam`.

**Attempt-1's three findings, re-verified rather than assumed:**

| Finding | Now |
|---|---|
| AC-1443 UAT proved only the sub-class the code handled | closed — `…test.ts:255-273` adds the day-of-month-overflow class plus a positive control |
| `formatDateTime` formatted `2026-02-30` instead of refusing | closed — `packages/framework/src/intl.ts:167-172` + `:208-210` |
| Duplicate FC test suite | closed — file deleted, no dangling refs |

Two things I confirmed non-vacuous rather than taking on faith: AC-1445's clock scan passes because the three `new Date()` hits under `packages/framework/src` are all prose in comments (the exact distinction the AC draws), and its scope leaves no real hole — the `new Date()` calls in `tools/generate/src` are all in capture, publish metadata and journal/store code, none on the HTML render path. AC-1446's `DOC-34 §8.4` assertion also points at real content (`doc-2b91ec43:226-234` carries the resolution), not a dangling reference.
