---
uid: report-d8e415e5
id: REPORT-12025
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-44'
created_by: xgd
created_at: '2026-11-09T21:08:58.985813+00:00'
updated_at: '2026-11-09T21:08:58.985813+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-44
---

## Files resolved

- `apps/control-app/src/imagegen.ts` — UU, code file (2c). Rule: non-overlapping changes, combine both sides. HEAD (bundle-c0301347) added `replaceIgnoringCase`, `IMAGE_OPERATIONS` and `vendorless()` (scrubs vendor/model names from failures the model reads); incoming 95115741c0 added `generatedDisplay()` (REQ-217 display sentence). Both are independent functions inserted at the same anchor and both are called later in `imageSurface` (`display: generatedDisplay(...)` at line 450, `vendorless(surface, ...)` at line 460), so both were kept, one after the other, each with its own closing braces. No conflict markers remain.

## Incoming changes preserved

Every hunk of `git show 95115741c0 -- apps/control-app/src/imagegen.ts` is present in the resolved file:
- `import { displayLine } from '../../../tools/generate/src/cli/ai/toolbox-core'` (line 46)
- `generatedDisplay()` with its doc comment (line 347)
- `ImageSurfaceOptions.materialUrl?: (uid: string) => string` (line 383)
- `...(opts.materialUrl ? { display: generatedDisplay(opts.materialUrl) } : {})` in the `create_image` options (line 450)

HEAD's `vendorless()` hunk is also preserved. No hunk was dropped.

## Notes for post-merge review

- `tsc --noEmit -p apps/control-app` reports no errors attributable to the resolution; `imagegen.ts` errors are only the unbuilt `./generated/*` modules, which are missing app-wide in this worktree.
- Pre-existing on HEAD, unrelated to this cherry-pick: `router.ts` declares `IMAGES` twice with different types (`ImagesBinding` vs `ImagesLike`; HEAD lines 584/631). The cherry-pick's `router.ts` hunks do not touch those lines.
