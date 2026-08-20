---
uid: comment-5bf8fa25
id: COMMENT-1334
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T16:16:14.510107+00:00'
updated_at: '2026-08-20T16:16:14.510107+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-9e960561
  kind: note
---

Done — the single violation is fixed and the completion report is filed as REPORT-2469 (`report-9e960561`).

## What I changed

Two mutations, both on **AC-1329** (`acceptance_criterion-ae2c7f77`), category `ac-edit`:

1. **Retitled** to "The split cost nothing the single runtime provided" — dropping the "and changed no assertion" half, which the demotion paragraph had already reassigned to a one-time reconciliation measurement.
2. **Scoped bullet 4 and the Verification's final sentence** to *behavioural* assertions, with an explicit exemption for the probes AC-1328 owns.

Bullets 1–3, the demotion paragraph, and REPORT-2467's scoping paragraph survive verbatim. I touched neither AC-1328 nor any test — the report was explicit that the over-broad AC is the wrong element to fix by editing its sibling.

## The one place I went past the suggested edit

The report's suggested exemption named only the user-agent probes. Reading the two workers-marked files showed that would have reproduced the exact defect the report named as a twice-repeated pattern, one axis over:

| Assertion | Required by AC-1328 | Covered by suggested wording? |
|---|---|---|
| `userAgent === 'Cloudflare-Workers'` (`:19`, `:32`) | yes | yes |
| `typeof caches === 'object'` (`:21`, `:33`) | yes | **no** |
| D1 `sqlite_master` read-back + engine-enforced PK | yes | **no** |
| R2 server-computed `size`/`etag` | yes | **no** |

None of those are makeable in the filesystem runtime, so the narrower exemption would still have left AC-1329 forbidding what AC-1328 requires. The landed wording exempts everything AC-1328 owns — the routing probes *and* the Workers-only bindings.

Verified the criterion now holds: `origin/main` has exactly two `*.workers.test.ts` files, and every runtime-conditioned assertion in either is an AC-1328-owned probe.

## Notes

- **Story-body pairing checked, none needed.** STORY-118 carries no In-scope bullet with the retired claim; its suite-state attribution paragraph is the correct home the demotion points at. The "Known divergence" paragraph is intact.
- Findings 2–6 are all `info` with no resolution category; finding 5 (AC-1353/AC-1354 UAT naming) is a uat-level item the assessor marked "none at this level."
- `xgd report create` printed `fatal: Could not read from remote repository` — that's the sandbox having no network for the push. The ticket was created and committed locally; fields verified as read back.

Declared `needs_more_work: false`, `progress_made: true`, `violations_remaining: 0` for the assessor to verify.
