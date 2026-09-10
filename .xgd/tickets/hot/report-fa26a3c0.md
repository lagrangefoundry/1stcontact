---
uid: report-fa26a3c0
id: REPORT-3679
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (ac) — attempt 1'
created_by: xgd
created_at: '2026-09-10T06:19:34.515874+00:00'
updated_at: '2026-09-10T06:19:34.515874+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: ac
  fixes_applied: 5
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (ac)

**Attempt**: 1
**Fixes applied this call**: 5
**Violations remaining**: 0
**Needs more work**: false

Both violations in report-cd91df2c were `ac-add` coverage gaps under STORY-118
(`story-3f4a5f2b`) — behaviour the story body claims in as many words, landed in the tree,
and stated by no acceptance criterion. Neither existing AC was wrong, so nothing was edited
or deprecated and no story body was touched (the report's Notes say the repair is "two new
ACs under STORY-118 and nothing else").

Because the report identified precisely where the first gap bites — the shared assertion body
`tests/support/site-store-contract.ts` carried no revision assertion, so the memory adapter's
five revision verbs were asserted nowhere — the new ACs were paired with the UATs that close
that hole in the same call, and all of them run and pass.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-add | AC-1619 (`acceptance_criterion-e045b3e3`) under STORY-118 | "The revision storage verbs are the same declared set, answered by every adapter". Written as a **port-level claim over every adapter** (filesystem, filesystem-free, cloud), per the report's note that a filesystem-only wording would leave STORY-121's identical sentence uncovered and require a second AC. Names both cases — a site that has published and one that has not — and requires verification through the shared assertion body rather than only through CAP-82's publish tests. Intent: REQ-149 (`request-554ac441`, free_and_reconciled, 2026-08-17) |
| 2 | ac-add | AC-1620 (`acceptance_criterion-ce202d6a`) under STORY-118 | "The assistant's tool adapter edits through the store it was given" — the third consumer STORY-118's In-scope list names and no AC covered. States that the store is a parameter, not a lookup: a supplied store displaces the `fsSiteStore(ctxOf(opts))` fallback the `1c` host uses, and the adapter's site-editing tools complete with no filesystem tree present, refusing with the same envelope. Intents: REQ-142 (`request-0dd62a5d`), REQ-146 (`request-0cdfdc5b`), both free_and_reconciled 2026-08-15 |
| 3 | uat-add | AC-1619 | `tests/support/site-store-contract.ts`: `UAT_FC_REQ-149 AC-1619 a site that has never published answers the revision verbs emptily` — empty revisions, null draft base, null read, for the fixture slug and for a slug the store holds nothing for |
| 4 | uat-add | AC-1619 | Same file: `UAT_FC_REQ-149 AC-1619 a frozen revision lists, reads back and re-parents the draft` — freezes a revision through `writeRevision` (definition, pages, asset bytes, rendered `out`), asserts it lists, reads back with its bytes intact, is unmoved by a later draft write, and that `setDraftBase` changes only what the draft descends from. Placed in the shared body deliberately, so it registers against **all three** adapters |
| 5 | uat-add | AC-1620 | `tests/reconciliation-site-storage-port.test.ts`: `test_UAT_AC1620_the_toolbox_edits_through_the_store_it_was_given` — builds the real toolbox via `createL1Toolbox(slug, opts, { store })` against the filesystem-free fixture (no cwd, no site tree), runs `describe_page`, `set_config`, `write_image`, `list_changes`, and reads every result back out of the injected store; asserts the conflict envelope and that the counter stands at exactly 2 (two accepted writes, one refusal moving nothing) |

`uat_coverage` was deliberately **not** set on either new AC — that field belongs to
check/fix_uat_coverage, which can verify the tests named above rather than take this call's
word for it.

## Verification

All runs completed in this call, on the current tree:

| Suite | Runtime | Result |
|---|---|---|
| `tests/test_UAT_FC_REQ-142_site_store_port.test.ts` | node (fs + memory adapters) | 41 passed — includes both new REQ-149 cases over **each** adapter |
| `tests/test_UAT_FC_REQ-143_d1r2_store.workers.test.ts` | workerd, real D1/R2 bindings | 26 passed — includes both new REQ-149 cases over the cloud adapter |
| Both together after the final rename | both projects | 67 passed, 0 failed |
| `tests/reconciliation-site-storage-port.test.ts` | node | 9 passed — includes `test_UAT_AC1620_…` |

No previously-passing test changed behaviour; nothing outside the two test files and the two
new tickets was modified.

## Code Edits (if any)

None. No production code was touched — both findings were coverage gaps against behaviour the
tree already implements (`tools/generate/src/store/site-store.ts:206-233`,
`memory-store.ts:188-230`, `d1r2-store.ts:666-795`, `cli/ai/toolbox.ts:186`).

## Findings Not Requiring Edits

Findings 3, 4 and 5 are `info` with an explicit "none" in the report's suggested-edit column
(AC-1385's named render exception, the deliberate AC-1325/AC-1385 overlap, and the
cross-capability layering of AC-1327 / AC-1033 / AC-1447). No action taken, by design.

## needs_review Items Forwarded

None — the report categorised no finding as `needs_review`.
