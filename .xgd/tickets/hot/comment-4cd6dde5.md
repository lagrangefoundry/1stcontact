---
uid: comment-4cd6dde5
id: COMMENT-2639
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-11T00:17:44.274898+00:00'
updated_at: '2026-09-11T00:17:44.274898+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d48216d3
  kind: note
---

Attempt 5 complete. **REPORT-3820** (`report-d48216d3`) filed — `progress_made: true`, `needs_more_work: true`, `violations_remaining: 0`.

## All three violations closed

Every one was resolved as the report's Notes directed — an additive assertion inside the test that already opens the right dialog. No AC body edited, no AC created or deprecated, no production code changed.

| Finding | Fix |
|---|---|
| **1** — AC-1039's title clause unproven | `form-presentation.test.ts` now asserts the sheet's `.fields-label` set equals the origin's labels for non-colour parameters, and `.builder-color__label` equals those for colour ones — exact both ways, across both control families |
| **2** — AC-997's three-control merge | `image-picker.test.ts` now drives tile + alt text + a framing parameter (name read from the origin's descriptors), asserts one POST carrying all three. Replaced the `:689` whole-`axes` equality — which could never survive a framing edit — with a descriptor-driven untouched-parameters loop |
| **3** — AC-1123's row order | Added `sheetOrder()` and asserted the sheet sequence equals the descriptor sequence, on the run **and** the picture, where the interleave has more than one plausible shape |

Also did warning **4** (AC-1044's REQ-135 precondition + picker focus) and info **10** (stale AC-1138 comment).

## Two things worth your attention

**The webui gate was hiding everything.** Finding 9 said the gated evidence isn't producible here. Half of that is wrong — the `@lagrangefoundry` store exists at `/Users/martin/lagrangefoundry/node_modules`, just unreachable from a worktree. One gitignored symlink fixes it. Before: `npm test` reported **10 passed in 1.5s**, every gated assertion skipped, suites green. After: **140 tests across the capability actually execute**. Any prior `uat_coverage: pass` earned in an unlinked worktree proved nothing. I've updated the memory.

**I proved each assertion bites** rather than trusting a green run. Inverting the production behaviour each one pins made it fail, then I reverted (`editor.js` diffs identical to baseline). The AC-1039 probe is the telling one: dropping the sheet labels globally left the entire `req121-copy-modal-elegance` suite green and only the new assertion caught it — exactly the hole the finding described.

Two of my own assertions were wrong on first run and the suite caught them: `mountFields` suffixes required labels with `*`, and boolean rows render an always-live checkbox control. Both are now handled with the reason stated inline.

Verification: 140 tests across 22 suites, no failures, no regressions. `git status` shows four modified test files and nothing else.

Warnings **5** (AC-1040's transparent-no-glyph backstop) and **6** (AC-1050's colour-lands clause) remain — both need fixture or harness work I'd rather do carefully next iteration; the plan for each is in the report.
