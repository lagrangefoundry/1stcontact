---
uid: report-f700fb44
id: REPORT-2042
type: report
title: 'Fix Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata
  & Generated Images (uat) — attempt 1'
created_by: xgd
created_at: '2026-08-16T01:44:54.544828+00:00'
updated_at: '2026-08-16T01:44:54.544828+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2d32662d
  level: uat
  fixes_applied: 8
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-7ef6a9ea
---

# Fix Summary — Site Authoring Beyond The Element Tree (uat)

**Attempt**: 1
**Fixes applied this call**: 8
**Violations remaining**: 0
**Needs more work**: false

All four actionable findings (1 violation, 3 warnings) were `uat-edit`, and all four
are addressed in `tests/reconciliation-beyond-l1-authoring.test.ts`. Every edit is
additive: no existing assertion was weakened or removed.

**METHOD LIMIT — the suite was NOT executed.** This session's permission mode refused
`npx vitest`, `pnpm test`, `node_modules/.bin/vitest` and `tsc --noEmit` alike (the same
constraint report-aabaf2e1 records as its finding #7). Every new assertion is therefore
justified by reading the production code it drives, not by a green run. The specific
readings each new assertion rests on are named below so the assessor can check them
cheaply. If the assessor can run the suite, that is the outstanding verification.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1099 / test_UAT_AC1099 (finding 1, the violation) | Added the accepted-presentation case **through the Toolbox**: `add_component` with the declared `presentation` param (`{ slide: [{kind:'text', text: REVIEW_COPY}] }`) on a second seeded carousel seam, asserting the stored `slots.slide` equals what was supplied and that the copy reaches the render. The surface's `presentation` key now has direct evidence; a mis-wire at `toolbox.ts:312` fails this test |
| 2 | uat-edit | AC-1099 / test_UAT_AC1099 (finding 2a) | Replaced the near-vacuous `typeof node.kind === 'string'` with `expect(node).toEqual(readPage().modules[0].slots.form)` — the read hands back exactly the stored subtree, which is what `editL1Get` promises (`edit.ts:595-611`, `resolveSegment` returns the stored node verbatim) |
| 3 | uat-edit | AC-1099 / test_UAT_AC1099 (finding 2b) | Added the missing **module-scoped `set_l1` round-trip**: find the text segment inside module `signup`, read it, write it back with new words, assert the stored `slots.form` carries the replacement (and no longer the original) and that the rendered page contains it. This is the AC's "read **and replaced** through the element-tree write path" clause, which had no evidence anywhere in the repo |
| 4 | uat-edit | AC-1096 / test_UAT_AC1096 (finding 3) | Kept the observable refusal, documented **why** it is the one a caller receives, and proved the criterion's "how to write a single setting instead" clause by *following* it: the group-plus-object form is accepted immediately after the refusal, writes the setting the refused call meant, and leaves the site's other settings whole. See the ac-level tail below |
| 5 | uat-edit | AC-1109 / test_UAT_AC1109 (finding 4) | Added `1c module set --config` ↔ `configure_component` to the CLI/surface pair, with the merged config asserted (`submitLabel` changed, `action` preserved) |
| 6 | uat-edit | AC-1109 / test_UAT_AC1109 (finding 4) | Added `1c module rm` ↔ `remove_component`: a second seam (`spare`) is seeded in `beforeEach`, an instance is added and removed on both sides, and the closing assertions check the page ends at `['signup']` with the `spare` seam still in the L1 tree |
| 7 | uat-edit | AC-1109 / test_UAT_AC1109 (finding 4) | Added a **replacing** `asset write --content REDRAWN --force` ↔ `write_image {replace:true}`; the closing assertions now require the redrawn bytes under the one name on **both** roots and `assets` to equal exactly `['wordmark.svg']` (the scaffold starts at `assets: []`, `scaffold.ts:36`), so replacing is proven not to be a second asset |
| 8 | uat-edit | AC-1107 / test_UAT_AC1107 | Hoisted the redrawn mark to a shared `REDRAWN` constant now that two tests need it; AC-1107's assertions are byte-for-byte the same value as before |

## Why each new assertion should hold (static justification)

- **`node` equals `modules[0].slots.form`** — `pageSegments` (`toolbox.ts:186-202`) pushes each
  module slot root first, so the first `module === 'signup'` segment is path `0`; `contact-form`
  declares exactly one slot, `form` (`packages/framework/src/modules/contact-form/meta.ts:58-62`),
  so the scoped read cannot land in a different slot; `presetSlots` stores `form` as a single node,
  not a list (`packages/framework/src/l2/presets.ts:23-29`), so `0` is the whole subtree.
- **The text segment's label is `What do you need?`** — with `twoFields`, `contactFormPreset`
  (`l2/contact-form.ts:103-116`) emits a text run only for the visibly-labelled field (`email` is
  `labelMode: 'placeholder'`, `submit` is a control), and `labelOf` returns a text node's own words.
- **Module-scoped `set_l1` writes back** — `segmentRoots`/`writeSegmentRoots` (`edit.ts:320-397`)
  resolve and re-store the addressed slot; the node written is the stored node with only its `text`
  changed, so nothing else can fail contract re-validation.
- **`presentation` on the surface** — declared in `l1-surface.json` (`add_component.params.presentation`,
  type `object`) and bound to `slots` at `toolbox.ts:312`; the payload is the same shape the CLI branch
  already passes through `--slots` and that `editModuleAdd` consumes at `edit.ts:1030`.
- **`--force` on `asset write`** — `force` is in `BOOLEAN_FLAGS` (`cli/args.ts:11`) and reaches
  `editAssetWrite` (`index.ts:1234-1239`), whose replace path rewrites the one registry entry
  (`edit.ts:1464-1481`) exactly as `write_image {replace:true}` does via `toolbox.ts:345-350`.

## Code Edits

None. Every fix was a test edit.

## needs_review Items Forwarded

None were categorized `needs_review`. Two things are forwarded for the assessor rather than
guessed at:

| Item | What is unresolved | What is needed |
|---|---|---|
| **Execution** | The suite could not be run in this session (permission mode refuses vitest/tsc, as it did for the assessor). Assertions are statically justified above but unverified | A run of `tests/reconciliation-beyond-l1-authoring.test.ts` in a session that may execute it |
| **AC-1096's `ac`-level tail** (the assessor's own note) | `editConfigSet`'s top-level non-object refusal (`edit.ts:1189-1196`) and its hint are unreachable from both boundaries — the CLI takes the key positionally and `requireArg` rejects `''`/undefined (`index.ts:1215-1219`, `1341-1350`), and the surface declares `settings` as a required `object`, so the declaration's own shape check fires first. I did not contort a test to assert unobservable text; instead the test records the reason in a comment and proves the *advice* is actionable | An `ac`-level follow-up if AC-1096's wording should stop describing a hint no caller can observe |
