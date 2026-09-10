---
uid: comment-22495d35
id: COMMENT-2571
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T17:47:47.975181+00:00'
updated_at: '2026-09-10T17:47:47.975181+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ca4d11ce
  kind: note
---

Both violations and the one warning are closed. REPORT-3770 (`report-ca4d11ce`) filed.

**4 mutations:**

| Element | Change |
|---|---|
| AC-1111 | "assert **its one field**" → assert the panel's **background-image field** declares it and the **fill field beside it** does not — per the assessor's suggestion, a stale count becomes a second instance of the by-kind-of-field discrimination. Also fixed the same sentence's stale "its field" for a run of copy → "none of its fields". |
| AC-991 | Verification's "fields of **four of the five** shapes" → "**all five**". Criterion already said five. |
| AC-982 | Criterion now opens "…**from the command line**" (warning 4), so it no longer asserts a re-render without naming the producer. |
| `reconciliation-copy-edit-field-format.test.ts` | Paired with AC-1111: added the `surfaceFill` carries-no-`format` assertion its revised verification now asks for. |

Verified in `edit.ts` before editing — a painted panel pushes `backgroundImageUrl` conditionally then `surfaceFill` unconditionally (`:1022-1046`), and a run yields all five members of the `:187` union. Code and tests were already right; only the prose was stale. No code edits.

Tests: field-format 1/1, typography 9/9 (the wrangler `EPERM` log line is a sandbox artifact, not a failure).

Two things worth flagging:

**I ran the report's own successor rule rather than deferring it** — grepping all 43 ACs for repeated counts. It found **no third instance**, so the two violations were the complete set. Two method traps are worth recording, because the naive scan reports clean either way: `xgd ticket list` truncates at 50 and returned only 11 of this story's ACs unfiltered (needs `--no-limit`), and because bodies are hard-wrapped, a line-based grep splits "assert its one" from "field declares" and misses AC-1111 — the AC under repair. Sentence-granularity matching on whitespace-collapsed text is what makes it find its own target.

**Left undone deliberately:** `test_UAT_AC991_every_field_is_one_of_four_closed_shapes…` and its opening comment still carry the pre-colour count in the *name*, while the assertions test all five. The report places that at the `uat` level, so with AC-991 fixed the test name is now the last carrier — forwarded rather than renamed.

I did not touch the capability's `uat_coverage: fail`; that field belongs to `check`/`fix_uat_coverage`.
