---
uid: report-64492e7e
id: REPORT-3686
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 3'
created_by: xgd
created_at: '2026-09-10T07:00:31.003456+00:00'
updated_at: '2026-09-10T07:00:31.003456+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 3
**Fixes applied this call**: 6
**Violations remaining**: 0
**Needs more work**: false

Both violations were in one test function, as report-f3cb7d00 said, and the warning was one
leftover loop in another. All three are repaired; no finding was left for a later iteration.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1620 (finding 2) | `test_UAT_AC1620_the_toolbox_edits_through_the_store_it_was_given` now reads and writes one segment through the tools: `get_l1` at `'0.0'`, then `set_l1` with a whole replacement element, and the node is read back through `store.readPages(slug)` — the injected store, not the tool's own answer (tests/reconciliation-site-storage-port.test.ts:461-489) |
| 2 | uat-edit | AC-1620 (finding 1) | Same case now reaches the palette **rules**, through the four dedicated tools rather than the `set_config` merge: `add_palette_color` applies; `remove_palette_color` on the unreferenced entry applies; `remove_palette_color` on the seeded, page-referenced `brand-teal` is refused with `CONFLICT` and the entry is asserted still present; `rename_palette_color` is accepted and the reference is asserted to have followed, in the page as the store hands it back (…:491-521) |
| 3 | uat-edit | AC-1620 | The count claims tightened with the new writes: a local before/after around the palette refusal (`beforeRefusal`, …:512,516) proves a refusal moves nothing, and the closing total rose 2 → 6 — one per accepted write (`set_config`, `write_image`, `set_l1`, `add_palette_color`, `remove_palette_color`, `rename_palette_color`), with the two refusals excluded. The exact-6 assertion is what makes the new legs non-vacuous: a tool that answered "not enabled" would fail here |
| 4 | uat-edit | AC-1385 (finding 3) | Dropped the `for (const site of [fs, memory])` render loop from `test_UAT_AC1385_every_storage_question_answers_identically_over_all_three_stores` (was tests/reconciliation-cloudflare-site-store.test.ts:278-287) — a leftover of fix report-4ac04d1b action 3. The `RENDER_QUESTIONS` naming assertions this test uniquely owns are kept, and its comment now says where the questions themselves are asked instead of claiming to ask them here |
| 5 | uat-edit | AC-1385 | Removed the symbols that loop was the last user of — the `PreviewRenderer` and `editAssetWrite` imports and the `SVG` constant — so the file does not carry an unused render apparatus |
| 6 | ac-edit | AC-1620 (acceptance_criterion-ce202d6a) | Report note on finding 2: "what must not happen is the phrase being left to imply a tool that does not exist." The enumerating sentence now names the adapter's own segment verbs — "one segment of a page is read and written back through the segment verbs this adapter exposes — `get_l1` and `set_l1`, where the command line has its copy verbs" — and says the palette leg goes through the dedicated palette tools. The Verification section gains a paragraph stating why a settings merge cannot stand in for the palette rules. Nothing else in the body changed; AC-1324's identical phrase is untouched, because the CLI does have the verb |

Both resolutions offered for finding 2 were applied rather than one: the UAT now asserts the
behaviour (the `uat-edit` as tabled), and the AC now names the surface it actually describes
(the `ac-edit` alternative). They are not in tension — the assessor's constraint was that the
behaviour end up asserted and the misleading phrase not survive.

## Verification

```
npm test -- tests/reconciliation-cloudflare-site-store.test.ts tests/reconciliation-site-storage-port.test.ts
Test Files  2 passed (2)
     Tests  13 passed (13)

npm test -- tests/test_UAT_FC_REQ-142_site_store_port.test.ts      41 passed (41)
npm test -- tests/test_UAT_FC_REQ-143_d1r2_store.workers.test.ts   28 passed (28)
```

The last two are run because of action 4: the render cases the dropped loop duplicated live in
`tests/support/site-store-contract.ts:355,363` and are registered against the filesystem and
memory adapters by the REQ-142 suite and against the D1/R2 adapter by the REQ-143 suite. Both
still pass, so removing the copy removed a duplicate and not the coverage.

`uat_coverage` was deliberately not written on AC-1620 or AC-1385: that field belongs to
check/fix_uat_coverage, and setting it from here would manufacture progress this prompt does not
own.

## Code Edits (if any)

None this call. Both violations and the warning were test-side; no production file was touched.

## needs_review Items Forwarded

None. No finding in report-f3cb7d00 was categorized `needs_review`, and findings 4, 5 and 6
were `info` with resolution `—` (each explicitly recorded as correct as it stands).
