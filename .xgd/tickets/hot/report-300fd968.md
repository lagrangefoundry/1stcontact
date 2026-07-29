---
uid: report-300fd968
id: REPORT-1006
type: report
title: 'Resync resolve conflicts: 006568bd9e49cc7323728e278446fbe1f1e9b96b'
created_by: xgd
created_at: '2026-07-27T21:52:59.853232+00:00'
updated_at: '2026-07-27T21:52:59.853232+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — **UU**, config file, scalar conflict (`version` only).
  Ours `0.0.217` vs incoming `0.0.212` (incoming bumped 0.0.211 -> 0.0.212).
  Rule applied: enrichment metadata's "take the more recent commit by
  timestamp" — the ours-side change (`ef954d3b1`, committed 14:50:59)
  is more recent than the incoming commit (`3cc01cede`, 13:24:37).
  This also preserves version monotonicity: the resync branch has already
  replayed later free-coded bumps, so accepting `0.0.212` would regress the
  version and break `bin/project/xgd_version_bump --check` on subsequent
  promotions. Resolved to `0.0.217`. Flagged for post-merge review per the
  enrichment rule (intent unknown on one side), though the conflict is a
  pure version scalar with no semantic content.

No other conflict classes were present. The remaining 17 files of the
incoming commit auto-merged cleanly (A/M, staged).

## Incoming changes preserved

Verified by blob comparison — for each code/implementation file, the staged
index blob hashes **identical** to the incoming commit's blob:

- `packages/framework/src/index.ts` — identical to incoming
- `packages/framework/src/l1/render.ts` — identical to incoming
- `packages/site-schema/src/l1/schema.ts` — identical to incoming
- `packages/site-schema/src/l1/types.ts` — identical to incoming
- `packages/site-schema/src/l1/validate.ts` — identical to incoming
- `bin/verify_req100_reveal.mjs` — identical to incoming
- `tests/req100-scroll-reveal.test.ts` — identical to incoming (463 lines, 8 UATs)

Non-revert check on `render.ts` (the only file with deletions):
the `-` lines are the incoming commit's own refactor of the interaction /
transition emitter (`interactionRules` + `emitNode` rewritten so entrance and
hover transitions merge into a single declaration set, per the commit body),
not a drop of the already-replayed hover/focus work.

- hover/focus markers: HEAD 27 -> staged 29 (retained and extended)
- reveal/stagger/IntersectionObserver markers: HEAD 0 -> staged 35 (added)

Ordering confirms this is correct rather than a regression: the hover/focus
commit authored 12:51:43 precedes the incoming scroll-reveal commit authored
13:24:37 in xgd-working's history, so the incoming tree already contains the
hover/focus axes.

Net staged change vs HEAD: 17 files, 5292 insertions, 17 deletions —
non-empty, so the cherry-pick will not produce an empty commit.

No conflict-class lines remain in `git status --porcelain`; no conflict
markers remain in the tree. CHERRY_PICK_HEAD left intact for the next step.
