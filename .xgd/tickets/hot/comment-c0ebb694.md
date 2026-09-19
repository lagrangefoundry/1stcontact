---
uid: comment-c0ebb694
id: COMMENT-3264
type: comment
title: Comment on story STORY-104
created_by: xgd
created_at: '2026-09-19T14:50:18.893744+00:00'
updated_at: '2026-09-19T14:50:18.893744+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: story-7f437d57
  kind: note
---

## Reconciliation pass — BUNDLE-27 item 9 (BUG-42, transcript half): already applied, verified 2026-09-19

This call found item 9's mutations already present on this story and re-verified
them against the code on `reconcile-BUNDLE-27` rather than re-deriving them. No
body or criterion was rewritten, because rewriting identical text would be churn
and would obscure the earlier edit in history.

**What was already applied** (ticket commits dated 2026-09-14, on this branch and
on main):

- **AC-1063** (`acceptance_criterion-871fba3a`) carries the ordering precondition:
  replay does not begin until the markdown engines have settled; the wait runs
  alongside the opening of the conversation and costs no more than the slower of
  the two; it applies to the pane's own "could not be opened" note because that
  note is markdown too; and an engine that genuinely cannot load settles the wait
  exactly as a loaded one does, yielding readable escaped text rather than an
  indefinite wait.
- **AC-1816** (`acceptance_criterion-c8dcd861`) — added — states the shared engine
  pair: one renderer and one sanitizer for every markdown surface in the
  workspace, their loading started a single time whichever surface is reached
  first, and a readiness that settles in both outcomes and never reports failure.
- The story's Description carries the Replay wait and the "One renderer for the
  workspace" bullet; Technical Context records the engines as a waited-for
  dependency rather than a disclaimed gap; and Reconciliation Decisions of
  2026-09-14 record the three judgment calls (the withdrawn "no criterion asserts
  rendered markdown" disclaimer, stating the shared-engine guarantee once here,
  and keeping the injectable readiness seam out of the criteria as a test
  affordance).

**Code re-checked this pass** (no runtime code touched):

- `apps/control-app/src/builder/markdown.js` — `markdownReady` is
  `Promise.all([loadMarked().catch(…), loadSanitizer().catch(…)])` evaluated at
  module scope, so the loads start at import and the promise settles on either
  outcome and never rejects. `renderSafe`, the two engine seams and
  `markdownEngineReady()` are re-exported from this one module.
- `apps/control-app/src/builder/app.js` (`showSite`) — `await Promise.all([openSession(slug), markdownReady])`,
  with the generation guard taken before the await and re-checked after, and the
  `catch` branch awaiting `markdownReady` before writing its failure note.
- `apps/control-app/src/builder/chat.js` — imports `./markdown.js` for its side
  effect and fires no loader of its own; `reader.js` and `library.js` take their
  engines from the same module.

Conclusion: the matrix already says what the code does for this item. Criteria
count unchanged: 0 stories rewritten, 0 ACs modified, 0 added, 0 removed on this
call. `uat_coverage` deliberately untouched — it belongs to the UAT coverage
check and fix steps.
