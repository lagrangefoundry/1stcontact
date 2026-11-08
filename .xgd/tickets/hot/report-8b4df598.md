---
uid: report-8b4df598
id: REPORT-11572
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-42'
created_by: xgd
created_at: '2026-11-08T20:53:13.558581+00:00'
updated_at: '2026-11-08T20:53:13.558581+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-42
---

## Files resolved

- `apps/control-app/src/builder/main.js` — UU, code file (2c). Rule applied: 2c.2, non-overlapping changes combined.
  The only conflict hunk was in the import block. Each side added a different import line:
  - HEAD (reconcile, bundle-0d00566a): `import { validateSvg } from '/framework/site-schema-svg.js'`, used in the `editBridge` object (REQ-210).
  - Incoming 6b8ae21bac ("builder: carry the page across a channel switch", REQ-215): `import * as pageState from '/framework/page-state.js'`, passed to `mountBuilder` as `pageState`.
  Kept both lines. They don't compete: both modules are used further down the file, and both URLs are mapped in `tools/generate/src/cli/assets.ts` (`page-state` at line 88, `site-schema-svg` at line 107).
  The enrichment rule ("intent unknown on one side → take the more recent commit") didn't need to pick a side, because the two changes don't overlap and both are kept. **Flagged for post-merge review** as the enrichment asks.

## Incoming changes preserved

- `apps/control-app/src/builder/main.js`: `git diff 6b8ae21bac -- apps/control-app/src/builder/main.js` shows that the resolved file differs from the incoming commit's version only by HEAD's `validateSvg` additions (the import, two comment lines, and the `editBridge` entry). All 8 lines the incoming commit added are present: the `pageState` import, the REQ-215 comment block, and the `pageState` property.
- The other 16 files in the commit merged cleanly and are staged unchanged.
- No hunks were dropped. BUG-1301 precedence did not apply.

## Notes

- Staged with `git add`. No UU/AA/DU/UD entries remain in `git status --porcelain`. CHERRY_PICK_HEAD is still present (6b8ae21bac).
- No tests were run. Only 8% of the tree is in the sparse checkout, and full-suite runs are out of scope for this step.
- Unrelated items were not touched: unstaged `.xgd/_changes/log.ndjson` and `.xgd/_changes/meta.json`, and the untracked `.xgd/tickets/hot/report-740acda0.md`.
- An earlier turn of this session tried `git cherry-pick --continue` before the workflow instructions were given. The don't-ask mode refused the call, so it never ran, and the sequencer state is intact.
