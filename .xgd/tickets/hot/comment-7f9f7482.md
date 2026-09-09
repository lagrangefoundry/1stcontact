---
uid: comment-7f9f7482
id: COMMENT-2382
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-09T23:51:55.317901+00:00'
updated_at: '2026-09-09T23:51:55.317901+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a5ba5dc9
  kind: note
---

Attempt 7 complete — 9 of 12 violations addressed, 11 mutations landed.

## What I did

**STORY-75 — the five predicted coverage gaps (findings 1–5), six new ACs:**
- **AC-1605** (BUG-25) — a run's extent is measured off its own text node when the element owns more than one run
- **AC-1606** (BUG-22) — split-control surface axes resolve against the backing box, not the paired text node; inert on a pre-BUG-22 bundle
- **AC-1607** (BUG-16) — offline re-extract rewrites font references to the bundle's mirrored faces
- **AC-1608** (BUG-24) — the band overlay as its own axis, resolved through the canvas colour probe so a `color-mix`/`oklch` veil captures like an `rgba` one
- **AC-1609 / AC-1610** (REQ-73) — the adjacent-row gap axis (6px / 16px `--tolerant`), and the band-padding proxy being *dropped* rather than kept alongside it

**STORY-76 — the three-finding cluster, applied together as report note 2 requires:**
- **Story body (finding 9)** — restored an In-scope clause for the retained *validation* leg and narrowed Out-of-scope to the *resolver* path, so AC-638 is no longer an orphan its own story excludes
- **AC-638 (finding 6, fifth filing)** — palette-role stop moved from the accepted to the rejected side per REQ-114. I verified this against the call graph (`validateGradient` → `validateColor` → `isColorLiteral`), not the two stale comments at `validate.ts:131` and `:167-168` that report note 3 flags as the likely reason this survived five cycles
- **AC-1611 / AC-1612** (findings 7, 8) — the four-clause surface-gradient ancestor selection, and REQ-72's in-browser hexification that keeps AC-634/635/636 from being vacuous

I also extended `test_UAT_AC638_...` with the role-stop rejection so the edited AC isn't left stale — **4/4 pass**. The suite initially wouldn't import at all (`Cannot find module './generated/ai-workers.js'`), which is the known worktree artifact; `./bin/1c assets` fixed it, and no `dist-assets.staging/` was left behind.

## Remaining

Findings 10–12 (STORY-77's `--multi-viewport`, `--collapse`, `--clusters` reporting stack) plus warnings 13 and 14, all itemized with a plan in `report-a5ba5dc9`. Declared `needs_more_work: true, progress_made: true` — the loop should call back.

One thing worth surfacing beyond this level's mandate: the two stale comments in `validate.ts` are comment-only, so I left them, but they'll keep misleading anyone who verifies AC-638 from nearby source instead of the call graph.
