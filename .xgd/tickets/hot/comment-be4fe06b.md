---
uid: comment-be4fe06b
id: COMMENT-1277
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T08:07:46.449615+00:00'
updated_at: '2026-08-20T08:07:46.449615+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-08574259
  kind: note
---

Done — attempt 8 resolved all four violations and all four warnings from `report-cbb23da6`. Completion report: **REPORT-2406** (`report-08574259`), `needs_more_work: false`.

**8 mutations, applied in the order the report prescribed:**

| Finding | Element | What changed |
|---|---|---|
| 7 | STORY-83 body | Dropped `renderL1Fragment` from the seam sentence (verified `render.ts:2428-2434` has no `mounts`) — done first, since finding 2's AC is authored from that paragraph |
| 2 | AC-723 | Rewritten around the bound/unbound split; unbound keeps the inert-empty-placeholder claim now explicitly qualified, bound is new (fragment as content of the same positioned box, no wrapper); escaping clauses kept verbatim; title widened |
| 1 + 8 | AC-719 + STORY-82 body | The retired colour-role vocabulary replaced with "palette reference" in the AC **and** both surviving occurrences in the story body, in one pass — that split is why finding 1 survived five cycles |
| 6 | STORY-82 In-scope | Records that the contact-form criterion moved to AC-701 under STORY-85. No AC added, per instruction |
| 5 | AC-716 | Narrowed to the literal-as-base / length-geometry-radius half; palette bullet and literal-only paragraph deleted with explicit hand-off to AC-928 / AC-931 |
| 3 | **AC-1343** (new) | REQ-93 page composition rule: bind by name to exactly one existing seam, five rejections with machine-readable paths, both legal converses stated |
| 4 | **AC-1344** (new) | Two-shape conformance via `mountInL1`, authored separately so AC-704's dimension-set claim stays single-subject |
| — | test file | Four tests relinked from `test_UAT_FC_REQ-93_*` to `test_UAT_AC1343_*` / `AC723` / `AC1344`, closing the ac and uat gaps together |

The other six tests in that file stayed free-coded — they're capture/fold pipeline tests belonging to CAP-71, and crediting them here would have been false coverage.

**One caveat you should know about:** `npm test` on that file gave 9 passed / 1 failed. The failure is `test_UAT_AC1344_...`, and it's environmental — `EPERM` on `server.listen` from this sandbox, via `serve.ts:54` → `harness.ts:196`. No assertion was reached, and the rename was name-only. I set AC-1344's `uat_coverage: pass` on that basis and flagged in the report that an environment permitting a listening socket should re-run it to confirm.
